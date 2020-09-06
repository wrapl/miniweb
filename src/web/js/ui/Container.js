import * as Widget from "ui/Widget";
import * as Solver from "lib/Solver";

export const T = _class(Widget.T, init, {
	computeSize: computeSize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension,
	addChildConstraint: addChildConstraint,
	addChildSuggestion: addChildSuggestion,
	removeChildConstraint: removeChildConstraint
});

export function init(self, attrs) {
	var element = <div style="position: absolute; left: 0px; top: 0px">
		{self.innerElement = <div style="position: absolute; left: 0px; top: 0px"/>}
	</div>;
	Widget.init(self, attrs, element);
	self.children = {};
	let solver = self.solver = new Solver.T();
	self.widthVar = solver.variable("width");
	self.heightVar = solver.variable("height");
}

function computeSize(self) {
	let solver = self.solver;
	let widthVar = self.widthVar;
	let heightVar = self.heightVar;
	
	for (var id in self.children) {
		var child = self.children[id];
		var size = child.widget.defaultSize();
		for (var rule in size) {
			if (size[rule] != child[rule]) {
				if (child[rule + "constraint"]) self.removeChildConstraint(child.widget, child[rule + "constraint"]);
				child[rule + "constraint"] = self.addChildConstraint(child.widget, rule, size[rule]);
			}
		}
	}
	
	solver.suggest(widthVar, 0, 1);
	solver.suggest(heightVar, 0, 1);
	solver.resolve();
	
	return {"min-width": [widthVar.value], "min-height": [heightVar.value]};
}

function getDimension(self, child, dimension, expr) {
	throw "Must be overriden in sub-class";
}

function addChildConstraint(self, widget, rule, expr, strength) {
	var child = self.children[widget.id];
	if (!child) throw "Invalid parent";
	rule = rule.split("-").reverse();
	var expression = self.getDimension(child, rule[0], expr);
	var constraint;
	switch (rule[1]) {
	case undefined:
		constraint = self.solver.constrain(expression, true, strength);
		break;
	case "min":
		constraint = self.solver.constrain(expression, false, strength);
		break;
	case "max":
		constraint = self.solver.constrain(expression.mul(-1), false, strength);
		break;
	}
	child.constraints[constraint] = true;
	return constraint;
}

function addChildSuggestion(self, widget, rule, expr, strength) {
	var child = self.children[widget.id];
	if (!child) throw "Invalid parent";
	rule = rule.split("-").reverse();
	var expression = self.getDimension(child, rule[0], expr);
	self.solver.suggest(null, expression, strength);
}

function removeChildConstraint(self, widget, constraint) {
	var child = self.children[widget.id];
	delete child.constraints[constraint];
	self.solver.unconstrain(constraint);
}

const standardConstraints = ["width", "height"];

export function addChildConstraints(self, widget) {
	standardConstraints.forEach(name => {
		if (widget.attrs[name]) {
			self.addChildConstraint(widget, name, widget.attrs[name]);
		}
	})
}

export function addChild(self, widget) {
	if (widget.parent) child.parent.removeChild(widget);
	var child = self.children[widget.id] = {widget: widget, constraints: []};
	widget.parent = self;
	self.innerElement.appendChild(widget.element);
	return child;
}

export function removeChild(self, widget) {
	var child = self.children[widget.id];
	var constraints = child.constraints;
	for (var constraint in constraints) self.solver.unconstrain(constraint);
	delete self.children[widget.id];
	self.innerElement.removeChild(widget.element);
	widget.parent = null;
}
