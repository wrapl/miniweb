import * as Widget from "ui/Widget";
import * as Container from "ui/Container";

var sliderHeight = 7;

export const T = _class(init, Container.T, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension
});

function init(self, attrs) {
	Container.init(self, attrs);
	self.rowVars = [];
	self.heightConstraint = self.solver.constrain(self.heightVar, true);
	self.sliders = [];
	self.orderedChildren = [];
}

function addChild(self, widget) {
	var child = Container.addChild(self, widget)
	var solver = self.solver
	var rowVars = self.rowVars
	var heightVar = self.heightVar
	var widthVar = self.widthVar
	var orderedChildren = self.orderedChildren
	var solver = self.solver
	self.solver.unconstrain(self.heightConstraint)
	var v = solver.variable("Row", 0)
	rowVars.push(v)
	var expression = heightVar
	for (var i = 0; i < rowVars.length; ++i) expression = expression.sub(rowVars[i])
	self.heightConstraint = solver.constrain(expression.sub(sliderHeight * (rowVars.length - 1)), true)
	child.index = self.orderedChildren.length
	orderedChildren.push(widget)
	if (child.index > 0) {
		var sliders = self.sliders
		var slider = <div className="paned-slider horizontal" style="height:7px;"><div/></div>;
		self.element.appendChild(slider)
		sliders.push(slider)
		if (window.orientation) {
			slider.appendChild(<span className="hint"/>);
			var initial = false
			slider.onmousedown = function(event) {
				var rowVarTop = rowVars[child.index - 1], rowVarBottom = rowVars[child.index]
				solver.stay(heightVar)
				if (initial) {
					solver.suggest(rowVarTop, 10000, 1000)
					solver.suggest(rowVarBottom, 0, 1000)
				} else {
					solver.suggest(rowVarTop, 0, 1000)
					solver.suggest(rowVarBottom, 10000, 1000)
				}
				solver.resolve()
				solver.clear()
				var y = 0
				var height = rowVars[0].value
				orderedChildren[0].position(0, y, widthVar.value, height)
				if (height < 2) {
					orderedChildren[0].hide()
				} else {
					orderedChildren[0].show()
				}
				y += height
				for (var i = 1; i < orderedChildren.length; ++i) {
					sliders[i - 1].style.top = y + "px"
					sliders[i - 1].style.width = widthVar.value + "px"
					y += sliderHeight
					var height = rowVars[i].value
					orderedChildren[i].position(0, y, widthVar.value, height)
					if (height < 2) {
						orderedChildren[i].hide()
					} else {
						orderedChildren[i].show()
					}
					y += height
				}
				initial = !initial
				solver.unstayAll()
			}
		} else {
			slider.onmousedown = function(event) {
				var rowVarTop = rowVars[child.index - 1], rowVarBottom = rowVars[child.index]
				var start = rowVarTop.value - event.clientY, total = rowVarTop.value + rowVarBottom.value
				solver.stay(heightVar)
				for (var i = 0; i < rowVars.length; ++i) solver.stay(rowVars[i], 10)
				captureMouseMove(function(event) {
					solver.suggest(rowVarTop, start + event.clientY, 1000)
					solver.suggest(rowVarBottom, total - (start + event.clientY), 1000)
					solver.resolve()
					solver.clear()
					var y = 0
					var height = rowVars[0].value
					orderedChildren[0].position(0, y, widthVar.value, height)
					y += height
					for (var i = 1; i < orderedChildren.length; ++i) {
						sliders[i - 1].style.top = y + "px"
						sliders[i - 1].style.width = widthVar.value + "px"
						y += sliderHeight
						var height = rowVars[i].value
						orderedChildren[i].position(0, y, widthVar.value, height)
						y += height
					}
				}, function(event) {
					solver.unstayAll()
				})
				return false
			}
		}
	}
	return slider
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
	self.solver.unconstrain(self.heightConstraint)
	var expression = self.heightVar
	for (var i = 0; i < self.rowVars.length; ++i) expression = expression.sub(self.rowVars[i])
	self.widthConstraint = self.solver.constrain(expression.sub(sliderWidth * (self.rowVars.length - 1)), true)
	Container.removeChild(self, widget)
}

function getDimension(self, child, dimension, expr) {
	var children = self.children
	var solver = self.solver
	var rowVars = self.rowVars
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(widthVar)
		break
	case "height":
		expression = expression.add(rowVars[child.index])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof Widget.T) {
				var child2 = children[expr[i].Id]
				var coeff = expr[i + 1]
				expression = expression.sub(rowVars[child2.index].mul(coeff))
			} else if (expr[i] === "*") {
				expression = expression.sub(heightVar.mul(expr[i + 1]))
			} else {
				expression = expression.sub(expr[i])
				break
			}
		}
		break
	case "aspect":
		expression = expression.sub(rowVars[child.index]).add(widthVar.div(expr[0]))
		break
	case "shape":
		expression = expression.add(rowVars[child.index]).add(widthVar)
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

function resize(self, width, height) {
	self.defaultSize()
	var solver = self.solver
	var widthVar = self.widthVar
	var heightVar = self.heightVar
	var rowVars = self.rowVars

	for (var i = 0; i < rowVars.length; ++i) solver.stay(rowVars[i], 1)
	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	var orderedChildren = self.orderedChildren
	var sliders = self.sliders
	
	var y = 0
	var height = rowVars[0].value
	orderedChildren[0].position(0, y, widthVar.value, height)
	y += height
	for (var i = 1; i < orderedChildren.length; ++i) {
		sliders[i - 1].style.top = y + "px"
		sliders[i - 1].style.width = widthVar.value + "px"
		y += sliderHeight
		var height = rowVars[i].value
		orderedChildren[i].position(0, y, widthVar.value, height)
		y += height
	}
	
	self.element.style.width = widthVar.value + "px"
	self.element.style.height = y + "px"	
	
	Widget.resize(self, width, height)
}
