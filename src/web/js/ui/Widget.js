import "lib/Class";

export const T = _class(null, init, {
	addChild: addChild,
	position: position,
	resize: resize,
	hide: hide,
	show: show,
	addConstraint: addConstraint,
	addSuggestion: addSuggestion,
	removeConstraint: removeConstraint,
	defaultSize: defaultSize,
	computeSize: computeSize,
	addBlur: addBlur,
	removeBlur: removeBlur	
});

export function init(self, attrs, element) {
	self.parent = null;
	self.id = newId();
	self.size = {width: 0, height: 0};
	self.border = {top: 0, bottom: 0, left: 0, right: 0};
	self.minSize = null;
	self.blur = 0;
	if (!element) element = <div/>;
	element.id = self.id;
	element.style.position = "absolute";
	element.style.top = "0";
	element.style.left = "0";
	self.element = element;
	for (var attr in attrs) {
		if (attr.startsWith("on-")) {
			self.connect(attr.substring(3), attrs[attr]);
			delete attrs[attr];
		}
	}
	self.attrs = attrs;
}

function addChild(self, child) {
	self.element.appendChild(child);
}

function position(self, x, y, width, height) {
	let element = self.element;
	let border = self.border;
	x += border.left;
	y += border.top;
	element.style.left = x + "px";
	element.style.top = y + "px";
	width -= (border.left + border.right);
	height -= (border.top + border.bottom);
	element.style.width = width + "px";
	element.style.height = height + "px";
	self.size = {x: x, y: y, width: width, height: height};
	self.resize(width, height);
}

export function resize(self, width, height) {
	self.emit("resize", width, height);
}

function hide(self) {
	self.element.style.display = "none";
}

function show(self) {
	self.element.style.display = "";
}

function addConstraint(self, rule, expr, strength) {
	if (!self.parent) return null;
	return self.parent.addChildConstraint(self, rule, expr, strength);
}

function addSuggestion(self, rule, expr, strength) {
	if (!self.parent) return null;
	return self.parent.addChildSuggestion(self, rule, expr, strength);
}

function removeConstraint(self, constraint) {
	if (!self.parent) return;
	self.parent.removeChildConstraint(self, constraint);
}

function defaultSize(self) {
	return self.defaultSize_ || (self.defaultSize_ = self.computeSize());
}

function computeSize(self) {
	return {}
}

function addBlur(self) {
	if (!self.blur) self.element.addClass("blur");
	++self.blur;
}

function removeBlur(self) {
	--self.blur;
	if (!self.blur) self.element.removeClass("blur");
}
