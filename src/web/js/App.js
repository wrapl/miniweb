import * as _WebSocket from 'network/WebSocket';

export const T = _class(init, null, {
});

export function init(t, defaultView) {
	window.app = t;
	t.view = null;
	t.element = document.body;
	var resizeTimeout;
	window.addEventListener("resize", event => {
		if (!resizeTimeout) resizeTimeout = setTimeout(() => {
			resizeTimeout = null
			var width = window.innerWidth, height = window.innerHeight
			app.emit("resize", width, height);
		}, 100);
	});
}



export function start(view) {
	var app = window.app = new T();
	getRequest('/init', {}, result => {
		_WebSocket.connect(() => {
			
		}, () => {
			console.debug('Error connecting');
		});
	});
}
