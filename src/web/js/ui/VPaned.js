import * as _Widget from "ui/Widget";
import * as _Container from "ui/Container";

var sliderHeight = 7;

export const T = _class(init, _Container.T, {
	resize: resize,
	addChild: addChild,
	removeChild: removeChild,
	getDimension: getDimension
});

function init(t) {
	_Container.init(t)
	t.rowVars = []
	t.heightConstraint = t.solver.constrain(t.heightVar, true)
	t.sliders = []
	t.orderedChildren = []
}

function addChild(t, widget) {
	var child = _Container.addChild(t, widget)
	var solver = t.solver
	var rowVars = t.rowVars
	var heightVar = t.heightVar
	var widthVar = t.widthVar
	var orderedChildren = t.orderedChildren
	var solver = t.solver
	t.solver.unconstrain(t.heightConstraint)
	var v = solver.variable("Row", 0)
	rowVars.push(v)
	var expression = heightVar
	for (var i = 0; i < rowVars.length; ++i) expression = expression.sub(rowVars[i])
	t.heightConstraint = solver.constrain(expression.sub(sliderHeight * (rowVars.length - 1)), true)
	child.index = t.orderedChildren.length
	orderedChildren.push(widget)
	if (child.index > 0) {
		var sliders = t.sliders
		var slider = <div className="paned-slider horizontal" style="height:7px;"><div/></div>;
		t.element.appendChild(slider)
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
	t.solver.unconstrain(t.heightConstraint)
	var expression = t.heightVar
	for (var i = 0; i < t.rowVars.length; ++i) expression = expression.sub(t.rowVars[i])
	t.widthConstraint = t.solver.constrain(expression.sub(sliderWidth * (t.rowVars.length - 1)), true)
	_Container.removeChild(t, widget)
}

function getDimension(t, child, dimension, expr) {
	var children = t.children
	var solver = t.solver
	var rowVars = t.rowVars
	var widthVar = t.widthVar
	var heightVar = t.heightVar
	var expression = solver.constant(0)
	switch (dimension) {
	case "width":
		expression = expression.add(widthVar)
		break
	case "height":
		expression = expression.add(rowVars[child.index])
		for (var i = 0; i < expr.length; i += 2) {
			if (expr[i] instanceof _Widget.T) {
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

function resize(t, width, height) {
	t.defaultSize()
	var solver = t.solver
	var widthVar = t.widthVar
	var heightVar = t.heightVar
	var rowVars = t.rowVars

	for (var i = 0; i < rowVars.length; ++i) solver.stay(rowVars[i], 1)
	solver.suggest(widthVar, width)
	solver.suggest(heightVar, height)
	solver.resolve()
	solver.clear()
	
	var orderedChildren = t.orderedChildren
	var sliders = t.sliders
	
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
	
	t.element.style.width = widthVar.value + "px"
	t.element.style.height = y + "px"	
	
	_Widget.resize(t, width, height)
}
