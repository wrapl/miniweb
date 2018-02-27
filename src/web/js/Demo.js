import * as _TaskList from 'demo/TaskList';
import * as _TaskListView from 'demo/TaskListView';

export const T = _class(init, null, {
});

export function init(t, defaultView) {
	window.app = t;
	t.view = null;
	var element = t.element = document.body;
	var resizeTimeout;
	window.addEventListener("resize", event => {
		if (!resizeTimeout) resizeTimeout = setTimeout(() => {
			resizeTimeout = null
			var width = window.innerWidth, height = window.innerHeight
			app.emit("resize", width, height);
		}, 100);
	});

	var taskList = new _TaskList.T();
	var taskListView = new _TaskListView.T(taskList);

	t.element.appendChild(taskListView.element);
}

export function start(view) {
	var app = window.app = new T();
}
