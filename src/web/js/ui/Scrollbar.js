import * as Widget from "ui/Widget";
import * as Adjustment from "lib/Adjustment";

export var size = 8
var minLength = 20

export const T = _class(Widget.T, init)

function init(self, attrs) {
	widget.init(self, attrs)
	self.adjustment = attrs.adjustment || new Adjustment.T()
	self.inverted = !!attrs.inverted
	var element = self.element
	element.addClass("scrollbar")
	var trough = self.troughElement = <div/>;
	var thumb = self.thumbElement = <div/>;
	trough.appendChild(thumb)
	trough.addClass("scrollbar-trough")
	thumb.addClass("scrollbar-thumb")
	element.appendChild(trough)
}

//▲▶▼◀ ▴▸▾◂

export const HorizontalT = _class(T, horizontalInit, {
	resize: horizontalResize,
	computeSize: horizontalComputeSize,
	positionThumb: horizontalPositionThumb,
	drawThumb: horizontalDrawThumb
})

function horizontalPositionThumb(self) {
	var maxPosition = self.troughElement.clientWidth - self.thumbElement.offsetWidth
	var position = maxPosition * (self.adjustment.Value - self.adjustment.min) / self.adjustment.range
	self.thumbElement.style.left = position + "px"
}

function horizontalDrawThumb(self) {
	self.thumbElement.style.width = ((self.troughElement.clientWidth * self.adjustment.Page / self.adjustment.range < minLength) ? minLength : self.troughElement.clientWidth * self.adjustment.Page / self.adjustment.range) + 'px'
	var maxPosition = self.troughElement.clientWidth - self.thumbElement.offsetWidth
	var position = maxPosition * (self.adjustment.Value - self.adjustment.min) / self.adjustment.range
	self.thumbElement.style.left = position + "px"
}

function horizontalInit(self, attrs) {
	init(self, attrs)
	self.element.addClass("scrollbar-horizontal")
	var trough = self.troughElement
	var thumb = self.thumbElement
	thumb.onmousedown = event => {
		var start = thumb.offsetLeft - event.clientX
		var maxPosition = trough.clientWidth - thumb.offsetWidth
		captureMouseMove(event => {
			adjustment.setValue(adjustment.min + adjustment.range * (start + event.clientX) / maxPosition)
		})
		return false
	}
	self.adjustment.connect("value-changed", () => horizontalDrawThumb(self) )
	self.adjustment.connect("changed", () => horizontalDrawThumb(self) )
}

function horizontalResize(self, width, height) {
	horizontalDrawThumb(self)
}

function horizontalComputeSize(self) {	
	return {"height": [size]}
}

export const VerticalT = _class(T, verticalInit, {
	resize: verticalResize,
	computeSize: verticalComputeSize,
	positionThumb: verticalPositionThumb,
	drawThumb: verticalDrawThumb
})

function verticalPositionThumb(self) {
	var maxPosition = self.troughElement.clientHeight - self.thumbElement.offsetHeight
	var diff = self.inverted ? self.adjustment.max - self.adjustment.Value : self.adjustment.Value - self.adjustment.min
	var position = maxPosition * diff / self.adjustment.range
	self.thumbElement.style.top = position + "px"
}

function verticalDrawThumb(self) {
	self.thumbElement.style.height = ((self.troughElement.clientHeight * self.adjustment.Page / self.adjustment.range < minLength) ? minLength : self.troughElement.clientHeight * self.adjustment.Page / self.adjustment.range) + 'px'
	var maxPosition = self.troughElement.clientHeight - self.thumbElement.offsetHeight
	var diff = self.inverted ? self.adjustment.max - self.adjustment.Value : self.adjustment.Value - self.adjustment.min
	var position = maxPosition * diff / self.adjustment.range
	self.thumbElement.style.top = position + "px"
}

function verticalInit(self, attrs) {
	init(self, attrs)
	self.element.addClass("scrollbar-vertical")
	var trough = self.troughElement
	var thumb = self.thumbElement
	thumb.onmousedown = event => {
		var start = thumb.offsetTop - event.clientY
		var maxPosition = trough.clientHeight - thumb.offsetHeight
		if (self.inverted) {
			captureMouseMove(event => {
				adjustment.setValue(adjustment.max - adjustment.range * (start + event.clientY) / maxPosition)
			})
		} else {
			captureMouseMove(event => {
				adjustment.setValue(adjustment.min + adjustment.range * (start + event.clientY) / maxPosition)
			})
		}
		return false
	}
	self.adjustment.connect("value-changed", () => verticalDrawThumb(self))
	self.adjustment.connect("change", () => verticalDrawThumb(self))
}

function verticalResize(self, width, height) {
	verticalDrawThumb(self)
}

function verticalComputeSize(self) {
	return {"width": [size]}
}
