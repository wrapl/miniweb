import "lib/Class";

export const T = _class(null, init, {
	update: update,
	insert: insert,
	append: append,
	prepend: prepend,
	remove: remove,
	value: value,
	values: values
});

function init(self) {
	self.values_ = [];
}

function update(self, index, value) {
	let old = self.values_[index];
	self.values_[index] = value;
	self.emit("updated", index, value, old);
}

function insert(self, index, value) {
	self.values_.splice(index, 0, value);
	self.emit("inserted", index, value);
}

function append(self, value) {
	insert(self, self.values_.length, value);
}

function prepend(self, value) {
	insert(self, 0, value);
}

function remove(self, index) {
	let old = self.values_.splice(index, 1)[0];
	self.emit("removed", index, old);
}

function value(self, index) {
	return self.values_[index];
}

function values(self) {
	return self.values_;
}