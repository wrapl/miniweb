import * as _TaskList from 'demo/TaskList';
import * as _TaskListView from 'demo/TaskListView';
import { langs } from 'lang';
import { setLocale } from 'lib/L20n';
import { isoLangs } from 'ISOCodes';
import * as _Container from 'ui/Container';
import * as _HPaned from 'ui/HPaned';
import * as _VPaned from 'ui/VPaned';
import * as _Frame from 'ui/Frame';

export const T = _class(init, null, {
});

const changeLocale = propCall('locale', setLocale);

export function init(t, defaultView) {
	window.app = t;

	var taskList = new _TaskList.T();
	var langElements = langs.map(lang => {
		var iso = lang.split("_")[0]
		var country = lang.split("_")[1].toLowerCase()
		return <div prop-locale={lang} on-click={changeLocale}>
			<span className={"flag-icon flag-icon-" + country}/> {isoLangs[iso].nativeName}
		</div>
	});
	/*element.replaceChildren(
		<div>{langElements}</div>
	);*/

	let container = <_HPaned.T>
		<_VPaned.T>
			<_TaskListView.T taskList={taskList}/>
			<_Frame.T title="Task List" titleHeight={20}>
				<_TaskListView.T taskList={taskList}/>
			</_Frame.T>
			<_TaskListView.T taskList={taskList}/>
		</_VPaned.T>
		<_TaskListView.T taskList={taskList}/>
		<_TaskListView.T taskList={taskList}/>
	</_HPaned.T>;

	document.body.replaceChildren(container.element);
	container.position(0, 0, window.innerWidth, window.innerHeight);
	var resizeTimeout;
	window.addEventListener("resize", event => {
		if (!resizeTimeout) resizeTimeout = setTimeout(() => {
			resizeTimeout = null;
			container.position(0, 0, window.innerWidth, window.innerHeight);
		}, 100);
	});

	
}

export function start(view) {
	var app = window.app = new T();
}
