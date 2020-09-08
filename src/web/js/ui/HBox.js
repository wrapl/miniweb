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
	self.colVars = [];
	self.widthConstraint = self.solver.constrain(self.widthVar, true);
}

function addChild(self, widget) {
	var child = Container.addChild(self, widget)
	var solver = self.solver;
	var colVars = self.colVars;
	solver.unconstrain(self.widthConstraint);
	child.index = colVars.length;
	colVars.push(solver.variable("col", 0));
	var expression = self.widthVar;
	for (var i = 0; i < colVars.length; ++i) expression = expression.sub(colVars[i]);
	self.widthConstraint = solver.constrain(expression, true);
	Container.addChildConstraints(self, widget);
}

function getDimension(self, child, dimension, expr) {
	var children = self.children
	var solver = self.solver
	var colVars = self.colVars
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(colVars[child.index]);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id];
				var coeff = expr[i + 1];
				expression = expression.sub(colVars[child2.index].mul(coeff));
			} else if (expr[i] === "*") {
				expression = expression.sub(widthVar.mul(expr[i + 1]));
			} else {
				expression = expression.sub(expr[i]);
				break;
			}
		}
		break
	case "height":
		expression = expression.add(heightVar);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id];
				var coeff = expr[i + 1];
				expression = expression.sub(heightVar.mul(coeff));
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
		expression = expression.add(heightVar).sub(colVars[child.index].mul(coeff));
		break
	case "shape":
		expression = expression.add(colVars[child.index]);
		expression = expression.add(heightVar);
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				expression = expression.sub(colVars[child2.index].mul(coeff))
				expression = expression.sub(heightVar.mul(coeff))
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
	console.log("HBox.resize", width, height);
	self.defaultSize();
	
	var solver = self.solver;
	var widthVar = self.widthVar;
	var heightVar = self.heightVar;
	var colVars = self.colVars;
	
	for (var i = 0; i < colVars.length; ++i) solver.stay(colVars[i], 100);
	solver.suggest(widthVar, width, 1000000);
	solver.suggest(heightVar, height, 1000000);
	solver.resolve();
	var style = self.element.style;
	style.overflow = "visible";
	
	console.log(widthVar.value, heightVar.value);
	console.log(solver);
	if (widthVar.value > width + 1) {
		if (heightVar.value > height + 1) {
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

	var numCols = colVars.length;
	var cols = [0];
	for (var i = 0; i < numCols; ++i) cols.push(cols[i] + colVars[i].value);
	var totalDiff = 0;
	for (var i = 0; i <= numCols; ++i) {
		var diff = cols[i] % 1;
		cols[i] -= diff;
		totalDiff += diff;
	}
	if (totalDiff >= 1) cols[numCols]++;
	
	height = heightVar.value;
	for (var id in self.children) {
		var child = self.children[id];
		var x = cols[child.index], width = cols[child.index + 1] - x;
		console.log("Child", id, x, 0, width, height);
		child.widget.position(x, 0, width, height);
	}
	
	self.element.style.width = widthVar.value + "px"
	self.element.style.height = heightVar.value + "px"	
	
	Widget.resize(self, width, height)
}
