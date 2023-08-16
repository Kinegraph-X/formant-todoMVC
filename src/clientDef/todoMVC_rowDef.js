/**
 * @def todoMVC_row
 * @isGroup true
 * 
 */

var TypeManager = require('src/core/TypeManager');
var keyCodes = require('src/events/JSkeyboardMap');

var todoMVC_rowDef = function() {

	/*
	 * Build a def that is the template of a "row" (it's our "todo" class)
	 */
	var rowDef = TypeManager.createDef({
			host : TypeManager.createDef({
					type : 'CompoundComponent',
					nodeName : 'li',
					reactOnParent : [
						{
							from : 'none',
							to : 'active',
							filter : function(value) {return (value !== false && value !== true);},		// the row doesn't react on "none" with "active" unless the "none" app state is forced to "active" or null
							map : function(value) {return !value ? true : null;}						// this allows having a "none" state that reflects the -visible- state of the app, and the buttons may consume it to hide or show themselves
						}																				// thus we avoid the otherwise dirty side-effects of row-state mutation when the displayed list is filtered
					],
					reactOnSelf : [
						{
							from : 'active',
							to : 'className',
							map : function(value) {return value !== true ? 'completed' : null;}		// "className" reacts on "active" which is the "source of truth"
						},
						{
							from : 'editing',
							to : 'className'
						}
					],
					states : [
						{className : undefined},
						{hidden : undefined}
					],
					props : [
						{active : undefined},
						{editing : undefined},
						{todoTitle  : undefined}
					],
					subscribeOnChild : [
//						{
//							on : 'update',
//							subscribe : function(e) {
////								if (typeof e.data.editing !== 'undefined' && this.streams['active'].value) {
////									
////								}
////								else 
//								if (e.data.action === 'stop_edit') {
//									this.streams['editing'].value = null;
//								}
//								else if (e.data.action === 'todoTitle') {
//									this.streams['editing'].value = null;
//									this.streams['todoTitle'].value = e.data.value; // the todoTitle prop is instantly reflected on the model through the stream, and the backend update shall happen through parallel event-bubbling (here acts an implicit callback)
//								}
//							}
//							
//						},
						{
							on : 'stroke_enter',
							subscribe : function(e) {
								this.streams['editing'].value = null;
								this.streams['todoTitle'].value = e.data.value; // the todoTitle prop is instantly reflected on the model through the stream, and the backend update shall happen through parallel event-bubbling (here acts an implicit callback)
								this.trigger('update', {action : 'todoTitle', value : e.data.value}, true);
							}
						},
						{
							on : 'stroke_escape',
							subscribe : function(e) {
								this.streams['editing'].value = null;
							}
						},
						{
							on : 'checked',
							subscribe : function(e) {
								this.streams['active'].value = e.data.checked ? null : true;
								this.trigger('update', {completed : e.data.checked ? this._key : null}, true);
							}
						},
						{
							on : 'dblClicked_ok',
							subscribe : function(e) {
								if (e.data.self.streams.editing) {
									this._children[0].view.getMasterNode().focus();
									this.streams['editing'].value = e.data.self.streams.editing.value;
								}
							}
						},
						{
							on : 'clicked_ok',
							subscribe : function(e) {
								if (e.data.self.streams.remove)
									this.trigger('update', {action : 'todoTitle', value : '', idx : this._key}, true); // update event shall bubble to the root component : by spec., an empty string means "destroy"
							}
						}

					]
				}),
			subSections : [
				TypeManager.createComponentDef({
					nodeName : 'div',
					attributes : [
						{className : 'view'}
					]
				}),
				TypeManager.createComponentDef({
					nodeName : 'div',
					attributes : [
						{className : ''}
					]
				})
			],
			members : [
				TypeManager.createComponentDef({
					type : 'OnEnterValidableTextInput',
					section : 1,
					attributes : [
						{className  : 'edit'}
					],
					reactOnParent : [
						{
							to : 'hidden',
							from : 'editing',
							map : function(value) {return value === 'editing' ? null : 'hidden';}
						},
						{
							cbOnly : true,
							from : 'editing',
							subscribe : function(value) {if (value === 'editing') this.view.getMasterNode().focus();}
						},
						{	
							cbOnly : true,
							from : 'todoTitle',
							subscribe : function(value) {
								this.view.getMasterNode().value = value;
							}
						}
					],
					props : [
						{hidden : 'hidden'}
					]
				}),
			
				TypeManager.createComponentDef({
					type : 'CheckboxInput',
					nodeName : 'input',
					section : 0,
					attributes : [
						{className  : 'toggle'}
					],
					reactOnParent : [
						{
							from : 'active',
							to : 'checked',
							map : function(value) {return !value ? 'checked' : null;}
						}
					]
				}),
				TypeManager.createComponentDef({
					type : 'VisibleStateComponent',
					nodeName : 'label',
					section : 0,
					attributes : [
						{className  : "view"},
					],
					props : [
						{editing : 'editing'}
					],
					reactOnParent : [
						{
							cbOnly : true,
							from : 'todoTitle',
							subscribe : function(value) {this.view.setTextContent(value);}
						}
					]
				}),
				TypeManager.createComponentDef({
					type : 'VisibleStateComponent',
					nodeName : 'button',
					section : 0,
					attributes : [
						{className  : 'destroy'}

					],
					props : [
						{remove : true}
					]
				})
			]
		});
	
	return rowDef;
}

module.exports = todoMVC_rowDef;