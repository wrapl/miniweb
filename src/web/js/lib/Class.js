function _class(parent, constructor, methods) {
	function _classMethod(methods, method) {
		var actual = methods[method];
		return function() {
			return actual.apply(null, [this].concat(Array.prototype.slice.call(arguments)));
		}
	}
	var base = parent ? parent.prototype : Base.prototype;
	var properties = {_parent: {value: base, writable: false, enumerable: false}};
	constructor = constructor || (parent ? parent.constructor : function() {});
	function Class() { constructor.apply(null, [this].concat(Array.prototype.slice.call(arguments))); };
	if (methods) for (var method in methods) {
		properties[method] = {value: Class[method] = _classMethod(methods, method), writable: true, enumerable: false};
	}
	Class.init = constructor;
	Class.prototype = Object.create(base, properties);
	Class.constructor = constructor;
	return Class;
}

window._class = _class;

const Base = _class(Object, baseInit, {
	connect: baseConnect,
	connectBefore: baseConnectBefore,
	disconnectAll: baseDisconnectAll,
	connectDisconnect: baseConnectDisconnect,
	connectOnce: baseConnectOnce,
	emit: baseEmit,
	connectProperty: baseConnectProperty,
	emitProperty: baseEmitProperty,
	connectPropertyOnce: baseConnectPropertyOnce,
	whenPropertySatisfies: baseWhenPropertySatisfies,
	whenPropertyIs: baseWhenPropertyIs,
	whenPropertyIsNot: baseWhenPropertyIsNot,
	whenPropertyIsNull: baseWhenPropertyIsNull,
	whenPropertyIsNotNull: baseWhenPropertyIsNotNull,
	whenPropertyAndMask: baseWhenPropertyAndMask,
	whenPropertyNotAndMask: baseWhenPropertyNotAndMask
});

function baseInit(base) {
}

function baseConnect(base, event, callback) {
	if (!base.eventSystem) {
		Object.defineProperty(base, "eventSystem", {
			configurable: true,
			enumerable: false,
			value: {events: {}}
		});
	}
	var events = base.eventSystem.events;
	var connectionList = events[event] || [];
	var connection = new EventConnectionT(base, callback, event, Array.prototype.slice.call(arguments, 3));
	connectionList.push(connection);
	events[event] = connectionList;
	return connection;
}

function baseConnectBefore(base, event, callback) {
	if (!base.eventSystem) {
		Object.defineProperty(base, "eventSystem", {
			configurable: true,
			enumerable: false,
			value: {events: {}}
		});
	}
	var events = base.eventSystem.events;
	var connectionList = events[event] || [];
	var connection = new EventConnectionT(base, callback, event, Array.prototype.slice.call(arguments, 3));
	connectionList.unshift(connection);
	events[event] = connectionList;
	return connection;
}

function baseDisconnectAll(base, event) {
	if (!base.eventSystem) return;
	delete base.eventSystem[event];
	if (!base.eventSystem.events.isEmpty()) return;
	delete base.eventSystem;
}

function baseConnectDisconnect(base, event) {
	if (!base.eventSystem) {
		Object.defineProperty(base, "eventSystem", {
			configurable: true,
			enumerable: false,
			value: {events: {}}
		});
	}
	var events = base.eventSystem.events;
	var connectionList = events[event] || [];
	var connection;
	for (var i = 0; i < connectionList.length; ++i) {
		connection = connectionList[i];
		if (connection.once && connection.callback === disconnectArray) {
			Array.prototype.push.apply(connection.args[0], Array.prototype.slice.call(arguments, 2));
			return connection;
		}
	}
	connection = new EventConnectionT(base, disconnectArray, event, [Array.prototype.slice.call(arguments, 2)]).setOnce();
	connectionList.push(connection);
	events[event] = connectionList;
	return connection;
}

function baseConnectOnce(base, event, callback) {
	return base.connect.apply(base, arguments).setOnce();
}

function baseEmit(base, event) {
	if (!base.eventSystem) return;
	var connectionList = base.eventSystem.events[event];
	if (!connectionList) return;
	var i = 0, connection;
	while ((connection = connectionList[i])) {
		if (connection.block) continue;
		var callback = connection.callback;
		var stop = callback.apply(callback, connection.args.concat([base], Array.prototype.slice.call(arguments, 2)));
		if (connection.once) eventConnectionDisconnect(connection);
		if (stop) return true;
		if (connectionList[i] === connection) ++i;
	}
	return false;
}

function baseConnectProperty(base, property, callback) {
	if (!base.propertySystem) {
		Object.defineProperty(base, 'propertySystem', {
			configurable: true,
			enumerable: false,
			value: {
				connections: {},
				properties: {}
			}
		});
	}
	var connections = base.propertySystem.connections;
	var properties = base.propertySystem.properties;
	if (!properties.hasOwnProperty(property)) {
		properties[property] = base[property];
	}
	Object.defineProperty(base, property, {
		configurable: true,
		enumerable: true,
		get: function() { return this.propertySystem.properties[property] },
		set: function(newValue) {
			var properties = this.propertySystem.properties;
			var oldValue = properties[property];
			if (oldValue == newValue) return;
			properties[property] = newValue;
			this.emitProperty(property, newValue, oldValue);
		}
	});
	var connection = new PropertyConnectionT(base, callback, property, Array.prototype.slice.call(arguments, 3));
	var connectionList = connections[property] || [];
	connectionList.push(connection);
	connections[property] = connectionList;
	return connection;
}

function baseEmitProperty(base, property) {
	if (!base.propertySystem) return false;
	var connectionList = base.propertySystem.connections[property];
	if (!connectionList) return false;
	var length = connectionList.length;
	var i = 0, connection;
	while ((connection = connectionList[i])) {
		var callback = connection.callback;
		var value = base[property];
		if (!connection.hasOwnProperty('compFunc') || connection.compFunc(value)) {
			var stop = callback.apply(callback, connection.args.concat([base], Array.prototype.slice.call(arguments, 2)));
			if (connection.once) propertyConnectionDisconnect(connection);
			if (stop) return true;
		}
		if (connection == connectionList[i]) ++i;
	}
	return false;
}

function baseConnectPropertyOnce(base, property, callback) {
	return baseConnectProperty.apply(base, arguments).setOnce();
}

function baseWhenPropertyDefined(base, property, callback) {
	if (base.hasOwnProperty(property) && base[property] !== undefined) {
		callback.apply(callback, [base].concat(Array.prototype.slice.call(arguments, 3)).concat([base[property]]));
		return;
	}
	return baseConnectPropertyOnce.apply(base, arguments);
}

function baseWhenPropertySatisfies(base, property, compFunc, callback) {
	if (compFunc(base[property])) {
		callback.apply(callback, [base].concat(Array.prototype.slice.call(arguments, 4)).concat([base[property]]));
		return;
	}
	var args = [base, property, callback].concat(Array.prototype.slice.call(arguments, 4));
	var connection = baseConnectPropertyOnce.apply(base, args);
	connection.compFunc = compFunc;
	return connection;
}

function baseWhenPropertyIs(base, property, value, callback) {
	return baseWhenPropertySatisfies(base, property, x => x === value, callback);
}

function baseWhenPropertyIsNot(base, property, value, callback) {
	return baseWhenPropertySatisfies(base, property, x => x !== value, callback);
}

function baseWhenPropertyIsNull(base, property, callback) {
	return baseWhenPropertyIs(base, property, null, callback);
}

function baseWhenPropertyIsNotNull(base, property, callback) {
	return baseWhenPropertyIsNot(base, property, null, callback);
}

function baseWhenPropertyAndMask(base, property, mask, callback) {
	return baseWhenPropertySatisfies(base, property, x => x & mask, callback);
}

function baseWhenPropertyNotAndMask(base, property, mask, callback) {
	return baseWhenPropertySatisfies(base, property, x => !(x & mask), callback);
}

function disconnectArray(connections) {
	connections.forEach(connection => connection.disconnect());
}

const ConnectionT = _class(null, connectionInit, {
	setOnce: connectionSetOnce
});

function connectionInit(connection) {
}

function connectionSetOnce(connection) {
	connection.once = true;
	return connection;
}

const EventConnectionT = _class(ConnectionT, eventConnectionInit, {
	disconnect: eventConnectionDisconnect
});

function eventConnectionInit(connection, object, callback, event, args) {
	connection.object = object;
	connection.callback = callback;
	connection.event = event;
	connection.args = args;
}

function eventConnectionDisconnect(connection) {
	var object = connection.object;
	var eventList = object.eventSystem.events[connection.event];
	if (!eventList) return;
	eventList.splice(eventList.indexOf(connection), 1);
	if (eventList.length > 0) return;
	delete object.eventSystem.events[connection.event];
	if (!object.eventSystem.events.isEmpty()) return;
	delete object.eventSystem;
}

const PropertyConnectionT = _class(ConnectionT, propertyConnectionInit, {
	disconnect: propertyConnectionDisconnect
});

function propertyConnectionInit(connection, object, callback, property, args) {
	connection.object = object;
	connection.callback = callback;
	connection.property = property;
	connection.args = args;
}

function propertyConnectionDisconnect(connection) {
	var object = connection.object;
	var connectionList = object.propertySystem.connections[connection.property];
	if (!connectionList) return;
	connectionList.splice(connectionList.indexOf(connection), 1);
	if (connectionList.length > 0) return;
	delete object[connection.property];
	object[connection.property] = object.propertySystem.properties[connection.property];
	delete object.propertySystem.connections[connection.property];
	delete object.propertySystem.properties[connection.property];
	if (Object.keys(object.propertySystem.connections).length > 0) return;
	delete object.propertySystem;
}

const IntervalConnectionT = _class(ConnectionT, intervalConnectionInit, {
	disconnect: intervalConnectionDisconnect
});

function intervalConnectionInit(connection, args) {
	connection.interval = setInterval.apply(null, args);
}

function intervalConnectionDisconnect(connection) {
	clearInterval(connection.interval);
}

window.connectInterval = function(callback, interval) {
	return new IntervalConnectionT(arguments);
}
