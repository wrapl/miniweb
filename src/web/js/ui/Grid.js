import * as Widget from "ui/Widget";
import * as Container from "ui/Container";
import * as Scrollbar from "ui/Scrollbar";

export const T = _class(Container.T, init, {
	resize: resize,
	addChild: addChild,
	getDimension: getDimension,
	insertRow: insertRow,
	insertColumn: insertColumn
})

export function init(self, attrs) {
	Container.init(self, attrs);
	self.numCols = 0;
	self.numRows = 0;
	self.rowVars = [];
	self.colVars = [];
	self.widthConstraint = self.solver.constrain(self.widthVar, true);
	self.heightConstraint = self.solver.constrain(self.heightVar, true);
}

function addChild(self, widget, col1, row1, col2, row2) {
	if (col1 === undefined) {
		col1 = widget.attrs.position[0];
		row1 = widget.attrs.position[1];
		col2 = widget.attrs.position[2];
		row2 = widget.attrs.position[3];
	}
	if (!(col1 <= col2)) col2 = col1
	if (!(row1 <= row2)) row2 = row1
	var child = Container.addChild(self, widget)
	child.col1 = col1
	child.row1 = row1
	child.col2 = col2
	child.row2 = row2
	var solver = self.solver
	if (self.numCols <= col2) {
		solver.unconstrain(self.widthConstraint)
		var expression = self.widthVar
		for (var i = 0; i < self.numCols; ++i) expression = expression.sub(self.colVars[i])
		for (var i = self.numCols; i <= col2; ++i) {
			var v = solver.variable("col", 0)
			self.colVars.push(v)
			expression = expression.sub(v)
		}
		self.widthConstraint = solver.constrain(expression, true)
		self.numCols = self.colVars.length
	}
	if (self.numRows <= row2) {
		solver.unconstrain(self.heightConstraint)
		var expression = self.heightVar
		for (var i = 0; i < self.numRows; ++i) expression = expression.sub(self.rowVars[i])
		for (var i = self.numRows; i <= row2; ++i) {
			var v = solver.variable("row", 0)
			self.rowVars.push(v)
			expression = expression.sub(v)
		}
		self.heightConstraint = solver.constrain(expression, true)
		self.numRows = self.rowVars.length
	}
	Container.addChildConstraints(self, widget);
}

function getDimension(self, child, dimension, expr) {
	var children = self.children
	var solver = self.solver
	var colVars = self.colVars
	var rowVars = self.rowVars
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		for (var col = child.col1; col <= child.col2; ++col) expression = expression.add(colVars[col])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				for (var col = child2.col1; col <= child2.col2; ++col) expression = expression.sub(colVars[col].mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(widthVar.mul(expr[i + 1]))
			} else {
				expression = expression.sub(expr[i])
				break
			}
		}
		break
	case "height":
		for (var row = child.row1; row <= child.row2; ++row) expression = expression.add(rowVars[row])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				for (var row = child2.row1; row <= child2.row2; ++row) expression = expression.sub(rowVars[row].mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(heightVar.mul(expr[i + 1]))
			} else {
				expression = expression.sub(expr[i])
				break
			}
		}
		break
	case "aspect":
		var coeff = expr[0]
		for (var row = child.row1; row <= child.row2; ++row) expression = expression.add(rowVars[row])
		for (var col = child.col1; col <= child.col2; ++col) expression = expression.sub(colVars[col].mul(coeff))
		break
	case "shape":
		for (var col = child.col1; col <= child.col2; ++col) expression = expression.add(colVars[col])
		for (var row = child.row1; row <= child.row2; ++row) expression = expression.add(rowVars[row])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				for (var col = child2.col1; col <= child2.col2; ++col) expression = expression.sub(colVars[col].mul(coeff))
				for (var row = child2.row1; row <= child2.row2; ++row) expression = expression.sub(rowVars[row].mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(widthVar.mul(expr[i + 1]))
				expression = expression.sub(heightVar.mul(expr[i + 1]))
			} else {
				expression = expression.sub(expr[i])
				break
			}
		}
		break
	}
	return expression
}

export function resize(self, width, height) {
	console.log("Grid.resize", width, height)
	self.defaultSize()
	
	var solver = self.solver
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var rowVars = self.rowVars
	var colVars = self.colVars
	
	for (var i = 0; i < rowVars.length; ++i) solver.stay(rowVars[i], 1)
	for (var i = 0; i < colVars.length; ++i) solver.stay(colVars[i], 1)
	solver.suggest(widthVar, width, 1000000)
	solver.suggest(heightVar, height, 1000000)
	solver.resolve()
	var style = self.element.style
	style.overflow = "visible"
	
	console.log(widthVar.value, heightVar.value)
	if (widthVar.value > width + 1) {
		if (heightVar.value > height + 1) {
			solver.suggest(widthVar, width - Scrollbar.size, 1000000)
			solver.suggest(heightVar, height - Scrollbar.size, 1000000)
			solver.resolve()
		} else {
			solver.suggest(widthVar, width, 1000000)
			solver.suggest(heightVar, height - Scrollbar.size, 1000000)
			solver.resolve()
		}
		style.overflow = "auto"
	} else if (heightVar.value > height + 1) {
		solver.suggest(widthVar, width - Scrollbar.size, 1000000)
		solver.suggest(heightVar, height, 1000000)
		solver.resolve()
		style.overflow = "auto"
	}
	solver.clear()
	
	var rows = [0], cols = [0]
	for (var i = 0; i < self.numRows; ++i) rows.push(rows[i] + rowVars[i].value)
	for (var i = 0; i < self.numCols; ++i) cols.push(cols[i] + colVars[i].value)
	var totalDiff = 0
	for (var i = 0; i <= self.numRows; ++i) {
		var diff = rows[i] % 1
		rows[i] -= diff
		totalDiff += diff
	}
	if (totalDiff >= 1) rows[self.numRows]++
	totalDiff = 0
	for (var i = 0; i <= self.numCols; ++i) {
		var diff = cols[i] % 1
		cols[i] -= diff
		totalDiff += diff
	}
	if (totalDiff >= 1) cols[self.numCols]++
	
	for (var id in self.children) {
		var child = self.children[id]
		var x = cols[child.col1], width = cols[child.col2 + 1] - x
		var y = rows[child.row1], height = rows[child.row2 + 1] - y
		console.log("Child", id, x, y, width, height)
		child.widget.position(x, y, width, height)
	}
	
	self.element.style.width = widthVar.value + "px"
	self.element.style.height = heightVar.value + "px"	
	
	Widget.resize(self, width, height)
}

function insertRow(self, index, count) {
	count = count || 1
	if (index < 0) index += self.numRows
	for (var i = 0; i < count; ++i) self.rowVars.splice(index, 0, self.solver.variable("row"))
	for (var id in self.children) {
		var child = self.children[id]
		if (child.row1 >= index) child.row1 += count
		if (child.row2 >= index) child.row2 += count
	}
	self.numRows += count
	self.solver.unconstrain(self.heightConstraint)
	var expression = self.heightVar
	for (var i = 0; i < self.numRows; ++i) expression = expression.sub(self.rowVars[i])
	self.heightConstraint = self.solver.constrain(expression, true)
	self.numRows = self.rowVars.length
	return index
}

function insertColumn(self, index, count) {
	count = count || 1
	if (index < 0) index += self.numCols
	for (var i = 0; i < count; ++i) self.colVars.splice(index, 0, self.solver.variable("col"))
	for (var id in self.children) {
		var child = self.children[id]
		if (child.col1 >= index) child.col1 += count
		if (child.col2 >= index) child.col2 += count
	}
	self.numCols += count
	self.solver.unconstrain(self.widthConstraint)
	var expression = self.widthVar
	for (var i = 0; i < self.numCols; ++i) expression = expression.sub(self.colVars[i])
	self.widthConstraint = self.solver.constrain(expression, true)
	return index
}
