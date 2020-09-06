import * as Widget from 'ui/Widget';
import * as Container from "ui/Container";

export const T = _class(Container.T, init, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension,
	showChild: showChild
})

export function init(self, attrs, element) {
	Container.init(self, attrs, element)
	self.visibleChild = null
}

function addChild(self, widget, alwaysResize) {
	if (alwaysResize === undefined) alwaysResize = widget.alwaysResize
	var child = Container.addChild(self, widget)
	child.display = widget.element.style.display
	//widget.HtmlElement.style.display = "none"
	widget.hide()
	if (self.visibleChild === null) showChild(self, widget)
	if (widget.alwaysResize) {
		child.alwaysResize = true
		widget.position(0, 0, self.size.width, self.size.height)
	}
}

function removeChild(self, widget) {
	var child = self.children[widget.id]
	if (child === self.visibleChild) self.visibleChild = null
	Container.removeChild(self, widget)
	if (self.visibleChild === null) for (var id in self.children) {
		showChild(self.children[id])
		break
	}
}

function getDimension(self, _, dimension, expr) {
	var solver = self.solver
	var widthVar = self.widthVar
	var heightVar = self.heightVar
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

export function resize(self, width, height) {
	self.defaultSize()
	
	var solver = self.solver
	var widthVar = self.widthVar
	var heightVar = self.heightVar

	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	if (self.visibleChild) self.visibleChild.widget.position(0, 0, widthVar.value, heightVar.value)
	for (var childId in self.children) {
		var child = self.children[childId]
		if (child.alwaysResize) child.widget.position(0, 0, widthVar.value, heightVar.value)
	}
	
	self.element.style.width = widthVar.value + "px"
	self.element.style.height = heightVar.value + "px"	
	
	Widget.resize(self, width, height)
}

function showChild(self, widget) {
	var child = self.children[widget.id]
	if (self.visibleChild === child) return
	if (self.visibleChild) {
		self.visibleChild.widget.hide()
	}
	if (self.visibleChild = child) {
		self.visibleChild.widget.show()
		if (self.size.width && self.size.height) self.visibleChild.widget.position(0, 0, self.widthVar.value, self.heightVar.value)
	}
}

function alwaysResize(self, widget, alwaysResize) {
	var child = self.children[widget.id]
	child.alwaysResize = alwaysResize
}
