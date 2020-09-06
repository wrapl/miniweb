import * as Widget from "ui/Widget";

export const ItemT = _class(null, itemInit, {
	isSensitive: itemIsSensitive,
	isVisible: itemIsVisible
})

function itemInit(item, attrs, element) {
	item.element = element
	item.visible = true
	item.sensitive = true
	item.group = null
	item.id = attrs.id || newId()

	item.connectProperty('visible', () => {
		var visible = item.group ? item.group.visible && item.visible : item.visible
		visible ? element.removeClass('hidden') : element.addClass('hidden')
	})
	
	item.connectProperty('sensitive', () => {
		var sensitive = item.group ? item.group.sensitive && item.sensitive : item.sensitive
		sensitive ? element.removeClass('disabled') : element.addClass('disabled')
	})
	
	item.connectProperty('group', (__, newGroup, oldGroup) => {
		if (oldGroup) {
			item.groupSensitiveId.disconnect()
			item.groupVisibleId.disconnect()
		}
		if (!newGroup) return
		item.groupSensitiveId = newGroup.connectProperty('sensitive', function() {
			var sensitive = newGroup ? newGroup.sensitive && item.sensitive : item.sensitive
			sensitive ? element.removeClass('disabled') : element.addClass('disabled')
		})
		item.groupVisibleId = newGroup.connectProperty('visible', () => {
			var visible = newGroup ? newGroup.visible && item.visible : item.visible
			visible ? element.removeClass('hidden') : element.addClass('hidden')
		})
	})


	for (var attr in attrs) {
		if (attr.startsWith("on-")) {
			item.connect(attr.substring(3), attrs[attr]);
			delete attrs[attr];
		}
	}
	item.attrs = attrs;
}

function itemIsSensitive(item) {
	return item.group ? item.group.sensitive && item.sensitive : item.sensitive
}

function itemIsVisible(item) {
	return item.group ? item.group.visible && item.visible : item.visible
}

export const LabelT = _class(ItemT, labelInit, {
	addChild: labelSetText
})

function labelInit(item, attrs) {
	item.type = 'label'
	itemInit(item, attrs, <span className='label widget'>
		{attrs.icon && createIcon(attrs.icon)}
		{attrs.text}
	</span>)
}

function labelSetText(item, text) {
	item.element.appendChild(<span className='text'>{text}</span>)
}

export const ButtonT = _class(ItemT, buttonInit, {
	addChild: buttonSetText
})

function buttonInit(item, attrs) {
	item.type = 'button'
	itemInit(item, attrs, <span className='button widget'>
		{attrs.icon && <i className={'icon ' + attrs.icon}>
			{attrs.emblem && <i className={'emblem ' + attrs.emblem}/>}
		</i>}
		{attrs.tooltip && <span className='tooltip'>{attrs.tooltip}</span>}
	</span>);
	
	item.element.addEventListener('mousedown', function(mouseEvent) {
		mouseEvent.preventDefault()
		if (itemIsSensitive(item)) item.emit('clicked')
		document.onmouseup = function() {
			mouseEvent.preventDefault()
			document.onmouseup = null
			item.emit('clicked')
		}
	})
}

function buttonSetText(item, text) {
	item.element.appendChild(<span className='text'>{text}</span>)
}

export const ToggleT = _class(ButtonT, toggleInit, {
	setActive: toggleSetActive,
	setRelated: toggetSetRelated
})

function toggleInit(item, attrs) {
	buttonInit(item, attrs)
	item.toggleGroup = [item]
	item.type = 'toggle'
	item.element.addClass('toggle')
	item.active = false
	
	item.connectProperty('active', () => {
		var element = item.element
		item.active ? element.addClass('active') : element.removeClass('active')
	})
	
	item.connect('clicked', () => toggleSetActive(item))
}

function toggleSetActive(item) {
	item.active = true
	var toggleGroup = item.toggleGroup
	for (var i = 0; i < toggleGroup.length; i++) {
		var button = toggleGroup[i]
		if (button === item || !button.active) continue
		button.active = false
	}
}

function toggetSetRelated(item, related) {
	item.toggleGroup = related ? related.toggleGroup : []
	item.toggleGroup.push(item)
}


export const ComboboxT = _class(ItemT, comboboxInit, {
	addChild: comboboxInsert
})

function comboboxInit(item, attrs) {
	item.entries = []
	item.width = null
	let container = <span className='combobox container'>
		<i className='fa fa-chevron-down'/>
		{item.label = <span className='label'/>}
	</span>;
	itemInit(item, attrs, <span className='button combobox widget'>
		{container}
		{item.menuElement = <span className='combobox menu widget'/>}
	</span>)

	container.addEventListener('click', function() {
		if (!itemIsSensitive(item)) return
		item.element.addClass('active')
		var listener = document.addEventListener('click', function() {
			document.removeEventListener('click', listener, true)
			item.element.removeClass('active')
		}, true)
	}, false)
	
	item.connectProperty('width', function(__, width) {
		item.element.style.width = width == null ? null : width + 10 + 'px'
		container.style.width = width == null ? null : width + 'px'
		item.label.style['max-width'] = width - 18 + 'px'
	})
}

function comboboxInsert(item, child) {
	if (child instanceof ComboboxChildT) {
		item.menuElement.appendChild(child.element)
		child.connect('clicked', function() {
			for (var i = 0; i < item.entries.length; i++) {
				var entry = item.entries[i]
				if (entry === child) continue
				entry.element.removeClass('selected')
			}
			child.element.addClass('selected')
			item.emit('changed', child)
		})
		item.entries.push(child);
	} else {
		item.label.appendChildren(child);
	}
}

export const ComboboxChildT = _class(null, comboboxChildInit, {
	addChild: comboboxChildAdd
})

function comboboxChildInit(child, attrs) {
	child.id = newId();
	child.text = attrs.text;
	child.value = attrs.value;
	child.element = <span className='combobox menu entry widget'>
		<i className='combobox menu entry tick fa fa-check'/>
		{child.label = <span className='combobox menu entry text'/>}
	</span>;
	
	child.element.addEventListener('click', function() {
		child.emit('clicked')
	})
}

function comboboxChildAdd(child, element) {
	child.label.appendChildren([element])
}

var SliderT = _class(ItemT, sliderInit, {
})

function sliderInit(item, text, min, max, step, initial, tooltip) {
	var description = <span className='combobox label description'>{text}</span>;
	var value = item.ValueElement = <span className='combobox label selected-text'>{initial.toString()}</span>;
	var label = <span className='combobox label widget'>{description}{value}</span>;
	var indicator = <i className='combobox indicator dylan-icon-down-triangle-arrow'/>;
	var container = <span className='combobox container'>{label}{indicator}</span>;
	var slider = item.SliderElement = <input className='slider' type="range" min={min} max={max} step={step} size={10} value={initial}/>;
	var menu = <form className='slider-menu'>{slider}</form>;
	var element = <span className='button combobox widget'>{container}{menu}</span>;
	
	itemInit(item, element)

	container.addEventListener('click', function() {
		if (!itemIsSensitive(item)) return
		item.element.addClass('active')
		var listener = document.addEventListener('click', function() {
			document.removeEventListener('click', listener, true)
			item.element.removeClass('active')
		}, true)
	}, false)
	
	slider.addEventListener("input", function() {
		item.value = slider.value
		value.textContent = item.value.toString()
	})
	
	item.connectProperty('width', function(__, width) {
		item.element.style.width = width == null ? null : width + 10 + 'px'
		container.style.width = width == null ? null : width + 'px'
		label.style['max-width'] = width - 18 + 'px'
	})
}

export const SeparatorT = _class(ItemT, separatorInit)

function separatorInit(item) {
	var element = <span className='separator'/>;
	itemInit(item, element)
}

export const SpaceT = _class(ItemT, spaceInit)

function spaceInit(item, width) {
	item.width = width || 10
	itemInit(item, <span className='space'/>);
	item.element.style.width = width + 'px'
	item.connectProperty('width', function() {item.element.style.width = item.width + 'px'})
}

export const ProxyT = _class(null, proxyInit)

function proxyInit(ItemProxy, element) {
	ItemProxy.element = element
	element.addClass('toolbar')
	element.addClass('proxy')
	element.addClass('item')
}


////////////////////////////////////


var GroupT = _class(null, groupInit, {
	add: groupAdd,
	remove: groupRemove
})

function groupInit(group, Name) {
	group.Name = Name
	group.items = []
	group.visible = true
	group.sensitive = true
}

function groupAdd(group, item) {
	if (item.group) item.group.remove(item)
	group.items.push(item)
	item.group = group
	emit(group, 'changed')
}

function groupRemove(group, item) {
	var index = group.items.indexOf(item)
	if (index == -1) throw 'item not in group'
	group.items.splice(index, 1)
	item.group = null
	emit(group, 'changed')
}



export const T = _class(Widget.T, init, {
	addChild: addChild,
	insert: insert,
	remove: remove,
	getItem: getItem,
	addLayout: addLayout
})

function init(self, attrs) {
	attrs.height = attrs.height || [30];
	Widget.init(self, attrs, <div className='toolbar'>
		{self.container = <div className='toolbar main'/>}
	</div>);
	self.items = []
	self.itemsById = {}
}

function insert(self, item, id, position) {
	id = id || new_id()
	//if (!id) throw 'Toolbar item not given and id'
	if (self.itemsById[id]) throw 'item already exists'
	if (position < 0 || position >= self.items.length) throw 'index out of range'
	item.id = id
	self.container.insertBefore(item.element, self.container.children[position])
	self.items.splice(position, 0, item)
	self.itemsById[id] = item
	return item
}


function addChild(self, item) {
	//if (!id) throw 'Toolbar item not given and id'
	if (self.itemsById[item.id]) throw 'item already exists'
	self.container.appendChild(item.element)
	self.items.push(item)
	self.itemsById[item.id] = item
	return item
}

function remove(self, item) {
	var index = self.items.indexOf(item)
	if (index < 0) throw 'item not in toolbar'
	self.items.splice(index, 1)
	delete self.itemsById[item.id]
	self.container.removeChild(item.element)
}

function getItem(self, id) {
	return self.itemsById[id]
}

function addLayout(self, infoList) {
	for (var i = 0; i < infoList.length; i++) {
		var info = infoList[i]
		var type = info.type
		var item
		switch (type) {
		case 'label':
			item = new LabelT(info.icon, info.text)
			break
		case 'button':
			item = new ButtonT(info.icon, info.text, info.tooltip)
			break
		case 'Toggle':
			item = new ToggleT(info.icon, info.text, info.tooltip)
			if (info.related) {
				var related = getItem(self, info.related)
				if (!related) throw 'Related item ' + info.related + ' not found'
				item.setRelated(related)
			}
			break
		case 'Combobox':
			item = new ComboboxT(info.text, info.tooltip)
			var children = info.children
			for (var J = 0; J < children.length; J++) {
				var childInfo = children[J]
				var child = item.add(childInfo.text, childInfo.tooltip, childInfo.id)
				child.value = childInfo.value
			}
			if (info.width) item.width = info.width
			break
		case 'slider':
			item = new SliderT(info.text, info.min, info.max, info.step, info.value, info.tooltip)
			if (info.width) item.width = info.width
			break
		case 'Proxy':
			item = new ProxyT(info.element)
			break
		case 'Separator':
			item = new SeparatorT()
			break
		case 'Space':
			item = new SpaceT(info.width)
			break
		case 'Custom':
			item = info.item
			break
		case 'constructor':
			var constructor = info.constructor
			item = new constructor.apply(constructor, info.Args)
			break
		default:
			throw 'Toolbar item type ' + type + ' unknown'
		}
		if (info.group != null) {
			var groupName = info.group
			var group = null
			for (var J = 0; J < self.items.length; J++) {
				var anItem = self.items[J]
				if (anItem.group != null && anItem.group.Name === groupName) {
					group = anItem.group
					break
				}
			}
			if (!group) {
				group = new GroupT()
				group.Name = groupName
			}
			group.add(item)
		}
		for (var attr in info) if (attr.substr(0, 5) == "data-") item.element.setAttribute(attr, info[attr])
		addChild(self, item)
	}
}
