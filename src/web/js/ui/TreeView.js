import * as _Adjustment from "lib/Adjustment";

export const CellRendererT = _class(null, cellRendererInit, {
	render: function(renderer, element) {throw 'Not implemented'}
})

function cellRendererInit(renderer) {
	renderer.Width = 0
	renderer.Height = 0
	renderer.Sensitive = true
	renderer.Visible = true
	renderer.XAlign = 0
	renderer.YAlign = 0.5
}


var text_renderer_t = _class(CellRendererT, textRendererInit, {
	render: textRendererRender
})

function textRendererInit(renderer) {
	cellRendererInit(renderer)
}

function textRendererRender(renderer, element) {
	var Value = ''
	if (renderer.Value) {
		Value = Cell.Value
	} else if (Cell.Field) {
		if (row) Value = Model.get_value(row, Cell.Field)
	}
	var Element = <span className='treeview renderer text-renderer'>{Value}</span>;
	element.appendChild(Element)
}


export const IconRendererT = _class(CellRendererT, iconRendererInit, {
	render: iconRendererRender
})

function iconRendererInit(renderer) {
	cellRendererInit(renderer)
}

function iconRendererRender(renderer, element) {

}


var column_t = _class(null, column_init, {
	append: columnAppend
})

function column_init(column, Title) {
	column.Title = Title
	column.Cells = []
	column.MaxWidth = 100
	column.MinWidth = 10
	column.FixedWidth = 100
	column.ConnectedSignals = {}
}

function columnAppend(column, Cell, Attrs) {
	column.Cells.push(Cell)
	Cell._PrivColumn = {Attrs: {}}
	for (var Attr in Attrs) _PrivColumn.Attrs[Attr] = Attrs[Attr]	
	emit(TColumn, 'cell-added', Cell)
}


export const RowT = _class(null, rowInit)

function rowInit(row) {
	t.children = []
	t.position = null
	row.element = <span className='list-view row'/>;
}

function cellCreateElement() {
	return <span className='list-view column cell'/>;
}


export const T = _class(null, init, {
	setModel: setModel,
	appendColumn: appendColumn
})

function init(t) {
	t.rowHeight = 10
	t.children = []
	t.element = <div className='treeview container'>
		{t.headerElement = <span className='treeview column-headers container'/>}
		{t.gridElement = <div className='treeview grid container'/>}
	</div>
	var vAdjustment = t.vAdjustment = new _Adjustment.t(0, 0, 0)
	vAdjustment.connect('changed', () => vadjustment_changed(t))
	t.openPaths = []
}

function vadjustment_changed(t) {
	
}

function update(t) {
	var vAdjustment = t.vAdjustment
	var Page = vAdjustment.Page
	var StartY = vAdjustment.MinValue
	var EndY = vAdjustment.MaxValue
	var StartN = Math.floor(StartY / t.rowHeight)
}

function setModel(t, Model) {
	if (t.ModelRowChangedId) t.ModelRowChangedId.disconnect()
	if (t.ModelRowInsertedId) t.ModelRowInsertedId.disconnect()
	if (t.ModelRowDeletedId) t.ModelRowDeletedId.disconnect()
	
	t.Model = Model
	
	t.ModelRowChangedId = Model.connect('row-changed', modelRowChangedEvent, t)
	t.ModelRowInsertedId = Model.connect('row-inserted', modelRowInsertedEvent, t)
	t.ModelRowDeletedId = Model.connect('row-deleted', modelRowDeletedEvent, t)
}

function modelRowChangedEvent(Model, Signal, t, row) {

}

function modelRowInsertedEvent(Model, Signal, t, row) {

}

function modelRowDeletedEvent(Model, Signal, t, row) {

}

function appendColumn(t, column) {
	t.Columns.push(column)
	var children = t.children
	for (var I = 0; I < children.length; I++) {
		var row = children[I]
		var ColumnElement = create_element('span', {'class': 'treeview column'})
		row.element.appendChild(ColumnElement)
		var Cells = column.Cells
		for (var J = 0; J < Cells.length; J++) 	ColumnElement.appendChild(cellCreateElement())
		row.element.appendChild(ColumnElement)
	}
	
	column.ConnectedSignals['cell-inserted'] = connect(column, 'cell-inserted', function(__, Cell) {
		var Index = t.Columns.indexOf(column)
		if (Index == -1) console.error('column not found')
		for (var I = 0; I < Rows.length; I++) {
			var row = Rows[I]
			var ColumnElement = row.element.children[Index]
			ColumnElement.appendChild(cellCreateElement())
		}
	})
	return column
}

function redraw(t) {

}
