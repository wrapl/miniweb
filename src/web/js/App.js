import * as WebSocket from 'network/WebSocket';
import * as L20n from 'lib/L20n';

export const T = _class(null, init, {
	setLocale: setLocale
});

export function init(self, widget) {
	window.app = self;
	self.widget = widget;
	document.body.replaceChildren(widget.element);
	widget.position(0, 0, window.innerWidth, window.innerHeight);
	var resizeTimeout;
	window.addEventListener("resize", event => {
		if (!resizeTimeout) resizeTimeout = setTimeout(() => {
			resizeTimeout = null;
			widget.position(0, 0, window.innerWidth, window.innerHeight);
		}, 100);
	});
}

function setLocale(self, locale) {
	L20n.setLocale(locale);
}
