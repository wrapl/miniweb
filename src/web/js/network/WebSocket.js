import {RangeSet} from "lib/RangeSet";

var nextIndex = function() {
	var index = 0;
	return () => ++index;
}();

var NotSupportedError = "Websockets are not supported on this browser";

var T = _class(null, init);

function init(conn, transport) {
	conn.queue = [];
	conn.requests = {};
	conn.socket = null;
	conn.state = 'closed';
	conn.error = null;
	conn.reconnecting = 3;
	conn.times = [];
	conn.lastResponse = new Date().valueOf();
	conn.whenPropertyIs('state', 'open', sendNext);
}

var DEFAULT_PORTS = {
	http: 80,
	https: 443,
	ws: 80,
	wss: 443
};

var MAX_REQUEST_INTERVAL = 60000;

var conn;

function clearResponses() {
	var request = {data: JSON.stringify([0, conn.responses.toString()])};
	delete conn.responses;
	conn.queue.push(request);
	if (conn.state === 'open') {
		sendNext();
	} else if (conn.state === 'closed') {
		connect(sendNext);
	}
}

function onSocketMessage(event) {
	var message = JSON.parse(event.data);
	conn.lastResponse = new Date().valueOf();
	var index = message[0];
	switch (index) {
	case 'reload':
		location.reload();
		return;
	case 'alert':
		send('alert/read', {}, publishEvents);
		return;
	default: {
		if (conn.responses) {
			conn.responses.add(index);
		} else {
			conn.responses = new RangeSet.T();
			conn.responses.add(index);
			setTimeout(clearResponses, 10000);
		}
		var success = message[1];
		var response = message[2];
		var request = conn.requests[index];
		if (request) {
			clearTimeout(request.timeout);
			delete conn.requests[index];
			var times = conn.times;
			times.push(new Date().valueOf() - request.time);
			/*if (times.length > 50) {
				conn.times = [];
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
	conn = conn || new T();
	switch (conn.state) {
	case 'connecting': return;
	case 'open': conn.socket.close();
	}
	conn.state = 'connecting';
	var webSocketProtocol = window.location.protocol == "https:" ? "wss:" : "ws:";
	var url = location.hostname;
	if (location.port && location.port != DEFAULT_PORTS[location.protocol]) url += ":" + location.port;
	url += location.pathname;
	var to = url.lastIndexOf('/');
	to = to == -1 ? url.length : to;
	url = url.substring(0, to);
	var address = webSocketProtocol + "//" + url + '/socket';
	console.debug('connecting to ' + address);
	var socket = app.socket = conn.socket = new WebSocket(address);
	socket.onopen = function(event) {
		console.debug('websocket onopen', event);
		conn.error = null;
		conn.lastResponse = new Date().valueOf();
		conn.state = 'open';
		sendNext();
	};
	socket.onmessage = onSocketMessage;
	socket.onclose = function(event) {
		if (conn.socket !== socket) return;
		conn.state = 'closed';
		console.debug('websocket onclose', event);
	};
	socket.onerror = function(event) {
		if (conn.socket !== socket) return;
		console.error('websocket onerror', event);
		socket.close();
	};
	if (success) conn.whenPropertyIs('state', 'open', success);
	if (failure) conn.whenPropertyIs('state', 'closed', failure);
}

function sendNext() {
	while (conn.state === 'open') {
		var request = conn.queue.pop();
		if (!request) return;
		if (request.canRetry) request.timeout = setTimeout(resend, 6000, request);
		conn.socket.send(request.data);
	}
}

function resend(request) {
	conn.queue.push(request);
	if (new Date().valueOf() < conn.lastResponse + MAX_REQUEST_INTERVAL) {
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
	conn.requests[index] = request;
	conn.queue.push(request);
	if (conn.state === 'open') {
		sendNext();
	} else if (conn.state === 'closed') {
		connect(sendNext);
	}
}

export function sendBinary(data) {
	var request = {data: data};
	conn.queue.push(request);
	if (conn.state === 'open') {
		sendNext();
	} else if (conn.state === 'closed') {
		connect(sendNext);
	}
}
