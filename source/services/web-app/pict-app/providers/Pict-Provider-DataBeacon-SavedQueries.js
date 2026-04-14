/**
 * Retold DataBeacon — Saved Queries Provider
 *
 * localStorage-backed library of reusable SQL queries. Each record has a
 * stable GUIDSavedQuery (Meadow's GUID${Entity} convention), a Name,
 * free-form Documentation, the SQL body, an optional associated connection,
 * freeform Tags, create/update timestamps, and a last-run timestamp +
 * row count populated by QueryPanel.execute.
 *
 * Storage envelope:
 *   localStorage[databeacon.savedQueries] = JSON.stringify({
 *     Version: 1,
 *     Records: { [GUID]: { ...record } }
 *   })
 *
 * Exposes view-ready data at AppData.SavedQueries for the
 * SavedQueriesList view and QueryPanel to bind against.
 */
const libPictProvider = require('pict-provider');

const _ProviderConfiguration =
{
	ProviderIdentifier: 'DataBeacon-SavedQueries',
	AutoInitialize: true,
	AutoInitializeOrdinal: 0
};

const _StorageKey = 'databeacon.savedQueries';
const _SchemaVersion = 1;

class PictProviderDataBeaconSavedQueries extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);
		this.serviceType = 'PictProviderDataBeaconSavedQueries';
		this._Records = {};
	}

	onAfterInitialize()
	{
		this._load();
		if (!this.pict.AppData.SavedQueries)
		{
			this.pict.AppData.SavedQueries =
			{
				List: [],
				Count: 0,
				IsEmpty: true,
				Expanded: false,
				ActiveGUID: null,
				ToggleIcon: 'chevron-right'
			};
		}
		this._recomputeViewData();
		return super.onAfterInitialize();
	}

	// ================================================================
	// Public CRUD
	// ================================================================

	list()
	{
		let tmpOut = [];
		let tmpKeys = Object.keys(this._Records);
		for (let i = 0; i < tmpKeys.length; i++) tmpOut.push(this._Records[tmpKeys[i]]);
		tmpOut.sort((a, b) => String(b.DateUpdated || '').localeCompare(String(a.DateUpdated || '')));
		return tmpOut;
	}

	get(pGUID)
	{
		if (!pGUID) return null;
		return this._Records[pGUID] || null;
	}

	create(pDraft)
	{
		let tmpDraft = pDraft || {};
		let tmpGUID = this._generateGUID();
		let tmpNow = new Date().toISOString();
		let tmpRecord =
		{
			GUIDSavedQuery: tmpGUID,
			Name: (typeof tmpDraft.Name === 'string' && tmpDraft.Name.length > 0) ? tmpDraft.Name : 'Untitled Query',
			Documentation: (typeof tmpDraft.Documentation === 'string') ? tmpDraft.Documentation : '',
			SQL: (typeof tmpDraft.SQL === 'string') ? tmpDraft.SQL : '',
			IDBeaconConnection: this._normalizeConnectionID(tmpDraft.IDBeaconConnection),
			Tags: this._normalizeTags(tmpDraft.Tags),
			DateCreated: tmpNow,
			DateUpdated: tmpNow,
			DateLastRun: null,
			LastRowCount: null
		};
		this._Records[tmpGUID] = tmpRecord;
		this._persist();
		this._broadcast();
		return tmpRecord;
	}

	update(pGUID, pPatch)
	{
		let tmpExisting = this._Records[pGUID];
		if (!tmpExisting) return null;
		let tmpNext = Object.assign({}, tmpExisting);
		if (pPatch)
		{
			if (typeof pPatch.Name === 'string' && pPatch.Name.length > 0) tmpNext.Name = pPatch.Name;
			if (typeof pPatch.Documentation === 'string') tmpNext.Documentation = pPatch.Documentation;
			if (typeof pPatch.SQL === 'string') tmpNext.SQL = pPatch.SQL;
			if ('IDBeaconConnection' in pPatch) tmpNext.IDBeaconConnection = this._normalizeConnectionID(pPatch.IDBeaconConnection);
			if ('Tags' in pPatch) tmpNext.Tags = this._normalizeTags(pPatch.Tags);
		}
		tmpNext.DateUpdated = new Date().toISOString();
		this._Records[pGUID] = tmpNext;
		this._persist();
		this._broadcast();
		return tmpNext;
	}

	remove(pGUID)
	{
		if (!this._Records[pGUID]) return false;
		delete this._Records[pGUID];
		// If the deleted query was the active one, clear the active pointer.
		if (this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.ActiveGUID === pGUID)
		{
			this.pict.AppData.SavedQueries.ActiveGUID = null;
		}
		this._persist();
		this._broadcast();
		return true;
	}

	/**
	 * Record a successful execution against a saved query. Invoked from
	 * QueryPanel._execute after the server responds.
	 */
	noteRun(pGUID, pRowCount)
	{
		if (!pGUID || !this._Records[pGUID]) return false;
		this._Records[pGUID].DateLastRun = new Date().toISOString();
		this._Records[pGUID].LastRowCount = (typeof pRowCount === 'number' && isFinite(pRowCount)) ? pRowCount : null;
		this._persist();
		this._broadcast();
		return true;
	}

	setActiveGUID(pGUID)
	{
		if (!this.pict.AppData.SavedQueries) this.pict.AppData.SavedQueries = {};
		this.pict.AppData.SavedQueries.ActiveGUID = pGUID || null;
		this._broadcast();
	}

	getActiveGUID()
	{
		return (this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.ActiveGUID) || null;
	}

	setExpanded(pExpanded)
	{
		if (!this.pict.AppData.SavedQueries) this.pict.AppData.SavedQueries = {};
		this.pict.AppData.SavedQueries.Expanded = !!pExpanded;
		this._broadcast();
	}

	toggleExpanded()
	{
		this.setExpanded(!(this.pict.AppData.SavedQueries && this.pict.AppData.SavedQueries.Expanded));
	}

	// ================================================================
	// Internal
	// ================================================================

	_broadcast()
	{
		this._recomputeViewData();
		if (this.pict.views.SavedQueriesList && typeof this.pict.views.SavedQueriesList.render === 'function')
		{
			this.pict.views.SavedQueriesList.render();
		}
	}

	_recomputeViewData()
	{
		let tmpItems = this.list();
		let tmpConnections = this.pict.AppData.Connections || [];
		let tmpPrev = this.pict.AppData.SavedQueries || {};
		let tmpActiveGUID = tmpPrev.ActiveGUID || null;
		let tmpExpanded = !!tmpPrev.Expanded;

		let tmpList = [];
		for (let i = 0; i < tmpItems.length; i++)
		{
			let tmpR = tmpItems[i];
			let tmpConn = this._findConnection(tmpConnections, tmpR.IDBeaconConnection);
			let tmpIsActive = (tmpR.GUIDSavedQuery === tmpActiveGUID);
			tmpList.push(
			{
				GUIDSavedQuery: tmpR.GUIDSavedQuery,
				Name: tmpR.Name,
				Documentation: tmpR.Documentation,
				DocumentationPreview: this._truncate(tmpR.Documentation, 80),
				SQL: tmpR.SQL,
				IDBeaconConnection: tmpR.IDBeaconConnection,
				Tags: tmpR.Tags,
				TagsDisplay: (Array.isArray(tmpR.Tags) && tmpR.Tags.length > 0) ? tmpR.Tags.join(', ') : '—',
				ConnectionLabel: tmpConn ? `${tmpConn.Name} (${tmpConn.Type})` : '—',
				DateCreated: tmpR.DateCreated,
				DateUpdated: tmpR.DateUpdated,
				DateLastRun: tmpR.DateLastRun,
				DateUpdatedDisplay: this._formatDate(tmpR.DateUpdated),
				DateLastRunDisplay: tmpR.DateLastRun ? this._formatDate(tmpR.DateLastRun) : '—',
				LastRowCount: tmpR.LastRowCount,
				LastRowCountDisplay: (tmpR.LastRowCount !== null && tmpR.LastRowCount !== undefined) ? String(tmpR.LastRowCount) : '—',
				IsActive: tmpIsActive,
				ActiveClass: tmpIsActive ? 'is-active-query' : ''
			});
		}

		this.pict.AppData.SavedQueries =
		{
			List: tmpList,
			Count: tmpList.length,
			IsEmpty: tmpList.length === 0,
			Expanded: tmpExpanded,
			ActiveGUID: tmpActiveGUID,
			ToggleIcon: tmpExpanded ? 'chevron-down' : 'chevron-right',
			ToggleLabel: tmpExpanded ? 'Hide' : 'Show'
		};
	}

	_findConnection(pConnections, pID)
	{
		if (pID === null || pID === undefined) return null;
		for (let i = 0; i < pConnections.length; i++)
		{
			if (pConnections[i].IDBeaconConnection === pID) return pConnections[i];
		}
		return null;
	}

	_truncate(pStr, pMax)
	{
		if (!pStr) return '';
		let tmpS = String(pStr);
		return (tmpS.length <= pMax) ? tmpS : tmpS.substring(0, pMax - 1) + '…';
	}

	_formatDate(pISO)
	{
		if (!pISO) return '';
		try
		{
			let tmpD = new Date(pISO);
			if (isNaN(tmpD.getTime())) return pISO;
			let tmpPad = (n) => String(n).padStart(2, '0');
			return tmpD.getFullYear()
				+ '-' + tmpPad(tmpD.getMonth() + 1)
				+ '-' + tmpPad(tmpD.getDate())
				+ ' ' + tmpPad(tmpD.getHours())
				+ ':' + tmpPad(tmpD.getMinutes());
		}
		catch (pError) { return pISO; }
	}

	_normalizeTags(pTags)
	{
		if (Array.isArray(pTags))
		{
			let tmpOut = [];
			for (let i = 0; i < pTags.length; i++)
			{
				let tmpT = String(pTags[i] || '').trim();
				if (tmpT.length > 0) tmpOut.push(tmpT);
			}
			return tmpOut;
		}
		if (typeof pTags === 'string')
		{
			let tmpParts = pTags.split(',');
			let tmpOut = [];
			for (let i = 0; i < tmpParts.length; i++)
			{
				let tmpT = tmpParts[i].trim();
				if (tmpT.length > 0) tmpOut.push(tmpT);
			}
			return tmpOut;
		}
		return [];
	}

	_normalizeConnectionID(pID)
	{
		if (pID === null || pID === undefined || pID === '') return null;
		let tmpN = parseInt(pID, 10);
		return isNaN(tmpN) ? null : tmpN;
	}

	_generateGUID()
	{
		if (this.pict && typeof this.pict.getUUID === 'function')
		{
			try
			{
				let tmpUUID = this.pict.getUUID();
				if (tmpUUID) return tmpUUID;
			}
			catch (pError) { /* fall through */ }
		}
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (pChar) =>
		{
			let tmpR = Math.random() * 16 | 0;
			let tmpV = (pChar === 'x') ? tmpR : ((tmpR & 0x3) | 0x8);
			return tmpV.toString(16);
		});
	}

	_load()
	{
		try
		{
			if (typeof localStorage === 'undefined') return;
			let tmpRaw = localStorage.getItem(_StorageKey);
			if (!tmpRaw) return;
			let tmpParsed = JSON.parse(tmpRaw);
			if (tmpParsed && tmpParsed.Version === _SchemaVersion && tmpParsed.Records && typeof tmpParsed.Records === 'object')
			{
				this._Records = tmpParsed.Records;
			}
		}
		catch (pError)
		{
			this.log.warn(`SavedQueries load failed: ${pError && pError.message ? pError.message : pError}`);
			this._Records = {};
		}
	}

	_persist()
	{
		try
		{
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(_StorageKey, JSON.stringify({ Version: _SchemaVersion, Records: this._Records }));
		}
		catch (pError)
		{
			this.log.warn(`SavedQueries persist failed: ${pError && pError.message ? pError.message : pError}`);
		}
	}
}

module.exports = PictProviderDataBeaconSavedQueries;
module.exports.default_configuration = _ProviderConfiguration;
