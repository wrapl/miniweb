import * as TaskList from 'demo/TaskList';
import * as TaskListView from 'demo/TaskListView';
import { langs } from 'lang';
import { setLocale } from 'lib/L20n';
import { isoLangs } from 'ISOCodes';
import * as HPaned from 'ui/HPaned';
import * as VPaned from 'ui/VPaned';
import * as Frame from 'ui/Frame';
import * as Grid from 'ui/Grid';

export const T = _class(init, null, {
});

const changeLocale = propCall('locale', setLocale);

export function init(self, defaultView) {
	window.app = self;

	var taskList = new TaskList.T();
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

	let container = <HPaned.T>
		<VPaned.T>
			<TaskListView.T taskList={taskList}/>
			<Frame.T title="Task List" titleHeight={20}>
				<Grid.T>
					<TaskListView.T taskList={taskList} position={[0, 1, 0, 1]}/>
					<TaskListView.T taskList={taskList} position={[1, 1, 1, 1]}/>
					<TaskListView.T taskList={taskList} position={[0, 0, 0, 0]}/>
					<TaskListView.T taskList={taskList} position={[1, 0, 1, 0]}/>
				</Grid.T>
			</Frame.T>
			<TaskListView.T taskList={taskList}/>
		</VPaned.T>
		<TaskListView.T taskList={taskList}/>
		<TaskListView.T taskList={taskList}/>
	</HPaned.T>;

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
