import * as _Widget from "ui/Widget";

export const T = _class(init, _Widget.T, {
	destroy: destroy
});

var renameTask = propCall("task", task => {
});
var removeTask = propCall("taskList", "task", (taskList, task) => taskList.removeTask(task.id));
var cancelTask = propCall("taskList", "task", (taskList, task) => taskList.cancelTask(task.id));
var completeTask = propCall("taskList", "task", (taskList, task) => taskList.completeTask(task.id));

var taskStates = {
	cancelled: "cancelled",
	complete: "complete"
};

function init(t, attrs) {
	let taskList = attrs.taskList;
	var taskViews = t.taskViews = {};
	var newTaskTitleInput = <input className="input" type="text" placeholder="New Task ..."/>;
	var tasksElement = t.tasksElement = <table className="table">
		<tr><th tr="TITLE"/><th tr="ACTIONS"/></tr>
	</table>;

	function createTask() {
		var title = newTaskTitleInput.value;
		if (title.length > 0) taskList.createTask(title);
	}

	_Widget.init(t, {}, <div prop-taskList={taskList} className="task-list">
		<div className="field has-addons">
			<div className="control">{newTaskTitleInput}</div>
			<div className="control">
				<a className="button is-info" on-click={createTask}><i className="fa fa-plus"/></a>
			</div>
		</div>
		<div>{tasksElement}</div>
	</div>);

	t.connectDisconnect("destroyed",
		taskList.connect("task-created", (taskList, task) => {
			var taskTitleElement = <span on-click={renameTask}>{task.title}</span>;
			var taskElement = <tr prop-task={task} className="task">
				<td className="task-title">{taskTitleElement}</td>
				<td>
					<a className="button is-danger" on-click={removeTask}><i className="fa fa-trash-alt"/></a>
					<a className="button is-warning" on-click={cancelTask}><i className="fa fa-times"/></a>
					<a className="button is-success" on-click={completeTask}><i className="fa fa-check"/></a>
				</td>
			</tr>;
			taskViews[task.id] = {titleElement: taskTitleElement, element: taskElement};
			tasksElement.appendChild(taskElement);
		}),
		taskList.connect("task-removed", (taskList, task) => {
			var taskView = taskViews[task.id];
			if (!taskView) return;
			taskView.element.remove();
		}),
		taskList.connect("task-changed", (taskList, task) => {
			var taskView = taskViews[task.id];
			if (!taskView) return;
			updateClass(null, task.state, null, taskView.element, taskStates);
			taskView.titleElement.textContent = task.title;
		})
	);
}

function destroy(t) {
	t.emit("destroyed");
}