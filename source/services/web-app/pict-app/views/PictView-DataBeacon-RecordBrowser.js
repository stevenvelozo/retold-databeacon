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
			<select id="databeacon-records-table" data-databeacon-action="select-table">
				<option value="">-- Select Table --</option>
				{~TS:DataBeacon-RecordBrowser-TableOption:AppData.RecordBrowser.TableOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Page Size</label>
			<select class="databeacon-records-pagesize-select" data-databeacon-action="select-page-size">
				{~TS:DataBeacon-RecordBrowser-PageSizeOption:AppData.RecordBrowser.PageSizeOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Start</label>
			<input type="number" class="databeacon-records-start-input" min="0" step="1" value="{~D:AppData.RecordBrowser.CursorStart:0~}" data-databeacon-action="change-start" />
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<div class="databeacon-records-pager-buttons">
				<button class="btn btn-small btn-secondary" data-databeacon-action="prev">
					<span data-databeacon-icon="chevron-left" data-icon-size="14"></span> Prev
				</button>
				<button class="btn btn-small btn-secondary" data-databeacon-action="next">
					Next <span data-databeacon-icon="chevron-right" data-icon-size="14"></span>
				</button>
			</div>
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<button class="btn btn-small btn-primary" data-databeacon-action="load">
				<span data-databeacon-icon="refresh" data-icon-size="14"></span> Reload
			</button>
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
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</button>
	<button class="btn btn-small btn-secondary" data-databeacon-action="export" data-export-format="tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</button>
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

		this._applyDisabledAttributes();

		let tmpRootList = this.pict.ContentAssignment.getElement('#DataBeacon-RecordBrowser-Root');
		if (tmpRootList && tmpRootList.length > 0)
		{
			let tmpRoot = tmpRootList[0];
			tmpRoot.addEventListener('click', (pEvent) =>
			{
				let tmpBtn = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpBtn || tmpBtn.tagName !== 'BUTTON') return;
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'), tmpBtn.dataset);
			});
			tmpRoot.addEventListener('change', (pEvent) =>
			{
				let tmpEl = pEvent.target.closest('[data-databeacon-action]');
				if (!tmpEl) return;
				this._handleChange(tmpEl.getAttribute('data-databeacon-action'), tmpEl.value);
			});
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_applyDisabledAttributes()
	{
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};

		let tmpList = this.pict.ContentAssignment.getElement('[data-databeacon-action="load"]');
		if (tmpList && tmpList.length > 0) tmpList[0].disabled = !!tmpBrowser.LoadDisabled;

		let tmpPrev = this.pict.ContentAssignment.getElement('[data-databeacon-action="prev"]');
		if (tmpPrev && tmpPrev.length > 0) tmpPrev[0].disabled = !!tmpBrowser.PrevDisabled;

		let tmpNext = this.pict.ContentAssignment.getElement('[data-databeacon-action="next"]');
		if (tmpNext && tmpNext.length > 0) tmpNext[0].disabled = !!tmpBrowser.NextDisabled;
	}

	_handleAction(pAction, pData)
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);

		switch (pAction)
		{
			case 'load':
				if (tmpTable) tmpProvider.loadRecords(tmpTable, tmpStart, tmpSize);
				break;
			case 'prev':
				if (!tmpTable || tmpBrowser.PrevDisabled) return;
				this.pict.AppData.RecordBrowser.CursorStart = Math.max(0, tmpStart - tmpSize);
				tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
				break;
			case 'next':
				if (!tmpTable || tmpBrowser.NextDisabled) return;
				this.pict.AppData.RecordBrowser.CursorStart = tmpStart + tmpSize;
				tmpProvider.loadRecords(tmpTable, this.pict.AppData.RecordBrowser.CursorStart, tmpSize);
				break;
			case 'export':
				this._export(pData && pData.exportFormat, tmpTable, tmpStart, tmpSize);
				break;
		}
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

	_handleChange(pAction, pRawValue)
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpTable = this.pict.AppData.SelectedTableName;

		switch (pAction)
		{
			case 'select-table':
			{
				let tmpNext = pRawValue || null;
				this.pict.AppData.SelectedTableName = tmpNext;
				this.pict.AppData.RecordBrowser.CursorStart = 0;
				if (tmpNext)
				{
					tmpProvider.loadRecords(tmpNext, 0, this._clampSize(this.pict.AppData.RecordBrowser.PageSize));
				}
				else
				{
					this.pict.AppData.Records = [];
					tmpProvider.refreshRecordBrowserViewData();
					this.render();
				}
				break;
			}
			case 'select-page-size':
			{
				let tmpSize = this._clampSize(parseInt(pRawValue, 10));
				this.pict.AppData.RecordBrowser.PageSize = tmpSize;
				// Reset to start of range when page size changes — keeps behavior predictable.
				this.pict.AppData.RecordBrowser.CursorStart = 0;
				if (tmpTable)
				{
					tmpProvider.loadRecords(tmpTable, 0, tmpSize);
				}
				else
				{
					tmpProvider.refreshRecordBrowserViewData();
					this.render();
				}
				break;
			}
			case 'change-start':
			{
				let tmpStart = this._clampStart(parseInt(pRawValue, 10));
				this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
				if (tmpTable)
				{
					tmpProvider.loadRecords(tmpTable, tmpStart, this._clampSize(this.pict.AppData.RecordBrowser.PageSize));
				}
				else
				{
					tmpProvider.refreshRecordBrowserViewData();
					this.render();
				}
				break;
			}
		}
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
