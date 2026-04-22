/**
 * DataBeacon RecordBrowser View
 *
 * Table picker + paginated record table. Users pick a page size, a
 * cursor-start offset, and page forward/backward through the underlying
 * endpoint. The provider populates AppData.RecordBrowser with render-ready
 * fields (ColumnList, Rows, CursorStart, PageSize, PrevDisabled,
 * NextDisabled, RangeLabel, PageSizeOptions) so templates stay declarative.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'RecordBrowser',
	DefaultRenderable: 'DataBeacon-RecordBrowser',
	DefaultDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-records-toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
		.databeacon-records-toolbar .form-group { margin: 0; }
		.databeacon-records-pager-buttons { display: flex; gap: 6px; }
		.databeacon-records-start-input { width: 100px; }
		.databeacon-records-pagesize-select { width: 90px; }
		.databeacon-records-range { margin-top: 8px; color: var(--text-muted); font-size: 12px; }
		.databeacon-export-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
		.databeacon-export-bar .databeacon-export-label { color: var(--text-muted); font-size: 12px; margin-right: 4px; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-RecordBrowser-Template',
			Template: /*html*/`
<div id="DataBeacon-RecordBrowser-Root" class="section">
	<div class="databeacon-records-toolbar">
		<div class="form-group">
			<label>Table</label>
			<select id="databeacon-records-table" onchange="{~P~}.PictApplication.selectRecordsTable(this.value)">
				<option value="">-- Select Table --</option>
				{~TS:DataBeacon-RecordBrowser-TableOption:AppData.RecordBrowser.TableOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Page Size</label>
			<select class="databeacon-records-pagesize-select" onchange="{~P~}.PictApplication.changeRecordsPageSize(this.value)">
				{~TS:DataBeacon-RecordBrowser-PageSizeOption:AppData.RecordBrowser.PageSizeOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Start</label>
			<input type="number" class="databeacon-records-start-input" min="0" step="1" value="{~D:AppData.RecordBrowser.CursorStart:0~}" onchange="{~P~}.PictApplication.changeRecordsStart(this.value)" />
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<div class="databeacon-records-pager-buttons">
				<a class="btn btn-small btn-secondary {~D:AppData.RecordBrowser.PrevDisabledClass~}" href="#/records/prev">
					<span data-databeacon-icon="chevron-left" data-icon-size="14"></span> Prev
				</a>
				<a class="btn btn-small btn-secondary {~D:AppData.RecordBrowser.NextDisabledClass~}" href="#/records/next">
					Next <span data-databeacon-icon="chevron-right" data-icon-size="14"></span>
				</a>
			</div>
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<a class="btn btn-small btn-primary {~D:AppData.RecordBrowser.LoadDisabledClass~}" href="#/records/load">
				<span data-databeacon-icon="refresh" data-icon-size="14"></span> Reload
			</a>
		</div>
	</div>
	<div class="databeacon-records-range">{~D:AppData.RecordBrowser.RangeLabel~}</div>
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Empty:AppData.RecordBrowser:AppData.RecordBrowser.State^==^Empty~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-NoSelection:AppData.RecordBrowser:AppData.RecordBrowser.State^==^NoSelection~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Table:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-ExportBar:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-ExportBar',
			Template: /*html*/`
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export current page:</span>
	<a class="btn btn-small btn-secondary" href="#/records/export/json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</a>
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-TableOption',
			Template: `<option value="{~D:Record.TableName~}" {~D:Record.SelectedAttr~}>{~D:Record.TableName~}</option>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-PageSizeOption',
			Template: `<option value="{~D:Record.Value~}" {~D:Record.SelectedAttr~}>{~D:Record.Value~}</option>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-NoSelection',
			Template: `<p class="empty-state">Select an enabled table and click Reload.</p>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Empty',
			Template: `<p class="empty-state">No records in this page.</p>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Table',
			Template: /*html*/`
<div class="section">
	<h2>{~D:AppData.RecordBrowser.TableName~}</h2>
	<div class="table-scroll">
		<table class="data-table">
			<thead><tr>{~TS:DataBeacon-RecordBrowser-HeaderCell:AppData.RecordBrowser.ColumnList~}</tr></thead>
			<tbody>{~TS:DataBeacon-RecordBrowser-Row:AppData.RecordBrowser.Rows~}</tbody>
		</table>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-HeaderCell',
			Template: `<th>{~D:Record.Name~}</th>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Row',
			Template: `<tr>{~TS:DataBeacon-RecordBrowser-Cell:Record.Cells~}</tr>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Cell',
			Template: `<td>{~D:Record.CellHTML~}</td>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-RecordBrowser',
			TemplateHash: 'DataBeacon-RecordBrowser-Template',
			ContentDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconRecordBrowser extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-RecordBrowser-Root');

		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// ── Router-handler entry points (called by Application) ────────────────
	// Each method is called from a `#/records/...` route or an inline
	// onchange expression (select/input).  No addEventListener delegation.

	_loadCurrent()
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable) { return; }
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		tmpProvider.loadRecords(tmpTable, tmpStart, tmpSize);
	}

	_pagePrev()
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable || tmpBrowser.PrevDisabled) { return; }
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		this.pict.AppData.RecordBrowser.CursorStart = Math.max(0, tmpStart - tmpSize);
		tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
	}

	_pageNext()
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable || tmpBrowser.NextDisabled) { return; }
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		this.pict.AppData.RecordBrowser.CursorStart = tmpStart + tmpSize;
		tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
	}

	_exportRecords(pFormat)
	{
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		this._export(pFormat, tmpTable, tmpStart, tmpSize);
	}

	_selectTable(pTableName)
	{
		this.pict.AppData.SelectedTableName = pTableName || '';
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.CursorStart = 0;
		let tmpProv = this.pict.providers.DataBeaconProvider;
		if (pTableName && tmpProv)
		{
			tmpProv.loadRecords(pTableName, 0, this._clampSize(this.pict.AppData.RecordBrowser.PageSize));
		}
		else if (tmpProv && typeof tmpProv.refreshRecordBrowserViewData === 'function')
		{
			tmpProv.refreshRecordBrowserViewData();
			this.render();
		}
	}

	_setPageSize(pRawValue)
	{
		let tmpSize = this._clampSize(pRawValue);
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.PageSize = tmpSize;
		this._loadCurrent();
	}

	_setStart(pRawValue)
	{
		let tmpStart = this._clampStart(pRawValue);
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
		this._loadCurrent();
	}

	_export(pFormat, pTable, pStart, pSize)
	{
		let tmpExport = this.pict.providers['DataBeacon-Export'];
		if (!tmpExport) return;
		let tmpRows = Array.isArray(this.pict.AppData.Records) ? this.pict.AppData.Records : [];
		if (tmpRows.length === 0) return;

		let tmpEntity = pTable || 'Record';
		let tmpKeyField = this._findGUIDField(tmpEntity, tmpRows);
		let tmpBase = `${tmpEntity}-${pStart}-${pStart + tmpRows.length - 1}`;
		tmpExport.exportRows(pFormat, tmpRows,
		{
			BaseName: tmpBase,
			EntityName: tmpEntity,
			KeyField: tmpKeyField
		});
	}

	/**
	 * Resolve the Comprehension key column for the selected table.
	 *
	 * Meadow's Comprehension format keys records by a GUID column, not the
	 * numeric primary key. The default GUIDName is `GUID${Entity}` (e.g.
	 * `GUIDUser` for the `User` entity). We try, in order:
	 *   1) Exact match `GUID${Entity}` on the first row.
	 *   2) Exact match `GUID${Entity}` in the introspected column list.
	 *   3) Any column whose name starts with `GUID[A-Z]` in the first row.
	 *   4) null — the exporter then falls back to 1-based row index.
	 */
	_findGUIDField(pEntityName, pRows)
	{
		let tmpFirstRow = (pRows && pRows.length > 0 && typeof pRows[0] === 'object' && pRows[0] !== null) ? pRows[0] : null;

		if (pEntityName && tmpFirstRow)
		{
			let tmpExpected = `GUID${pEntityName}`;
			if (Object.prototype.hasOwnProperty.call(tmpFirstRow, tmpExpected))
			{
				return tmpExpected;
			}
		}

		if (pEntityName)
		{
			let tmpTables = this.pict.AppData.Tables || [];
			let tmpExpected = `GUID${pEntityName}`;
			for (let i = 0; i < tmpTables.length; i++)
			{
				if (tmpTables[i].TableName !== pEntityName) continue;
				let tmpColumns = tmpTables[i].Columns || [];
				for (let c = 0; c < tmpColumns.length; c++)
				{
					if (tmpColumns[c].Name === tmpExpected) return tmpExpected;
				}
				break;
			}
		}

		if (tmpFirstRow)
		{
			let tmpKeys = Object.keys(tmpFirstRow);
			for (let k = 0; k < tmpKeys.length; k++)
			{
				if (/^GUID[A-Z]/.test(tmpKeys[k])) return tmpKeys[k];
			}
		}
		return null;
	}

	_clampStart(pValue)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 0) return 0;
		return tmpN;
	}

	_clampSize(pValue)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 1) return 50;
		if (tmpN > 1000) return 1000;
		return tmpN;
	}
}

module.exports = PictViewDataBeaconRecordBrowser;
module.exports.default_configuration = _ViewConfiguration;
