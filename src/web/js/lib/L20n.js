var currentLocale = "en_IE";

window.tr = function(key, attrs) {
	var t = [key, attrs];
	var node = document.createTextNode("...");
	node.tr = t;
	require(["lang/" + currentLocale], function(lang) {
		var translation = lang[key] || key;
		if (typeof translation === "string") {
			node.textContent = translation;
		} else {
			var params = Object.keys(attrs).map(attr => attrs[attr]);
			var text = translation.apply(null, params);
			if (typeof text === "string") {
				node.textContent = text;
			} else {
				node.textContent = text.join("");
			}
		}
	});
	return node;
};

export function translate(key, params, callback) {
	require(["lang/" + currentLocale], function(lang) {
		var translation = lang[key] || key;
		if (typeof translation === "string") {
			callback(translation);
		} else {
			callback(translation.apply(null, params));
		}
	});
}

export function setLocale(locale) {
	currentLocale = locale;
	require(["lang/" + currentLocale], function(lang) {
		var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
		var node, t;
		while ((node = walker.nextNode())) {
			if ((t = node.tr)) {
				var translation = lang[t[0]] || t[0];
				if (typeof translation === "string") {
					node.textContent = translation;
				} else {
					var text = translation.apply(null, t[1]);
					if (typeof text === "string") {
						node.textContent = text;
					} else {
						node.textContent = text.join("");
					}
				}
			}
		}
		walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null, false);
		var nodes = [];
		while ((node = walker.nextNode())) if (node.tr) nodes.push(node);
		nodes.forEach(function(node) {
			var t = node.tr;
			var translation = lang[t[0]] || t[0];
			if (typeof translation === "string") {
				node.replaceChildren(translation);
			} else {
				node.replaceChildren(translation.apply(null, t[1]));
			}
		});
	});
}
