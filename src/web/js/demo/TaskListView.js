export const T = _class(init, null, {
	destroy: destroy
});

function init(t, taskList) {
	t.taskList = taskList;
	var taskViews = t.taskViews = {};
	var newTaskTitleInput = <input className="input" type="text" placeholder="New Task ..."/>;
	var tasksElement = t.tasksElement = <table className="table">
		<tr><th>Title</th><th>Actions</th></tr>
	</table>;

	function createTask() {
		var title = newTaskTitleInput.value;
		if (title.length > 0) t.taskList.createTask(title);
	}

	var element = t.element = <div prop-taskList={taskList} className="task-list">
		<div className="field has-addons">
			<div className="control">{newTaskTitleInput}</div>
			<div className="control">
				<a className="button is-info" on-click={createTask}><i className="fa fa-plus"/></a>
			</div>
		</div>
		<div>{tasksElement}</div>
	</div>;

	var renameTask = propCall("task", task => {

	});

	var removeTask = propCall("task", task => taskList.removeTask(task.id));

	var cancelTask = propCall("task", task => taskList.cancelTask(task.id));

	var completeTask = propCall("task", task => taskList.completeTask(task.id));

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
	});

	t.connections = [
		taskList.connect("task-removed", (taskList, task) => {
			var taskView = taskViews[task.id];
			if (!taskView) return;
			taskView.element.remove();
		}),
		taskList.connect("task-changed", (taskList, task) => {
			var taskView = taskViews[task.id];
			if (!taskView) return;
			if (task.state == "cancelled") {
				taskView.element.addClass("cancelled");
			} else {
				taskView.element.removeClass("cancelled");
			}
			if (task.state == "complete") {
				taskView.element.addClass("complete");
			} else {
				taskView.element.removeClass("complete");
			}
			taskView.titleElement.textContent = task.title;
		})
	];
}

function destroy(t) {
	t.disconnectArray(t.connections);
}