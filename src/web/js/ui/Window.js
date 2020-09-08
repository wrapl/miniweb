export const T = _class(null, init, {
	addChild: addChild,
	show: show,
	hide: hide,
	close: close
});

function init(self, attrs) {
	self.width = attrs.width || 600;
	self.height = attrs.height || 400;
	self.x = attrs.x || (window.innerWidth - self.width) / 2;
	self.y = attrs.y || (window.innerHeight - self.height) / 2;
	let element = self.element = <div className="window">
		{self.title = <div className="title" on-mousedown={startMove}>
			{attrs.title}
			<div className="buttons">
				<i className="fa fa-window-close" on-click={() => self.emit("closed")}/>
			</div>
		</div>}
		<span className="resizer" on-mousedown={startResize}/>
	</div>;
	let style = element.style;
	style.left = self.x + "px";
	style.top = self.y + "px";
	style.width = self.width + "px";
	style.height = self.height + "px";

	function startMove(event) {
		app.widget.element.appendChild(self.element);
		var startX = self.x - event.clientX;
		var startY = self.y - event.clientY;
		captureMouseMove(event => {
			self.x = startX + event.clientX;
			self.y = startY + event.clientY;
			style.left = self.x + "px";
			style.top = self.y + "px";
		});
	}

	function startResize(event) {
		var startWidth = self.width - event.clientX;
		var startHeight = self.height - event.clientY;
		captureMouseMove(event => {
			self.width = startWidth + event.clientX;
			self.height = startHeight + event.clientY;
			style.width = self.width + "px";
			style.height = self.height + "px";
			resize(self);
		}, event => resize(self));
	}
}

function addChild(self, child) {
	self.child = child;
	self.element.appendChild(child.element);
	child.parent = self;
}

function resize(self) {
	let titleHeight = self.title.offsetHeight;
	self.child.position(0, titleHeight, self.width, self.height - titleHeight);
}

function show(self) {
	app.widget.element.appendChild(self.element);
	setTimeout(() => resize(self));
}

function hide(self) {
	self.element.remove();
}

function close(self) {
	self.element.remove();
}
