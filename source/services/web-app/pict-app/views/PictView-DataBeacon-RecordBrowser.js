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
				this._handleAction(tmpBtn.getAttribute('data-databeacon-action'));
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

	_handleAction(pAction)
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
		}
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
