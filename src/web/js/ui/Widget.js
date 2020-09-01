import * as _Class from "lib/Class";

export const T = _class(init, null, {
	appendChild: appendChild,
	appendChildren: appendChildren,
	position: position,
	resize: resize,
	hide: hide,
	show: show,
	addConstraint: addConstraint,
	addSuggestion: addSuggestion,
	removeConstraint: removeConstraint,
	defaultSize: defaultSize,
	computeSize: computeSize
});

export function init(t, attrs, element) {
	t.parent = null;
	t.id = newId();
	t.size = {width: 0, height: 0};
	t.border = {top: 0, bottom: 0, left: 0, right: 0};
	t.minSize = null;
	if (!element) element = <div/>;
	element.id = t.id;
	element.style.position = "absolute";
	element.style.top = "0";
	element.style.left = "0";
	t.element = element;
	if (attrs) for (var attr in attrs) {
		if (attr.startsWith("on-")) {
			t.connect(attr.substring(3), attrs[attr]);
			delete attrs[attr];
		}
	}
	t.attrs = attrs;
}

function appendChild(t, child) {
	t.element.appendChild(child);
}

function appendChildren(t) {
	t.element.appendChildren(Array.prototype.slice.call(arguments, 1));
}

function position(t, x, y, width, height) {
	let element = t.element;
	let border = t.border;
	x += border.left;
	y += border.top;
	element.style.left = x + "px";
	element.style.top = y + "px";
	width -= (border.left + border.right);
	height -= (border.top + border.bottom);
	element.style.width = width + "px";
	element.style.height = height + "px";
	t.size = {x: x, y: y, width: width, height: height};
	t.resize(width, height);
}

export function resize(t, width, height) {
	t.emit("resize", width, height);
}

function hide(t) {
	t.element.style.display = "none";
}

function show(t) {
	t.element.style.display = "";
}

function addConstraint(t, rule, expr, strength) {
	if (!t.parent) return null;
	return t.parent.addChildConstraint(t, rule, expr, strength);
}

function addSuggestion(t, rule, expr, strength) {
	if (!t.parent) return null;
	return t.parent.addChildSuggestion(t, rule, expr, strength);
}

function removeConstraint(t, constraint) {
	if (!t.parent) return;
	t.parent.removeChildConstraint(t, constraint);
}

function defaultSize(t) {
	return t.defaultSize_ || (t.defaultSize_ = t.computeSize());
}

function computeSize(t) {
	return {}
}
