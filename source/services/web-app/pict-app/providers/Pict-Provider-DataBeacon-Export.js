/**
 * Retold DataBeacon — Export Provider
 *
 * Converts an in-memory row set into JSON (array), JSON (Meadow
 * Comprehension), CSV, or TSV and triggers a browser download. Shared by
 * the RecordBrowser (paginated table page) and QueryPanel (SQL result set)
 * views — any new view that shows tabular data can call the same entry
 * point.
 */
const libPictProvider = require('pict-provider');

const _ProviderConfiguration =
{
	ProviderIdentifier: 'DataBeacon-Export',
	AutoInitialize: true,
	AutoInitializeOrdinal: 0
};

const _SupportedFormats = [ 'json', 'json-comp', 'csv', 'tsv' ];

class PictProviderDataBeaconExport extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);
		this.serviceType = 'PictProviderDataBeaconExport';
	}

	/**
	 * Public entry point. Converts pRows to the requested format and kicks
	 * off a browser download.
	 *
	 * @param {string} pFormat - 'json' | 'json-comp' | 'csv' | 'tsv'
	 * @param {Array<Object>} pRows
	 * @param {Object} [pOptions]
	 * @param {string} [pOptions.BaseName]   - Filename stem (default "databeacon-export").
	 * @param {string} [pOptions.EntityName] - Top-level key for Comprehension exports (default "Record").
	 * @param {string} [pOptions.KeyField]   - Row field used as the Comprehension map key. Falls back to row index.
	 * @returns {boolean} true on success, false when the format is unknown or the download fails.
	 */
	exportRows(pFormat, pRows, pOptions)
	{
		if (_SupportedFormats.indexOf(pFormat) === -1)
		{
			this.log.warn(`PictProviderDataBeaconExport: unsupported format [${pFormat}]`);
			return false;
		}
		let tmpOptions = pOptions || {};
		let tmpBase = tmpOptions.BaseName || 'databeacon-export';
		let tmpRows = Array.isArray(pRows) ? pRows : [];

		let tmpContent;
		let tmpMime;
		let tmpExt;
		let tmpSuffix = '';

		switch (pFormat)
		{
			case 'json':
				tmpContent = this.formatJSONArray(tmpRows);
				tmpMime = 'application/json';
				tmpExt = 'json';
				break;
			case 'json-comp':
				tmpContent = this.formatJSONComprehension(tmpRows, tmpOptions.EntityName || 'Record', tmpOptions.KeyField);
				tmpMime = 'application/json';
				tmpExt = 'json';
				tmpSuffix = '-comprehension';
				break;
			case 'csv':
				tmpContent = this.formatCSV(tmpRows);
				tmpMime = 'text/csv';
				tmpExt = 'csv';
				break;
			case 'tsv':
				tmpContent = this.formatTSV(tmpRows);
				tmpMime = 'text/tab-separated-values';
				tmpExt = 'tsv';
				break;
		}

		let tmpFilename = `${tmpBase}${tmpSuffix}-${this._timestamp()}.${tmpExt}`;
		return this._download(tmpContent, tmpMime, tmpFilename);
	}

	// ================================================================
	// Format helpers (pure — exposed for test / reuse)
	// ================================================================

	formatJSONArray(pRows)
	{
		return JSON.stringify(pRows || [], null, '\t');
	}

	/**
	 * Emit a Meadow-style Comprehension:
	 *   { [EntityName]: { [KeyValue]: { ...record }, ... } }
	 * Rows missing pKeyField fall back to 1-based row index as the map key.
	 */
	formatJSONComprehension(pRows, pEntityName, pKeyField)
	{
		let tmpEntity = pEntityName || 'Record';
		let tmpRows = pRows || [];
		let tmpMap = {};
		for (let i = 0; i < tmpRows.length; i++)
		{
			let tmpRow = tmpRows[i];
			let tmpKey;
			if (pKeyField && tmpRow && tmpRow[pKeyField] !== null && tmpRow[pKeyField] !== undefined && tmpRow[pKeyField] !== '')
			{
				tmpKey = String(tmpRow[pKeyField]);
			}
			else
			{
				tmpKey = String(i + 1);
			}
			// Disambiguate duplicates by suffixing — Comprehension map keys must be unique.
			let tmpCandidate = tmpKey;
			let tmpCollisionIndex = 1;
			while (Object.prototype.hasOwnProperty.call(tmpMap, tmpCandidate))
			{
				tmpCollisionIndex++;
				tmpCandidate = `${tmpKey}#${tmpCollisionIndex}`;
			}
			tmpMap[tmpCandidate] = tmpRow;
		}
		let tmpOut = {};
		tmpOut[tmpEntity] = tmpMap;
		return JSON.stringify(tmpOut, null, '\t');
	}

	formatCSV(pRows)
	{
		// RFC 4180: comma-separated, CRLF line endings, double-quote wrap
		// when a field contains a delimiter / quote / newline.
		return this._buildDelimited(pRows, ',', '\r\n', true);
	}

	formatTSV(pRows)
	{
		// Classic TSV — tabs separate fields, LF separates rows. Tabs and
		// newlines inside values are replaced with spaces because the TSV
		// spec has no escape mechanism.
		return this._buildDelimited(pRows, '\t', '\n', false);
	}

	_buildDelimited(pRows, pFieldSep, pRowSep, pQuote)
	{
		let tmpRows = pRows || [];
		let tmpColumns = this._collectColumns(tmpRows);
		if (tmpColumns.length === 0) return '';

		let tmpLines = [];
		let tmpHeader = [];
		for (let h = 0; h < tmpColumns.length; h++)
		{
			tmpHeader.push(this._escapeField(tmpColumns[h], pFieldSep, pRowSep, pQuote));
		}
		tmpLines.push(tmpHeader.join(pFieldSep));

		for (let r = 0; r < tmpRows.length; r++)
		{
			let tmpRow = tmpRows[r] || {};
			let tmpCells = [];
			for (let c = 0; c < tmpColumns.length; c++)
			{
				tmpCells.push(this._escapeField(tmpRow[tmpColumns[c]], pFieldSep, pRowSep, pQuote));
			}
			tmpLines.push(tmpCells.join(pFieldSep));
		}
		return tmpLines.join(pRowSep);
	}

	/**
	 * Walk every row and record column names in first-seen order so a union
	 * of sparse rows exports cleanly.
	 */
	_collectColumns(pRows)
	{
		let tmpSeen = {};
		let tmpOrdered = [];
		for (let i = 0; i < pRows.length; i++)
		{
			let tmpRow = pRows[i];
			if (!tmpRow || typeof tmpRow !== 'object') continue;
			let tmpKeys = Object.keys(tmpRow);
			for (let k = 0; k < tmpKeys.length; k++)
			{
				if (!tmpSeen[tmpKeys[k]])
				{
					tmpSeen[tmpKeys[k]] = true;
					tmpOrdered.push(tmpKeys[k]);
				}
			}
		}
		return tmpOrdered;
	}

	_escapeField(pValue, pFieldSep, pRowSep, pQuote)
	{
		if (pValue === null || pValue === undefined) return '';
		let tmpStr;
		if (typeof pValue === 'object')
		{
			try { tmpStr = JSON.stringify(pValue); }
			catch (pError) { tmpStr = String(pValue); }
		}
		else
		{
			tmpStr = String(pValue);
		}
		if (pQuote)
		{
			let tmpNeedsQuote = tmpStr.indexOf(pFieldSep) !== -1
				|| tmpStr.indexOf('"') !== -1
				|| tmpStr.indexOf('\n') !== -1
				|| tmpStr.indexOf('\r') !== -1;
			if (tmpNeedsQuote) tmpStr = '"' + tmpStr.replace(/"/g, '""') + '"';
			return tmpStr;
		}
		return tmpStr.replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
	}

	_timestamp()
	{
		let tmpDate = new Date();
		let tmpPad = (n) => String(n).padStart(2, '0');
		return tmpDate.getFullYear()
			+ tmpPad(tmpDate.getMonth() + 1)
			+ tmpPad(tmpDate.getDate())
			+ '-'
			+ tmpPad(tmpDate.getHours())
			+ tmpPad(tmpDate.getMinutes())
			+ tmpPad(tmpDate.getSeconds());
	}

	_download(pContent, pMime, pFilename)
	{
		if (typeof document === 'undefined' || typeof Blob === 'undefined' || typeof URL === 'undefined')
		{
			this.log.warn('PictProviderDataBeaconExport: no browser APIs available; cannot download.');
			return false;
		}
		try
		{
			let tmpBlob = new Blob([pContent], { type: `${pMime};charset=utf-8` });
			let tmpUrl = URL.createObjectURL(tmpBlob);
			let tmpAnchor = document.createElement('a');
			tmpAnchor.href = tmpUrl;
			tmpAnchor.download = pFilename;
			tmpAnchor.style.display = 'none';
			document.body.appendChild(tmpAnchor);
			tmpAnchor.click();
			setTimeout(() =>
			{
				if (tmpAnchor.parentNode) tmpAnchor.parentNode.removeChild(tmpAnchor);
				URL.revokeObjectURL(tmpUrl);
			}, 0);
			return true;
		}
		catch (pError)
		{
			this.log.error(`PictProviderDataBeaconExport: download failed: ${pError && pError.message ? pError.message : pError}`);
			return false;
		}
	}
}

module.exports = PictProviderDataBeaconExport;
module.exports.default_configuration = _ProviderConfiguration;
