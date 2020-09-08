import * as Widget from "ui/Widget";
import * as Container from "ui/Container";
import * as Scrollbar from "ui/Scrollbar";

export const T = _class(Container.T, init, {
	resize: resize,
	addChild: addChild,
	getDimension: getDimension
})

export function init(self, attrs) {
	Container.init(self, attrs);
	self.rowVars = [];
	self.heightConstraint = self.solver.constrain(self.heightVar, true);
}

function addChild(self, widget) {
	var child = Container.addChild(self, widget)
	var solver = self.solver;
	var rowVars = self.rowVars;
	solver.unconstrain(self.heightConstraint);
	child.index = rowVars.length;
	rowVars.push(solver.variable("row", 0));
	var expression = self.heightVar;
	for (var i = 0; i < rowVars.length; ++i) expression = expression.sub(rowVars[i]);
	self.heightConstraint = solver.constrain(expression, true);
	Container.addChildConstraints(self, widget);
}

function getDimension(self, child, dimension, expr) {
	var children = self.children
	var solver = self.solver
	var rowVars = self.rowVars
	var heightVar = self.heightVar
	var widthVar = self.widthVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(widthVar);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id];
				var coeff = expr[i + 1];
				expression = expression.sub(widthVar.mul(coeff));
			} else if (expr[i] === "*") {
				expression = expression.sub(widthVar.mul(expr[i + 1]));
			} else {
				expression = expression.sub(expr[i]);
				break;
			}
		}
		break
	case "height":
		expression = expression.add(rowVars[child.index]);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id];
				var coeff = expr[i + 1];
				expression = expression.sub(rowVars[child2.index].mul(coeff));
			} else if (expr[i] === "*") {
				expression = expression.sub(heightVar.mul(expr[i + 1]));
			} else {
				expression = expression.sub(expr[i]);
				break;
			}
		}
		break
	case "aspect":
		var coeff = expr[0];
		expression = expression.add(widthVar).sub(rowVars[child.index].mul(coeff));
		break
	case "shape":
		expression = expression.add(rowVars[child.index]);
		expression = expression.add(widthVar);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				expression = expression.sub(rowVars[child2.index].mul(coeff))
				expression = expression.sub(widthVar.mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(heightVar.mul(expr[i + 1]))
				expression = expression.sub(widthVar.mul(expr[i + 1]))
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
	console.log("HBox.resize", width, height);
	self.defaultSize();
	
	var solver = self.solver;
	var heightVar = self.heightVar;
	var widthVar = self.widthVar;
	var rowVars = self.rowVars;
	
	for (var i = 0; i < rowVars.length; ++i) solver.stay(rowVars[i], 100);
	solver.suggest(widthVar, width, 1000000);
	solver.suggest(heightVar, height, 1000000);
	solver.resolve();
	var style = self.element.style;
	style.overflow = "visible";
	
	console.log(heightVar.value, widthVar.value);
	console.log(solver);
	if (widthVar.value > width + 1) {
		if (widthVar.value > height + 1) {
			solver.suggest(widthVar, width - Scrollbar.size, 1000000);
			solver.suggest(heightVar, height - Scrollbar.size, 1000000);
			solver.resolve();
		} else {
			solver.suggest(widthVar, width, 1000000);
			solver.suggest(heightVar, height - Scrollbar.size, 1000000);
			solver.resolve();
		}
		style.overflow = "auto";
	} else if (heightVar.value > height + 1) {
		solver.suggest(widthVar, width - Scrollbar.size, 1000000);
		solver.suggest(heightVar, height, 1000000);
		solver.resolve();
		style.overflow = "auto";
	}
	solver.clear();

	var numRows = rowVars.length;
	var rows = [0];
	for (var i = 0; i < numRows; ++i) rows.push(rows[i] + rowVars[i].value);
	var totalDiff = 0;
	for (var i = 0; i <= numRows; ++i) {
		var diff = rows[i] % 1;
		rows[i] -= diff;
		totalDiff += diff;
	}
	if (totalDiff >= 1) rows[numRows]++;
	
	width = widthVar.value;
	for (var id in self.children) {
		var child = self.children[id];
		var y = rows[child.index], height = rows[child.index + 1] - y;
		console.log("Child", id, 0, y, width, height);
		child.widget.position(0, y, width, height);
	}
	
	self.element.style.width = widthVar.value + "px"
	self.element.style.height = heightVar.value + "px"	
	
	Widget.resize(self, width, height)
}
