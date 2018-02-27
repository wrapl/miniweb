import * as _Class from "lib/Class";
import * as _L20n from "lib/L20n";
import * as _Widget from "ui/Widget";

function extendPrototype(_class, methods) {
	for (var method in methods) {
		Object.defineProperty(_class.prototype, method, {configurable: false, enumerable: false, value: methods[method]});
	}
}

extendPrototype(Object, {
	isEmpty: function() {
		for (var key in this) return false;
		return true;
	}
});

extendPrototype(Element, {
	remove: function() {
		if (this.parentNode) this.parentNode.removeChild(this);
	},

	removeAfterTransition: function() {
		var element = this;
		function remove() {
			element.removeEventListener("webkitTransitionEnd", remove);
			element.removeEventListener("transitionend", remove);
			element.remove();
		}
		element.addEventListener("webkitTransitionEnd", remove);
		element.addEventListener("transitionend", remove);
	},

	replace: function(other) {
		if (this.parentNode) this.parentNode.replaceChild(other, this);
		return other;
	},

	appendChildren: function() {
		Array.prototype.forEach.call(arguments, child => {
			if (!child) {
			} else if (child instanceof Array) {
				this.appendChildren.apply(this, child);
			} else if (child instanceof _Widget.T) {
				this.appendChild(child.element);
			} else if (typeof child === "string") {
				this.appendChild(document.createTextNode(child));
			} else {
				this.appendChild(child);
			}
		});
	},

	removeChildren: function() {
		var child;
		while ((child = this.firstChild)) this.removeChild(child);
	},

	replaceChildren: function() {
		this.removeChildren();
		this.appendChildren.apply(this, arguments);
	},

	prependChild: function(child) {
		return this.insertBefore(child, this.firstChild);
	},

	prependChildren: function() {
		Array.prototype.forEach.call(arguments, child => {
			if (!child) {
			} else if (child instanceof Array) {
				this.appendChildren.apply(this, child);
			} else if (child instanceof _Widget.T) {
				this.prependChild(child.element);
			} else if (typeof child === "string") {
				this.prependChild(document.createTextNode(child));
			} else {
				this.prependChild(child);
			}
		});
	},

	insertAfter: function(child, after) {
		return this.insertBefore(child, after.nextSibling);
	},

	addClass: function(_class) {
		this.classList.add(_class);
	},

	removeClass: function(_class) {
		this.classList.remove(_class);
	},

	toggleClass: function(_class) {
		this.classList.toggle(_class);
	},

	setProperty: function(name, value) {
		this['prop-' + name] = value;
	},

	findProperty: function(name) {
		var element = this;
		var property = 'prop-' + name;
		while (element && !(property in element)) element = element.parentNode;
		return element[property];
	},

	setText: function(text) {
		if (typeof text === 'function') {
			this.textContent = text(window.i18n);
			this.textContent.textFunc = text;
		} else {
			this.textContent = text;
		}
	}
});

extendPrototype(Text, {
	setText: function(text) {
		if (typeof text === 'function') {
			this.textContent = text(window.i18n);
			this.textContent.textFunc = text;
		} else {
			this.textContent = text;
		}
	}
});

if (!Array.prototype.findIndex) extendPrototype(Array, {
	findIndex: function(predicate) {
		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		for (var i = 0; i < length; i++) {
			var value = list[i];
			if (predicate.call(thisArg, value, i, list)) {
				return i;
			}
		}
		return -1;
	}
});

extendPrototype(Array, {
	pair: function(mapping) {
		var result = [];
		var list = Object(this);
		var length = list.length >>> 0;
		var thisArg = arguments[1];
		for (var i = 0; i < length; i++) {
			var value = list[i];
			result.push([value, mapping.call(thisArg, value, i, list)]);
		}
		return result;
	}
});

window._enum = function() {
	var properties = {};
	var value = 1;
	for (var i = 0; i < arguments.length; ++i) {
		properties[arguments[i]] = {writable: false, configurable: false, enumerable: true, value: value};
		value *= 2;
	}
	return Object.create(null, properties);
}

function readThrough(details, initial) {
	details = details || {};
	var f = new Function();
	f.prototype = details;
	details = new f();
	if (initial) for (var key in initial) details[key] = initial[key];
	return details;
}

function hashCode(str) {
	var hash = 0;
	for (var i = 0; i < str.length; i++) {
		char = str.charCodeAt(i);
		hash = char + (hash << 6) + (hash << 16) - hash;
	}
	return hash;
}

var captureTarget = [], releaseHandler = [];

function capturedMousedown(event) {
	var element = event.target;
	var target = captureTarget[0];
	while (element && element !== target) element = element.parentNode;
	if (!element) {
		event.stopPropagation();
		event.stopImmediatePropagation();
		event.preventDefault();
		releaseHandler[0](event);
	}
}

function capturedClick(event) {
	var element = event.target;
	var target = captureTarget[0];
	while (element && element !== target) element = element.parentNode;
	if (!element) {
		event.stopPropagation();
		event.stopImmediatePropagation();
		event.preventDefault(event);
	}
}

function captureMouse(target, handler) {
	if (!captureTarget.length) {
		document.addEventListener("mousedown", capturedMousedown, true);
		document.addEventListener("click", capturedClick, true);
	}
	captureTarget.unshift(target);
	releaseHandler.unshift(handler);
}

function releaseMouse() {
	captureTarget.shift();
	releaseHandler.shift();
	if (!captureTarget.length) {
		document.removeEventListener("click", capturedClick, true);
		document.removeEventListener("mousedown", capturedMousedown, true);
	}
}

function captureMouseMove(onmousemove, onmouseup) {
	var timeout = null;
	function capturedMousemove(mouseEvent) {
		mouseEvent.stopPropagation();
		mouseEvent.stopImmediatePropagation();
		mouseEvent.preventDefault();
		if (!timeout) timeout = setTimeout(function() {
			onmousemove(mouseEvent);
			timeout = null;
		});
	}
	function capturedMouseup(mouseEvent) {
		if (timeout) clearTimeout(timeout);
		mouseEvent.stopPropagation();
		mouseEvent.stopImmediatePropagation();
		mouseEvent.preventDefault();
		document.removeEventListener("mousemove", capturedMousemove, true);
		document.removeEventListener("mouseup", capturedMouseup, true);
		if (onmouseup) onmouseup(mouseEvent);
	}
	document.addEventListener("mousemove", capturedMousemove, true);
	document.addEventListener("mouseup", capturedMouseup, true);
}

function create(tag, attrs) {
	var children = Array.prototype.slice.call(arguments, 2);
	var element, key, params = [];
	if (typeof tag === 'string') {
		element = document.createElement(tag);
		for (var attr in attrs) {
			if (attr.startsWith("on-")) {
				element.addEventListener(attr.substring(3), attrs[attr]);
			} else if (attr.startsWith("prop-")) {
				element.setProperty(attr.substring(5), attrs[attr]);
			} else if (attr === "tr") {
				key = attrs[attr];
			} else if (attr.startsWith("tr-")) {
				params.push(attrs[attr]);
			} else {
				element[attr] = attrs[attr];
			}
		}
		if (key) {
			element.tr = [key, params];
			_L20n.translate(key, params, translation => element.appendChildren(translation));
		} else if (children.length) {
			element.appendChildren(children);
		}
	} else {
		element = tag(attrs, children);
	}
	return element;
}

function createTextNode(text) {
	return document.createTextNode(text.toString());
}

function dataURLtoBlob(url) {
	var parts = url.split(',');
	var type = parts[0].split(':')[1].split(';')[0];
	var byteString = atob(parts[1]);
	var byteStringLength = byteString.length;
	var intArray = new Uint8Array(byteStringLength);
	for (var i = 0; i < byteStringLength; ++i) intArray[i] = byteString.charCodeAt(i);
	return new Blob([intArray], {type: type});
}

function postRequest(url, data, success, failure, progress) {
	var request = new XMLHttpRequest();
	request.onload = function(event) {
		switch (this.status) {
		case 200: return success(JSON.parse(this.responseText));
		case 501:
		case 504: return failure(this.status, {});
		default: return failure(this.status, JSON.parse(this.responseText || "{}"));
		}
	}
	request.onerror = function(event) {
		console.debug(event);
		failure(-1);
	}
	if (progress) request.upload.onprogress = function(event) {
		progress(event.loaded, event.total);
	}
	request.open("POST", url, true);
	request.setRequestHeader("Content-Type", "application/json");
	request.send(JSON.stringify(data));
}

function getRequest(url, data, success, failure, progress) {
	var request = new XMLHttpRequest();
	request.onload = function(event) {
		switch (this.status) {
		case 200: return success(JSON.parse(this.responseText));
		case 501:
		case 504: return failure(this.status, {});
		default: return failure(this.status, JSON.parse(this.responseText || "{}"));
		}
	}
	request.onerror = function(event) {
		console.debug(event);
		failure(-1);
	}
	if (progress) request.upload.onprogress = function(event) {
		progress(event.loaded, event.total);
	}
	request.open("GET", url, true);
	request.setRequestHeader("Content-Type", "application/json");
	request.send();
}

function upload(data, success, failure, progress) {
	var request = new XMLHttpRequest();
	request.onload = function(event) {
		switch (this.status) {
		case 200: return success(this.responseText);
		case 501:
		case 504: return failure(this.status, {});
		default: return failure(this.status, JSON.parse(this.responseText || "{}"));
		}
	}
	request.onerror = function(event) {
		//failure(-1)
		setTimeout(upload, 5000, data, success, failure, progress);
	}
	if (progress) request.upload.onprogress = function(event) {
		progress(event.loaded, event.total);
	}
	request.open("POST", "upload", true);
	//request.setRequestHeader("Content-Type", data.type);
	request.overrideMimeType('text/plain; charset=x-user-defined-binary');
	request.send(data);
}

function requestWithPicture(details, method, data, success, failure) {
	if (details.hasOwnProperty('picture')) {
		upload(dataURLtoBlob(details.picture), picture => {
			data.picture = picture;
			request(method, data, success, failure);
		}, failure);
	} else {
		request(method, data, success, failure);
	}
}

function requestWithSpinner(view, method, data, success, failure) {
	view.showSpinner();
	request(method, data, result => {
		view.hideSpinner();
		success(result);
	}, error => {
		view.hideSpinner();
		failure(error);
	});
}

function requestSuccess() {}
function requestFailure(xhr, status) { console.log('ERROR: request', xhr, status) }

var subscriptions = {};
var subscriptionsHelper = {};

function subscribe(event, listener) {
	subscriptionsHelper.eventSystem = {events: subscriptions};
	var listeners = subscriptions[event];
	if (!listeners) listeners = subscriptions[event] = [];
	listener = Function.prototype.bind.apply(listener, [null].concat(Array.prototype.slice.call(arguments, 2)));
	listeners.unshift(listener);
	listener.object = subscriptionsHelper;
	listener.event = event;
	return listener;
}

function applyListener(listener) {
	return listener.apply(null, this);
}

function publish(event) {
	var listeners = subscriptions[event];
	if (listeners) {
		listeners.some(applyListener, Array.prototype.slice.call(arguments, 1));
	}
}

function publishEvents(events) {
	for (var i = 0; i < events.length; ++i) publish.apply(null, events[i]);
}

// For testing requests in the console
function qrequest(method, args) {
	request(method, args, function(result) {
		console.log(result);
	});
}

function propCall() {
	function inner(properties, callback, event) {
		var element = event.currentTarget;
		var values = properties.map(function(property) {
			while (element && !(property in element)) element = element.parentNode;
			return element[property];
		});
		event.stopPropagation();
		values.reverse().push(event);
		callback.apply(null, values);
	}
	var properties = Array.prototype.slice.call(arguments, 0, -1).map(name => "prop-" + name).reverse();
	var callback = arguments[arguments.length - 1];
	return inner.bind(null, properties, callback);
}

function parseQuery(query) {
	var result = {};
	query.split("&").forEach(pair => {
		pair = pair.split("=", 2);
		result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
	});
	return result;
}

window.captureMouse = captureMouse;
window.releaseMouse = releaseMouse;
window.create = create;
window.subscribe = subscribe;
window.publish = publish;
window.publishEvents = publishEvents;
window.getRequest = getRequest;
window.postRequest = postRequest;
window.qrequest = qrequest;
window.propCall = propCall;
window.upload = upload;
window.requestWithSpinner = requestWithSpinner;
window.parseQuery = parseQuery;
