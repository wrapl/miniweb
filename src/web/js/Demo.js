import * as _TaskList from 'demo/TaskList';
import * as _TaskListView from 'demo/TaskListView';
import { langs } from 'lang';
import { setLocale } from 'lib/L20n';
import { isoLangs } from 'ISOCodes';

export const T = _class(init, null, {
});

const changeLocale = propCall('locale', setLocale);

export function init(t, defaultView) {
	window.app = t;
	t.view = null;
	var element = t.element = document.body;
	var resizeTimeout;
	window.addEventListener("resize", event => {
		if (!resizeTimeout) resizeTimeout = setTimeout(() => {
			resizeTimeout = null;
			var width = window.innerWidth, height = window.innerHeight
			app.emit("resize", width, height);
		}, 100);
	});

	var taskList = new _TaskList.T();
	var taskListView = new _TaskListView.T(taskList);

	var langElements = langs.map(lang => {
		var iso = lang.split("_")[0]
		var country = lang.split("_")[1].toLowerCase()
		return <div prop-locale={lang} on-click={changeLocale}>
			<span className={"flag-icon flag-icon-" + country}/> {isoLangs[iso].nativeName}
		</div>
	});
	t.element.replaceChildren(
		<div>{langElements}</div>,
		taskListView.element
	);
}

export function start(view) {
	var app = window.app = new T();
}
