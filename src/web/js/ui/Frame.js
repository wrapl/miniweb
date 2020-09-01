import * as _Widget from "ui/Widget";
import * as _Container from "ui/Container";

export const T = _class(init, _Widget.T, {
	resize: resize,
	addChild: addChild
})

function init(t, attrs) {
	t.titleHeight = attrs.titleHeight;
	t.margin = attrs.margin;
	t.borderWidth = attrs.borderWidth;
	t.padding = attrs.padding;
	var titleElement = <div className="title">{attrs.title}</div>;
	var element = <div className="frame">{titleElement}</div>;
	_Widget.init(t, {}, element)
	var titleStyle = titleElement.style
	titleStyle.height = t.titleHeight + "px"
	titleStyle.marginTop = titleStyle.marginLeft = titleStyle.marginRight = t.margin + "px"
}

function resize(t, Width, Height) {
	t.child.position(t.padding, t.padding, Width - 2 * (t.margin + t.borderWidth + t.padding), Height - 2 * (t.margin + t.borderWidth + t.padding) - t.titleHeight)
}

function addChild(t, child) {
	t.child = child
	var childElement = <div className="child" style="position:relative;">{child.element}</div>
	t.element.appendChild(childElement)
	var childStyle = childElement.style
	childStyle.left = childStyle.right = childStyle.bottom = t.margin + "px"
	childStyle.top = t.margin + t.titleHeight + "px"
	childStyle.borderLeftWidth = childStyle.borderRightWidth = childStyle.borderBottomWidth = t.borderWidth + "px"
	child.parent = t
}
