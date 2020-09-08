import * as Widget from "ui/Widget";

export const T = _class(Widget.T, init, {
	addChild: addChild,
	resize: resize
})

function init(self, attrs) {
	self.titleHeight = attrs.titleHeight || 20;
	self.margin = attrs.margin || 0;
	self.borderWidth = attrs.borderWidth || 0;
	self.padding = attrs.padding || 0;
	var titleElement = <div className="title">{attrs.title}</div>;
	var element = <div className="frame">{titleElement}</div>;
	Widget.init(self, {}, element)
	var titleStyle = titleElement.style
	titleStyle.height = self.titleHeight + "px"
	titleStyle.marginTop = titleStyle.marginLeft = titleStyle.marginRight = self.margin + "px"
}

function addChild(self, child) {
	self.child = child
	var childElement = <div className="child" style="position:relative;">{child.element}</div>
	self.element.appendChild(childElement)
	var childStyle = childElement.style
	childStyle.left = childStyle.right = childStyle.bottom = self.margin + "px"
	childStyle.top = self.margin + self.titleHeight + "px"
	childStyle.borderLeftWidth = childStyle.borderRightWidth = childStyle.borderBottomWidth = self.borderWidth + "px"
	child.parent = self
}

function resize(self, width, height) {
	self.child.position(self.padding, self.padding, width - 2 * (self.margin + self.borderWidth + self.padding), height - 2 * (self.margin + self.borderWidth + self.padding) - self.titleHeight)
}
