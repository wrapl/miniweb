import * as Widget from "ui/Widget";
import * as Container from "ui/Container";

var sliderWidth = 7;

export const T = _class(Container.T, init, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension
});

function init(self, attrs) {
	Container.init(self, attrs);
	self.colVars = [];
	self.widthConstraint = self.solver.constrain(self.widthVar, true);
	self.sliders = [];
	self.orderedChildren = [];
}

function addChild(self, widget) {
	var child = Container.addChild(self, widget)
	var solver = self.solver
	var colVars = self.colVars
	var heightVar = self.heightVar
	var widthVar = self.widthVar
	var orderedChildren = self.orderedChildren
	var solver = self.solver
	self.solver.unconstrain(self.widthConstraint)
	var v = solver.variable("col", 0)
	colVars.push(v)
	var expression = widthVar
	for (var i = 0; i < colVars.length; ++i) expression = expression.sub(colVars[i])
	self.widthConstraint = solver.constrain(expression.sub(sliderWidth * (colVars.length - 1)), true)
	child.index = self.orderedChildren.length
	orderedChildren.push(widget)
	if (child.index > 0) {
		var sliders = self.sliders
		var slider = <div className="paned-slider vertical" style="width:7px;"><div/></div>;
		self.element.appendChild(slider)
		sliders.push(slider)
		if (window.orientation) {
			slider.appendChild(<span className="hint"/>);
			var initial = false
			slider.onmousedown = function(event) {
				var colVarLeft = colVars[child.index - 1], colVarRight = colVars[child.index]
				solver.stay(widthVar)
				if (initial) {
					solver.suggest(colVarLeft, 10000, 1000)
					solver.suggest(colVarRight, 0, 1000)
				} else {
					solver.suggest(colVarLeft, 0, 1000)
					solver.suggest(colVarRight, 10000, 1000)
				}
				solver.resolve()
				solver.clear()
				var x = 0
				var width = colVars[0].value
				orderedChildren[0].position(x, 0, width, heightVar.value)
				if (width < 2) {
					orderedChildren[0].hide()
				} else {
					orderedChildren[0].show()
				}
				x += width
				for (var i = 1; i < orderedChildren.length; ++i) {
					sliders[i - 1].style.left = x + "px"
					sliders[i - 1].style.height = heightVar.value + "px"
					x += sliderWidth
					var width = colVars[i].value
					orderedChildren[i].position(x, 0, width, heightVar.value)
					if (width < 2) {
						orderedChildren[i].hide()
					} else {
						orderedChildren[i].show()
					}
					x += width
				}
				initial = !initial
				solver.unstayAll()
			}
		} else {
			slider.onmousedown = function(event) {
				var colVarLeft = colVars[child.index - 1], colVarRight = colVars[child.index]
				var start = colVarLeft.value - event.clientX, total = colVarLeft.value + colVarRight.value
				solver.stay(widthVar)
				for (var i = 0; i < colVars.length; ++i) solver.stay(colVars[i], 10)
				captureMouseMove(function(event) {
					solver.suggest(colVarLeft, start + event.clientX, 1000)
					solver.suggest(colVarRight, total - (start + event.clientX), 1000)
					solver.resolve()
					solver.clear()
					var x = 0
					var width = colVars[0].value
					orderedChildren[0].position(x, 0, width, heightVar.value)
					x += width
					for (var i = 1; i < orderedChildren.length; ++i) {
						sliders[i - 1].style.left = x + "px"
						sliders[i - 1].style.height = heightVar.value + "px"
						x += sliderWidth
						var width = colVars[i].value
						orderedChildren[i].position(x, 0, width, heightVar.value)
						x += width
					}
				}, function(event) {
					solver.unstayAll()
				})
				return false
			}
		}
	}
	Container.addChildConstraints(self, widget);
}

function removeChild(self, widget) {
	var child = self.children[widget.id]
	child.index = self.orderedChildren.indexOf(widget)
	var sliders = self.sliders, slider = null
	if (child.index == 0 & self.sliders > 0) {
		slider = sliders.splice(0, 1)[0]
	} else if (child.index > 0) {
		slider = sliders.splice(child.index - 1, 1)[0]
	}
	if (slider != null & slider.parentNode != null) {
		slider.parentNode.removeChild(slider)
	}
	var v = self.colVars.splice(child.index, 1)[0]
	self.solver.unstay(v)
	delete self.solver.Variables[v.id]
	self.orderedChildren.splice(child.index, 1)
	self.solver.unconstrain(self.widthConstraint)
	var expression = self.widthVar
	for (var i = 0; i < self.colVars.length; ++i) expression = expression.sub(self.colVars[i])
	self.widthConstraint = self.solver.constrain(expression.sub(sliderWidth * (self.colVars.length - 1)), true)
	Container.removeChild(self, widget)
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
		expression = expression.add(colVars[child.index])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].id]
				var coeff = expr[i + 1]
				expression = expression.sub(colVars[child2.index].mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(widthVar.mul(expr[i + 1]))
			} else {
				expression = expression.sub(expr[i])
				break
			}
		}
		break
	case "height":
		expression = expression.add(heightVar)
		break
	case "aspect":
		expression = expression.add(colVars[child.index]).sub(heightVar.mul(expr[0]))
		break
	case "shape":
		expression = expression.add(colVars[child.index]).add(heightVar)
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] === "*") {
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
	self.defaultSize()
	var solver = self.solver
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var colVars = self.colVars

	for (var i = 0; i < colVars.length; ++i) solver.stay(colVars[i], 1)
	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	var orderedChildren = self.orderedChildren
	var sliders = self.sliders
	
	var x = 0
	var width = colVars[0].value
	orderedChildren[0].position(x, 0, width, heightVar.value)
	x += width
	for (var i = 1; i < orderedChildren.length; ++i) {
		sliders[i - 1].style.left = x + "px"
		sliders[i - 1].style.height = heightVar.value + "px"
		x += sliderWidth
		var width = colVars[i].value
		orderedChildren[i].position(x, 0, width, heightVar.value)
		x += width
	}
	
	self.element.style.width = x + "px"
	self.element.style.height = heightVar.value + "px"
	
	Widget.resize(self, width, height)
}
