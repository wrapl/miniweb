var SourceWidgets = []
var DestWidgets = []
var CurrentWidget = null

export const TARGET_SAME_WIDGET = 1
export const TARGET_OTHER_WIDGET = 2

var drag_context_t = _class(null, drag_context_init)

function drag_context_init(DragContext) {
	DragContext.Timestamp = (new Date()).getTime()
	DragContext.SourceWidget = null
	DragContext.X = null
	DragContext.Y = null
	DragContext.Types = {}
	DragContext.Cache = {}
}

function add_event_listener(Element, EventName, Func, UseCapture) {
	Element.addEventListener(EventName, Func, UseCapture)
	return {
		disconnect: function() {
			Element.removeEventListener(EventName, Func, UseCapture)
		}
	}
}

var find_widget = function(Widgets, X, Y) {
	var Widget = null
	for (var I = 0; I < Widgets.length; I++) {
		var AWidget = Widgets[I]
		var Rect = AWidget.HtmlElement.getBoundingClientRect()
		if (X >= Rect.left && X <= Rect.right && Y >= Rect.top && Y <= Rect.bottom) {
			if (!Widget || Widget.HtmlElement.contains(AWidget.HtmlElement)) Widget = AWidget
		}
	}
	return Widget
}

var DragStartDist = 4

document.addEventListener('mousedown', function(DownEvent) {
	if (DownEvent.which != 1) return
	var SourceWidget = CurrentWidget
	if (!SourceWidget || SourceWidgets.indexOf(SourceWidget) == -1) return

	var X, Y
	var Count = 0
	var InitMoveHandler = add_event_listener(document, 'mousemove', function(InitMoveEvent) {
		if (Count++ < DragStartDist) return
		InitMoveHandler.disconnect()
		InitUpHandler.disconnect()
		
		var Context = new drag_context_t()
		Context.StartX = X
		Context.StartY = Y
		Context.Types = SourceWidget._DragSourceTypes
		Context.SourceWidget = SourceWidget
		Context.StartMouseEvent = InitMoveEvent
		var StopDrag = emit(SourceWidget, 'drag-begin', Context, X, Y, DownEvent)

		if (StopDrag) return
		Context.State = 'Drag'
		var Widget = null
		var SameTypes = {}
		var OtherTypes = {}
		for (var Type in SourceWidget._DragSourceTypes) {
			if (SourceWidget._DragSourceTypes[Type] & TARGET_SAME_WIDGET) SameTypes[Type] = true
		}
		for (var Type in SourceWidget._DragSourceTypes) {
			if (SourceWidget._DragSourceTypes[Type] & TARGET_OTHER_WIDGET) OtherTypes[Type] = true
		}
		var DroppableWidget = false
		if (SourceWidget._DragDestTypes) for (var Type in SourceWidget._DragDestTypes) {
			if (SameTypes[SourceWidget._DragDestTypes[Type]]) {
				DroppableWidget = true
				break
			}
		}
		var PrevTargetElement, PrevTargetElementCursor
		var MoveHandler = add_event_listener(document, 'mousemove', function(MoveEvent) {
			X = MoveEvent.pageX
			Y = MoveEvent.pageY
			if (MoveEvent.target != PrevTargetElement) {
				if (PrevTargetElement) {
					PrevTargetElement.style.cursor = PrevTargetElementCursor
				}
				if (MoveEvent.target) {
					PrevTargetElement = MoveEvent.target
					PrevTargetElementCursor = PrevTargetElement.style.cursor
					PrevTargetElement.style.cursor = 'move'
				}
			}
			
			if (Widget != CurrentWidget) {
				if (Widget && (DroppableWidget || SourceWidget == Widget)) {
					emit(Widget, 'drag-leave', Context, X, Y, MoveEvent)
					Widget.HtmlElement.classList.add('drag-motion')
				}
				DroppableWidget = false
				Widget = CurrentWidget
				if (Widget && Widget._DragDestTypes) {
					var SourceTypes = SourceWidget == Widget ? SameTypes : OtherTypes
					for (var Type in SourceTypes) {
						if (Widget._DragDestTypes[Type]) {
							DroppableWidget = true
							break
						}
					}
				}
				if (DroppableWidget || SourceWidget == Widget) {
					//emit(CurrentWidget, 'drag-enter', Context, X, Y)
					CurrentWidget.HtmlElement.classList.remove('drag-motion')
				}
			}
			if (Widget && (DroppableWidget || SourceWidget == Widget)) {
				emit(Widget, 'drag-motion', Context, X, Y, MoveEvent)
			} else {
			
			}
		}, true)
	
		var UpHandler = add_event_listener(document, 'mouseup', function(UpEvent) {
			MoveHandler.disconnect()
			UpHandler.disconnect()
			if (PrevTargetElement) PrevTargetElement.style.cursor = PrevTargetElementCursor
			var DestWidget = Widget
			Context.finish = function(Success) {
				Context.Success = Success
				emit(SourceWidget, 'drag-failed', Context)
				Context.State = 'Finished'
				emit(SourceWidget, 'drag-end', Context)
			}
			if (DestWidget && DroppableWidget) {
				var Stopped = emit(Widget, 'drag-drop', Context, X, Y, UpEvent)
				Context.State = Stopped ? 'Stopped' : 'Data'
			} else {
				emit(SourceWidget, 'drag-end', Context)
			}
		}, true)
	}, true)
	
	var InitUpHandler = add_event_listener(document, 'mouseup', function() {
		InitMoveHandler.disconnect()
	}, true)
})

var MonitoredWidgets = []
var MonitoredWidgetsIds = []
var monitor_widget_mouse = function(Widget) {
	if (MonitoredWidgets.indexOf(Widget) > -1) return
	var ListenerIds = {}
	ListenerIds.Over = add_event_listener(Widget.HtmlElement, 'mouseover', function(Event) {
		if (CurrentWidget == Widget) return
		CurrentWidget = Widget
	}, false)
	ListenerIds.Out = add_event_listener(Widget.HtmlElement, 'mouseout', function(Event) {
		//if (CurrentWidget.HtmlElement.contains(Event.toElement)) return
		var X = Event.clientX, Y = Event.clientY
		var Bounds = Widget.HtmlElement.getBoundingClientRect()
		if (X > Math.ceil(Bounds.left) && X < Math.floor(Bounds.right) && Y > Math.ceil(Bounds.top) && Y < Math.floor(Bounds.bottom)) return
		CurrentWidget = null
	}, false)
	ListenerIds.DataGet = connect(Widget, 'drag-data-get', function(__, Context, Type, Data) {
		Context.Cache[Type] = Data
	})
	MonitoredWidgets.push(Widget)
	MonitoredWidgetsIds.push(ListenerIds)
}

export function set_source(Widget, Types) {
	if (!Widget._DragSourceTypes) Widget._DragSourceTypes = {}
	for (var Type in Types) Widget._DragSourceTypes[Type] |= Types[Type]
	if (SourceWidgets.indexOf(Widget) == -1) {
		SourceWidgets.push(Widget)
		monitor_widget_mouse(Widget)
	}
}

export function set_dest(Widget, Types) {
	if (!Widget._DragDestTypes) Widget._DragDestTypes = {}
	for (var Type in Types) Widget._DragDestTypes[Type] |= Types[Type]
	if (DestWidgets.indexOf(Widget) == -1) {
		DestWidgets.push(Widget)
		monitor_widget_mouse(Widget)
	}
}

export function get_data(Context, Type) {
	var Data = Context.Cache[Type]
	if (!Data) {
		Data = {}
		emit(Context.SourceWidget, 'drag-data-get', Context, Type, Data)
	}
	Context.Cache[Type] = Data
	return Data
}
