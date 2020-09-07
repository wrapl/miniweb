export function alert(text, type) {
	type = type || "error";
	var dismiss = <span className="dismiss"><i className="fa fa-times"/></span>;
	var alert = <div className={"plastic alert " + type}>{text}{dismiss}	</div>;
	dismiss.onclick = () => alert.remove();
	return alert;
}

export const T = _class(null, init, {
	run: run
});

function init(self, title, body, actions) {
	self.close = () => {
		releaseMouse();
		self.element.remove();
	};
	let buttons = [];
	for (var name in actions) {
		let callback = actions[name] || self.close;
		let button = <span className="plastic button">{name}</span>;
		button.onclick = event => {
			event.stopPropagation();
			event.preventDefault();
			callback(self);
		}
		if (callback === self.close) button.addClass("subdue");
		buttons.push(button);
	}
	self.element = <div className="popup-dialog-screen">
		<div className="popup-dialog-centre">
			<div className="popup-dialog">
				<div className="popup-dialog-title">{title}</div>
				<div className="popup-dialog-body">{body}</div>
				<div className="plast button-box">{buttons}</div>
			</div>
		</div>
	</div>;
	return self;
}

function run(self) {
	app.widget.element.appendChild(self.element);
	captureMouse(self.element, () => {});
}
