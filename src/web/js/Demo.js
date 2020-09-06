import * as App from 'App';
import * as TaskList from 'demo/TaskList';
import * as TaskListView from 'demo/TaskListView';
import { langs } from 'lang';
import { isoLangs } from 'ISOCodes';
import * as HPaned from 'ui/HPaned';
import * as VPaned from 'ui/VPaned';
import * as Frame from 'ui/Frame';
import * as Grid from 'ui/Grid';
import * as Toolbar from 'ui/Toolbar';
import * as Tabbed from 'ui/Tabbed';

export const T = _class(App.T, init);

function localeChanged(item, child) {
	app.setLocale(child.value);
	item.label.replaceChildren(child.label.cloneNode(true));
}

export function init(self) {
	var taskList = new TaskList.T();

	let tab1 = <Frame.T title="Task List 1" titleHeight={20}>
		<TaskListView.T taskList={taskList}/>
	</Frame.T>;
	let tab2 = <Frame.T title="Task List 2" titleHeight={20}>
		<TaskListView.T taskList={taskList}/>
	</Frame.T>;
	let tab3 = <Frame.T title="Task List 3" titleHeight={20}>
		<VPaned.T>
			<TaskListView.T taskList={taskList}/>
			<TaskListView.T taskList={taskList}/>
		</VPaned.T>
	</Frame.T>;
	let tabbed = <Tabbed.T>{tab1}{tab2}{tab3}</Tabbed.T>;

	App.init(self, <Grid.T>
		<Toolbar.T position={[0, 0, 0, 0]}>
			<Toolbar.LabelT>Button:</Toolbar.LabelT>
			<Toolbar.ButtonT icon="fa fa-file" on-clicked={() => console.log("Clicked!")}>Click Me!</Toolbar.ButtonT>
			<Toolbar.ComboboxT on-changed={localeChanged}>
				Select Locale
				{langs.map(lang => {
					var iso = lang.split("_")[0]
					var country = lang.split("_")[1].toLowerCase()
					return <Toolbar.ComboboxChildT value={lang}>
						<span className={"flag-icon flag-icon-" + country}/> {isoLangs[iso].nativeName}
					</Toolbar.ComboboxChildT>;
				})}
			</Toolbar.ComboboxT>
			<Toolbar.ComboboxT on-changed={tabChanged}>
				Select Tab
				<Toolbar.ComboboxChildT value={tab1}>Tab 1</Toolbar.ComboboxChildT>
				<Toolbar.ComboboxChildT value={tab2}>Tab 2</Toolbar.ComboboxChildT>
				<Toolbar.ComboboxChildT value={tab3}>Tab 3</Toolbar.ComboboxChildT>
			</Toolbar.ComboboxT>
		</Toolbar.T>
		<HPaned.T position={[0, 1, 0, 1]}>
			<TaskListView.T taskList={taskList}/>
			{tabbed}
		</HPaned.T>
	</Grid.T>);

	function tabChanged(item, child) {
		tabbed.showChild(child.value);
		item.label.replaceChildren(child.label.cloneNode(true));
	}
}
