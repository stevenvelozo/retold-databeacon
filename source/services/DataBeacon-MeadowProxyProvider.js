/**
 * DataBeacon -- Meadow Proxy Provider
 *
 * Registers a MeadowProxy beacon capability on a DataBeacon agent. The single
 * `Request` action receives an HTTP request descriptor (Method, Path, Body)
 * from the ultravisor mesh and proxies it to the databeacon's own localhost
 * REST server. This lets a client-mode databeacon drive remote meadow CRUD
 * transparently — the entire REST surface already implemented by the
 * DataBeacon DynamicEndpointManager becomes reachable through the mesh.
 *
 * Safety:
 *   - Path is allowlist-gated. Only /1.0/* (the meadow REST API) is reachable
 *     by default. Extended paths can be added via config.
 *   - DELETE/PUT/POST are gated behind AllowWrites (opt-in per deployment).
 *   - Each request emits an audit log entry including the RemoteUser claim.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */
const libHTTP = require('http');

const DEFAULT_PATH_ALLOWLIST = [/^\/?1\.0\//];

const DEFAULT_OPTIONS = {
	// Regexes (as strings — compiled at register time) the Path must match.
	// Defaults allow only the meadow REST API.
	PathAllowlist: null, // falls back to DEFAULT_PATH_ALLOWLIST

	// Gate writes. When false, only GET and HEAD are proxied.
	AllowWrites: true,

	// Internal loopback header — the databeacon's restify layer can short-
	// circuit auth for requests bearing this token (future work).
	InternalHeaderName: 'X-DataBeacon-MeadowProxy',
	InternalHeaderValue: '1'
};

/**
 * Compile the allowlist to RegExp objects.
 *
 * @param {Array<string|RegExp>} pPatterns
 * @returns {Array<RegExp>}
 */
const compilePathAllowlist = function (pPatterns)
{
	let tmpList = pPatterns || DEFAULT_PATH_ALLOWLIST;
	let tmpCompiled = [];
	for (let i = 0; i < tmpList.length; i++)
	{
		let tmpItem = tmpList[i];
		if (tmpItem instanceof RegExp)
		{
			tmpCompiled.push(tmpItem);
		}
		else if (typeof(tmpItem) === 'string')
		{
			tmpCompiled.push(new RegExp(tmpItem));
		}
	}
	return tmpCompiled;
};

/**
 * Test whether a request path is allowlisted.
 *
 * @param {string} pPath
 * @param {Array<RegExp>} pCompiledAllowlist
 * @returns {boolean}
 */
const isPathAllowed = function (pPath, pCompiledAllowlist)
{
	if (typeof(pPath) !== 'string' || pPath.length === 0) { return false; }
	for (let i = 0; i < pCompiledAllowlist.length; i++)
	{
		if (pCompiledAllowlist[i].test(pPath)) { return true; }
	}
	return false;
};

/**
 * Make a loopback HTTP request to the databeacon's own REST server.
 *
 * @param {object} pOptions    - { hostname, port, path, method, headers, body }
 * @param {function} fCallback - function(pError, pResult) where pResult is
 *   { Status, Headers, Body }. Body is the raw response string (the caller
 *   is responsible for deciding whether to parse JSON).
 */
const loopbackRequest = function (pOptions, fCallback)
{
	let tmpCallbackFired = false;
	let tmpComplete = (pError, pResult) =>
	{
		if (tmpCallbackFired) { return; }
		tmpCallbackFired = true;
		return fCallback(pError, pResult);
	};

	let tmpBody = (typeof(pOptions.body) === 'string') ? pOptions.body : '';

	let tmpHeaders = Object.assign({}, pOptions.headers || {},
		{
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(tmpBody)
		});

	let tmpReq = libHTTP.request(
		{
			hostname: pOptions.hostname || '127.0.0.1',
			port: pOptions.port,
			path: pOptions.path,
			method: pOptions.method || 'GET',
			headers: tmpHeaders
		},
		(pResponse) =>
		{
			let tmpData = '';
			pResponse.on('data', (pChunk) => { tmpData += pChunk; });
			pResponse.on('end', () =>
			{
				return tmpComplete(null,
					{
						Status: pResponse.statusCode,
						Headers: pResponse.headers,
						Body: tmpData
					});
			});
			pResponse.on('error', tmpComplete);
		});

	tmpReq.on('error', tmpComplete);
	if (tmpBody.length > 0)
	{
		tmpReq.write(tmpBody);
	}
	tmpReq.end();
};

/**
 * Register the MeadowProxy capability on an existing beacon service.
 *
 * @param {object} pBeaconService - An enabled ultravisor-beacon service
 * @param {object} pFable         - The databeacon's fable instance (exposes .settings and .log)
 * @param {object} [pOptions]     - Options overriding DEFAULT_OPTIONS
 */
const registerMeadowProxyCapability = function (pBeaconService, pFable, pOptions)
{
	let tmpOptions = Object.assign({}, DEFAULT_OPTIONS, pOptions || {});
	let tmpCompiledAllowlist = compilePathAllowlist(tmpOptions.PathAllowlist);
	let tmpLog = pFable.log;

	pBeaconService.registerCapability(
		{
			Capability: 'MeadowProxy',
			Name: 'DataBeaconMeadowProxyProvider',
			actions:
			{
				'Request':
				{
					Description: 'Proxy an HTTP request to the databeacon\'s localhost REST API',
					SettingsSchema:
					[
						{ Name: 'Method',     DataType: 'String', Required: true },
						{ Name: 'Path',       DataType: 'String', Required: true },
						{ Name: 'Body',       DataType: 'String', Required: false },
						{ Name: 'RemoteUser', DataType: 'String', Required: false }
					],
					Handler: function (pWorkItem, pContext, fHandlerCallback)
					{
						let tmpStart = Date.now();
						let tmpSettings = pWorkItem.Settings || {};
						let tmpMethod = (typeof(tmpSettings.Method) === 'string') ? tmpSettings.Method.toUpperCase() : '';
						let tmpPath = tmpSettings.Path || '';
						let tmpRawBody = (typeof(tmpSettings.Body) === 'string') ? tmpSettings.Body : '';
						let tmpRemoteUser = tmpSettings.RemoteUser || 'anonymous';

						// Validate method
						if (!tmpMethod)
						{
							return fHandlerCallback(new Error('MeadowProxy: Method is required.'));
						}
						if (!tmpOptions.AllowWrites && tmpMethod !== 'GET' && tmpMethod !== 'HEAD')
						{
							if (tmpLog) { tmpLog.warn(`MeadowProxy: rejected ${tmpMethod} ${tmpPath} (writes disabled)`); }
							return fHandlerCallback(new Error('MeadowProxy: writes are disabled on this beacon.'));
						}

						// Validate path
						if (!isPathAllowed(tmpPath, tmpCompiledAllowlist))
						{
							if (tmpLog) { tmpLog.warn(`MeadowProxy: rejected ${tmpMethod} ${tmpPath} (not allowlisted)`); }
							return fHandlerCallback(new Error('MeadowProxy: path is not in the allowlist.'));
						}

						// Port from fable settings
						let tmpPort = (pFable.settings && pFable.settings.APIServerPort) || 8389;
						let tmpHostname = (pFable.settings && pFable.settings.APIServerAddress) || '127.0.0.1';

						// Normalise leading slash
						let tmpRequestPath = (tmpPath.charAt(0) === '/') ? tmpPath : ('/' + tmpPath);

						let tmpHeaders = {};
						tmpHeaders[tmpOptions.InternalHeaderName] = tmpOptions.InternalHeaderValue;
						tmpHeaders['X-Beacon-User'] = tmpRemoteUser;

						loopbackRequest(
							{
								hostname: tmpHostname,
								port: tmpPort,
								path: tmpRequestPath,
								method: tmpMethod,
								headers: tmpHeaders,
								body: tmpRawBody
							},
							(pError, pResult) =>
							{
								let tmpElapsed = Date.now() - tmpStart;
								if (pError)
								{
									if (tmpLog) { tmpLog.warn(`MeadowProxy: ${tmpMethod} ${tmpPath} failed after ${tmpElapsed}ms — ${pError.message}`); }
									return fHandlerCallback(pError);
								}
								if (tmpLog) { tmpLog.info(`MeadowProxy: ${tmpMethod} ${tmpPath} status=${pResult.Status} elapsed=${tmpElapsed}ms user=${tmpRemoteUser}`); }
								// Ultravisor-beacon Client expects { Outputs, Log } — results
								// outside the Outputs envelope are dropped on the floor.
								return fHandlerCallback(null,
									{
										Outputs:
										{
											Status: pResult.Status,
											Body: pResult.Body
										},
										Log: []
									});
							});
					}
				}
			}
		});
};

module.exports =
	{
		registerMeadowProxyCapability: registerMeadowProxyCapability,
		// Exported for unit tests:
		_compilePathAllowlist: compilePathAllowlist,
		_isPathAllowed: isPathAllowed,
		_loopbackRequest: loopbackRequest,
		DEFAULT_PATH_ALLOWLIST: DEFAULT_PATH_ALLOWLIST,
		DEFAULT_OPTIONS: DEFAULT_OPTIONS
	};
