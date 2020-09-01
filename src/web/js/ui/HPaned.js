import * as _Widget from "ui/Widget";
import * as _Container from "ui/Container";

var sliderWidth = 7;

export const T = _class(init, _Container.T, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension
});

function init(t) {
	_Container.init(t)
	t.colVars = []
	t.widthConstraint = t.solver.constrain(t.widthVar, true)
	t.sliders = []
	t.orderedChildren = []
}

function addChild(t, widget) {
	var child = _Container.addChild(t, widget)
	var solver = t.solver
	var colVars = t.colVars
	var heightVar = t.heightVar
	var widthVar = t.widthVar
	var orderedChildren = t.orderedChildren
	var solver = t.solver
	t.solver.unconstrain(t.widthConstraint)
	var v = solver.variable("Col", 0)
	colVars.push(v)
	var expression = widthVar
	for (var i = 0; i < colVars.length; ++i) expression = expression.sub(colVars[i])
	t.widthConstraint = solver.constrain(expression.sub(sliderWidth * (colVars.length - 1)), true)
	child.index = t.orderedChildren.length
	orderedChildren.push(widget)
	if (child.index > 0) {
		var sliders = t.sliders
		var slider = <div className="paned-slider vertical" style="width:7px;"><div/></div>;
		t.element.appendChild(slider)
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
	return slider
}

function removeChild(t, widget) {
	var child = t.children[widget.id]
	child.index = t.orderedChildren.indexOf(widget)
	var sliders = t.sliders, slider = null
	if (child.index == 0 & t.sliders > 0) {
		slider = sliders.splice(0, 1)[0]
	} else if (child.index > 0) {
		slider = sliders.splice(child.index - 1, 1)[0]
	}
	if (slider != null & slider.parentNode != null) {
		slider.parentNode.removeChild(slider)
	}
	var v = t.colVars.splice(child.index, 1)[0]
	t.solver.unstay(v)
	delete t.solver.Variables[v.id]
	t.orderedChildren.splice(child.index, 1)
	t.solver.unconstrain(t.widthConstraint)
	var expression = t.widthVar
	for (var i = 0; i < t.colVars.length; ++i) expression = expression.sub(t.colVars[i])
	t.widthConstraint = t.solver.constrain(expression.sub(sliderWidth * (t.colVars.length - 1)), true)
	_Container.removeChild(t, widget)
}

function getDimension(t, child, dimension, expr) {
	var children = t.children
	var solver = t.solver
	var colVars = t.colVars
	var widthVar = t.widthVar
	var heightVar = t.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(colVars[child.index])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof _Widget.T) {
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

export function resize(t, width, height) {
	t.defaultSize()
	var solver = t.solver
	var widthVar = t.widthVar
	var heightVar = t.heightVar
	var colVars = t.colVars

	for (var i = 0; i < colVars.length; ++i) solver.stay(colVars[i], 1)
	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	var orderedChildren = t.orderedChildren
	var sliders = t.sliders
	
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
	
	t.element.style.width = x + "px"
	t.element.style.height = heightVar.value + "px"
	
	_Widget.resize(t, width, height)
}
