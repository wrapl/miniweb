import * as _Class from "lib/Class";

export const T = _class(init, null, {
	appendChild: appendChild,
	appendChildren: appendChildren
});

export function init(t, element, attrs) {
	t.element = element;
	for (var attr in attrs) {
		if (attr.startsWith("on-")) {
			t.connect(attr.substring(3), attrs[attr])
		}
	}
}

function appendChild(t, child) {
	t.element.appendChild(child);
}

function appendChildren(t) {
	t.element.appendChildren(Array.prototype.slice.call(arguments, 1));
}
