import * as _Widget from "ui/widget";
import * as _Container from "ui/Container";

export const T = _class(init, _Container.T, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension,
	showChild: showChild
})

export function init(t, attrs, element) {
	_Container.init(t, attrs, element)
	t.visibleChild = null
}

function addChild(t, widget, alwaysResize) {
	var child = _Container.addChild(t, widget)
	child.display = widget.element.style.display
	//widget.HtmlElement.style.display = "none"
	widget.hide()
	if (t.visibleChild === null) showChild(t, widget)
	if (widget.alwaysResize) {
		child.alwaysResize = true
		widget.position(0, 0, t.size.width, t.size.height)
	}
}

function removeChild(t, widget) {
	var child = t.children[widget.id]
	if (child === t.visibleChild) t.visibleChild = null
	_Container.removeChild(t, widget)
	if (t.visibleChild === null) for (var id in t.children) {
		showChild(t.children[id])
		break
	}
}

function getDimension(t, _, dimension, expr) {
	var solver = t.solver
	var widthVar = t.widthVar
	var heightVar = t.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(widthVar)
		break
	case "height":
		expression = expression.add(heightVar)
		break
	case "aspect":
		expression = expression.add(widthVar).sub(heightVar.mul(expr[0]))
		break
	case "shape":
		expression = expression.add(widthVar).add(heightVar)
		break
	}
	return expression
}

export function resize(t, width, height) {
	t.defaultSize()
	
	var solver = t.solver
	var widthVar = t.widthVar
	var heightVar = t.heightVar

	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	if (t.visibleChild) t.visibleChild.widget.position(0, 0, widthVar.value, heightVar.value)
	for (var childId in t.children) {
		var child = t.children[childId]
		if (child.alwaysResize) child.widget.position(0, 0, widthVar.value, heightVar.value)
	}
	
	t.element.style.width = widthVar.value + "px"
	t.element.style.height = heightVar.value + "px"	
	
	widget.resize(t, width, height)
}

function showChild(t, widget) {
	var child = t.children[widget.id]
	if (t.visibleChild === child) return
	if (t.visibleChild) {
		t.visibleChild.widget.hide()
	}
	if (t.visibleChild = child) {
		t.visibleChild.widget.show()
		if (t.size.width && t.size.height) t.visibleChild.widget.position(0, 0, t.widthVar.value, t.heightVar.value)
	}
}

function alwaysResize(t, widget, alwaysResize) {
	var child = t.children[widget.id]
	child.alwaysResize = alwaysResize
}
