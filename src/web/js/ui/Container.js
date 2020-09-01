import * as _Widget from "ui/Widget";
import * as _Solver from "lib/Solver";

export const T = _class(init, _Widget.T, {
	computeSize: computeSize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension,
	addChildConstraint: addChildConstraint,
	addChildSuggestion: addChildSuggestion,
	removeChildConstraint: removeChildConstraint
});

export function init(t, element) {
	_Widget.init(t, <div style="position: absolute; left: 0px; top: 0px"/>);
	t.children = {};
	let solver = t.solver = new _Solver.T();
	t.widthVar = solver.variable("Width");
	t.heightVar = solver.variable("Height");
}

function computeSize(t) {
	let solver = t.solver;
	let widthVar = t.widthVar;
	let heightVar = t.heightVar;
	
	for (var id in t.children) {
		var child = t.children[id];
		var size = child.widget.defaultSize();
		for (var rule in size) {
			if (size[rule] != child[rule]) {
				if (child[rule + "constraint"]) t.removeChildConstraint(child.widget, child[rule + "constraint"]);
				child[rule + "constraint"] = t.addChildConstraint(child.widget, rule, size[rule]);
			}
		}
	}
	
	solver.suggest(widthVar, 0, 1);
	solver.suggest(heightVar, 0, 1);
	solver.resolve();
	
	return {"min-width": [widthVar.value], "min-height": [heightVar.value]};
}

function getDimension(t, child, dimension, expr) {
	throw "Must be overriden in sub-class";
}

function addChildConstraint(t, widget, rule, expr, strength) {
	var child = t.children[widget.id];
	if (!child) throw "Invalid parent";
	rule = rule.split("-").reverse();
	var expression = t.getDimension(child, rule[0], expr);
	var constraint;
	switch (rule[1]) {
	case undefined:
		constraint = t.solver.constrain(expression, true, strength);
		break;
	case "min":
		constraint = t.solver.constrain(expression, false, strength);
		break;
	case "max":
		constraint = t.solver.constrain(expression.mul(-1), false, strength);
		break;
	}
	child.constraints[constraint] = true;
	return constraint;
}

function addChildSuggestion(t, widget, rule, expr, strength) {
	var child = t.children[widget.id];
	if (!child) throw "Invalid parent";
	rule = rule.split("-").reverse();
	var expression = t.getDimension(child, rule[0], expr);
	t.solver.suggest(null, expression, strength);
}

function removeChildConstraint(t, widget, constraint) {
	var child = t.children[widget.id];
	delete child.constraints[constraint];
	t.solver.unconstrain(constraint);
}

export function addChild(t, widget) {
	if (widget.parent) child.parent.removeChild(widget);
	var child = t.children[widget.id] = {widget: widget, constraints: []};
	widget.parent = t;
	t.element.appendChild(widget.element);
	return child;
}

export function removeChild(t, widget) {
	var child = t.children[widget.id];
	var constraints = child.constraints;
	for (var constraint in constraints) t.solver.unconstrain(constraint);
	delete t.children[widget.id];
	t.element.removeChild(widget.element);
	widget.parent = null;
}
