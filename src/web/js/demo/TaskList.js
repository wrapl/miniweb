export const T = _class(null, init, {
	createTask: createTask,
	removeTask: removeTask,
	cancelTask: cancelTask,
	completeTask: completeTask,
	renameTask: renameTask
});

var TaskT = _class(task_init);

function task_init(task, id, title) {
	task.id = id;
	task.title = title;
	task.state = "default";
}

function init(t) {
	t.tasks = {};
	t.lastTaskId = 0;
}

function createTask(t, title) {
	var task = new TaskT(++t.lastTaskId, title);
	t.tasks[task.id] = task;
	t.emit("task-created", task);
}

function removeTask(t, taskId) {
	var task = t.tasks[taskId];
	if (!task) throw "No such task";
	delete t.tasks[taskId];
	t.emit("task-removed", task);
}

function cancelTask(t, taskId) {
	var task = t.tasks[taskId];
	if (!task) throw "No such task";
	task.state = "cancelled";
	t.emit("task-changed", task);
}

function completeTask(t, taskId) {
	var task = t.tasks[taskId];
	if (!task) throw "No such task";
	task.state = "complete";
	t.emit("task-changed", task);
}

function renameTask(t, taskId, title) {
	var task = t.tasks[taskId];
	if (!task) throw "No such task";
	task.title = title;
	t.emit("task-changed", task);
}
