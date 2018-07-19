import * as _RangeSet from "lib/RangeSet";

var nextIndex = function() {
	var index = 0;
	return () => ++index;
}();

var NotSupportedError = "Websockets are not supported on this browser";

var T = _class(init, null, {
});

function init(t, transport) {
	t.queue = [];
	t.requests = {};
	t.socket = null;
	t.state = 'closed';
	t.error = null;
	t.reconnecting = 3;
	t.times = [];
	t.lastResponse = new Date().valueOf();
	t.whenPropertyIs('state', 'open', sendNext);
}

var DEFAULT_PORTS = {
	http: 80,
	https: 443,
	ws: 80,
	wss: 443
};

var MAX_REQUEST_INTERVAL = 60000;

var t;

function clearResponses() {
	var request = {data: JSON.stringify([0, t.responses.toString()])};
	delete t.responses;
	t.queue.push(request);
	if (t.state === 'open') {
		sendNext();
	} else if (t.state === 'closed') {
		connect(sendNext);
	}
}

function onSocketMessage(event) {
	var message = JSON.parse(event.data);
	t.lastResponse = new Date().valueOf();
	var index = message[0];
	switch (index) {
	case 'reload':
		location.reload();
		return;
	case 'alert':
		send('alert/read', {}, publishEvents);
		return;
	default: {
		if (t.responses) {
			t.responses.add(index);
		} else {
			t.responses = new _RangeSet.T();
			t.responses.add(index);
			setTimeout(clearResponses, 10000);
		}
		var success = message[1];
		var response = message[2];
		var request = t.requests[index];
		if (request) {
			clearTimeout(request.timeout);
			delete t.requests[index];
			var times = t.times;
			times.push(new Date().valueOf() - request.time);
			/*if (times.length > 50) {
				t.times = [];
				send('log/times', {times: times});
			}*/
			try {
				if (success) {
					request.success(response);
				} else {
					request.failure(response);
				}
			} catch (error) {
				console.log(error);
				send('log/error', {message: event.data, error: error.toString(), stack: error.stack});
			}
		}
		return;
	}
	}
}

export function connect(success, failure) {
	if (!WebSocket) throw NotSupportedError;
	t = t || new T();
	switch (t.state) {
	case 'connecting': return;
	case 'open': t.socket.close();
	}
	t.state = 'connecting';
	var webSocketProtocol = window.location.protocol == "https:" ? "wss:" : "ws:";
	var url = location.hostname;
	if (location.port && location.port != DEFAULT_PORTS[location.protocol]) url += ":" + location.port;
	url += location.pathname;
	var to = url.lastIndexOf('/');
	to = to == -1 ? url.length : to;
	url = url.substring(0, to);
	var address = webSocketProtocol + "//" + url + '/socket';
	console.debug('connecting to ' + address);
	var socket = app.socket = t.socket = new WebSocket(address);
	socket.onopen = function(event) {
		console.debug('websocket onopen', event);
		t.error = null;
		t.lastResponse = new Date().valueOf();
		t.state = 'open';
		sendNext();
	};
	socket.onmessage = onSocketMessage;
	socket.onclose = function(event) {
		if (t.socket !== socket) return;
		t.state = 'closed';
		console.debug('websocket onclose', event);
	};
	socket.onerror = function(event) {
		if (t.socket !== socket) return;
		console.error('websocket onerror', event);
		socket.close();
	};
	if (success) t.whenPropertyIs('state', 'open', success);
	if (failure) t.whenPropertyIs('state', 'closed', failure);
}

function sendNext() {
	while (t.state === 'open') {
		var request = t.queue.pop();
		if (!request) return;
		if (request.canRetry) request.timeout = setTimeout(resend, 6000, request);
		t.socket.send(request.data);
	}
}

function resend(request) {
	t.queue.push(request);
	if (new Date().valueOf() < t.lastResponse + MAX_REQUEST_INTERVAL) {
		sendNext();
	} else {
		connect(sendNext);
	}
}

function defaultCallback() {
}

export function send(method, data, success, failure) {
	var index = nextIndex();
	var time = new Date().valueOf();
	var request = {
		data: JSON.stringify([index, method, data, time]),
		canRetry: true,
		success: success || defaultCallback,
		failure: failure || defaultCallback
	};
	t.requests[index] = request;
	t.queue.push(request);
	if (t.state === 'open') {
		sendNext();
	} else if (t.state === 'closed') {
		connect(sendNext);
	}
}

export function sendBinary(data) {
	var request = {data: data};
	t.queue.push(request);
	if (t.state === 'open') {
		sendNext();
	} else if (t.state === 'closed') {
		connect(sendNext);
	}
}
