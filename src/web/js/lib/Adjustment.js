export const T = _class(null, init, {
	showValue: showValue,
	setRange: setRange,
	setValue: setValue,
	setPage: setPage,
	setWindow: setWindow,
	showValue: showValue,
	inc: inc
})

export function init(self, min, max, page, stepInc, pageInc) {
	self.min = min || 0
	self.max = max || self.min + 1
	self.range = self.max - self.min
	self.value = self.min
	self.page = page || self.range
	self.stepInc = stepInc || 1
	self.pageInc = pageInc || page
	self.minValue = self.min + (self.value - self.min) * (self.range - self.page) / self.range
	self.maxValue = self.minValue + self.page
	
	self.connectProperty("min", adjustRange)
	self.connectProperty("max", adjustRange)
}

function adjustRange(self) {
	self.range = self.max - self.min
	self.emit('changed')
	setValue(self, self.value)
}

export function setRange(self, min, max) {
	self.min = min
	self.max = max
	self.range = max - min
	self.emit('changed')
	setValue(self, self.value)
}

export function setValue(self, value) {
	var value = Math.min(Math.max(value, self.min), self.max)
	self.minValue = self.min + (value - self.min) * (self.range - self.page) / self.range
	self.maxValue = self.minValue + self.page
	self.value = value
	self.emit('value-changed')
}

export function setPage(self, page) {
	self.page = Math.min(page, self.range)
	self.emit('changed')
	setValue(self, self.value)
}

function setWindow(self, minValue, maxValue) {
	minValue = Math.min(Math.max(minValue, self.min), self.max)
	maxValue = Math.min(Math.max(maxValue, self.min), self.max)
	if (minValue > maxValue) return
	self.minValue = minValue
	self.maxValue = maxValue
	var page = self.page = maxValue - minValue
	if (page === self.range) {
		self.value = self.min
	} else {
		self.value = self.range * (minValue - self.min) / (self.range - page) + self.min
	}
	self.emit('changed')
	//self.emit('value-changed')
}

export function showValue(self, value, align) {
	if (align == null) {
		if (value < self.minValue || value > self.maxValue) {
			setValue(self, value)
			return true
		}
	} else {
		value = Math.min(self.max, Math.max(self.min, value))
		if (value < self.minValue) {
			var left = value - self.page * align
			setValue(self, (left * self.range - self.min * self.page) / (self.range - self.page))
			return true
		} else if (value > self.maxValue) {
			var left = value - self.page * (1 - align)
			setValue(self, (left * self.range - self.min * self.page) / (self.range - self.page))
			return true
		}
	}
	return false
}

export function inc(self, delta) {
	setValue(self, self.value + delta)
}

export function inc_step(self, Multiplyer) {
	multiplier = multiplier || 1
	inc(self, self.stepInc * multiplier)
}

export function inc_page(self, multiplier) {
	multiplier = multiplier || 1
	inc(self, self.pageInc * multiplier)
}
