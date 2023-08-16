/**
 * @def todoMVC
 * @isGroup true
 * 
 */
var TypeManager = require('src/core/TypeManager');
var Components = require('src/core/Component');

var todoMVCDef = function(parentView, parent) {
	
	/*
	 * Here is built the App in a declarative style:
	 * 
	 * This is mostly the definition of the View / views,
	 * but it's also our "state machine",
	 * defining the conditions required for a state to change,
	 * and the events the app can listen to.
	 * The real "effects" are triggered by these events,
	 * but occur at the highest-level of the app 
	 * (in the View-Model through the Controler).
	 */
	var moduleDef = TypeManager.createComponentDef({
				host : TypeManager.createComponentDef({		// The host-def for a composite (read "is of type CompoundComponent") doesn't need the "hostOnly" flag. It's a "composition" def, it must describe the host as a real Component.
															// 		ie. the "hierarchicalDefinition" needed by any component is nested in a hierarchicalDefinition that has a host-def. ("hostOnly" is used, and enlightened, later in that def).
					nodeName : 'section',					// Acting as a Definition's factory, the TypeManager uses a "locked" recursive loop, to prevent a too deep nesting in HierarchicalDefinition-s.
					attributes : [							// => Tip: The App Igniter makes use of a "typed" host when given (having it's type declared in the host... ie. in the host-def which is the leaf-node, like all "member" components),
						{className  : "todoapp"}			// 	  but we'll generally use the explicit IgnitionToComposed launcher (simply aliased "Ignition")
					],
					props : [
						{none : false},
						{someNot : false},
						{length : null},
						{filter : null}
					]
				}),
				subSections : [
					TypeManager.createComponentDef({
						nodeName : 'h1',
						attributes : [
							{textContent : 'todos'}
						]
					}),
					TypeManager.createComponentDef({
						nodeName : 'header',
						attributes : [
							{className  : "header"}
						]
					}),
					TypeManager.createComponentDef({
						type : 'ComponentWithView',
						nodeName : 'section',
						attributes : [
							{className  : "main"}
						],
						states : [
							{hidden : undefined}
						],
						reactOnParent : [
							{
								to : 'hidden',
								from : 'length',
								map : function(value) {return !value ? 'hidden' : null;}
							}
						]
					}),
					TypeManager.createComponentDef({
						type : 'ComponentWithView',
						nodeName : 'footer',
						attributes : [
							{className  : "footer"}
						],
						states : [
							{hidden : 'hidden'}
						],
						reactOnParent : [
							{
								to : 'hidden',
								from : 'length',
								map : function(value) {console.log('stream updated');return !value ? 'hidden' : null;}
							}
						]
					})
				],
				members : [
					
					TypeManager.createComponentDef({
						type : 'KeyboardSubmittableTodoInput',
						nodeName : 'input',
						section : 1,
						attributes : [
							{className  : "new-todo"},
							{autofocus : ''},
							{placeholder : 'What needs to be done?'}
						]
					}),
					TypeManager.createComponentDef({
						nodeName : 'input',
						section : 2,
						attributes : [
							{className  : "toggle-all"},
							{type : 'checkbox'}
						]
					}),
					TypeManager.createComponentDef({
						type : 'VisibleStateComponent',
						nodeName : 'label',
						section : 2,
						attributes : [
							{htmlFor  : "toggle-all"}
						],
						states : [
							{hidden : 'hidden'},
							{emphasize : undefined}
						],
						reactOnParent : [
							{
								to : 'emphasize',
								from : 'none',
								map : function(value) {return value ? true : null;}
							},
							{
								to : 'hidden',
								from : 'length',
								map : function(value) {return !value ? 'hidden' : null;}
							}
						]
					}),
					/*
					 * EVERY Component MUST have a 2 levels deep definition :
					 * 		- even if it's not a Component
					 * 
					 * Explanation :
					 * 
					 *  When defining explicitly the "host" :
					 *  	- A composed Component MUST have a "host" that has a 2 levels deep definition : 
					 *  		-*- the host of a composed Component implicitly defines this composed Component as being itself a ComponentWithView (although it is typed as "CompoundComponent")
					 *  		-*- and then, the host is possibly having member-subViews (even if it's very unlikely, and not tested)
					 *  	- The members of a composed Component are themselves, seeing this as a strong probability, Components
					 *  			=> for every member (or subSection) of a composed Component, the framework will try to instanciate a Component
					 *  		-*- as a consequency, even a non-typed member of a composed Component shall be interpreted as a ComponentWithView 
					 *  	- The only case where you shall define a single level host, and consequently use the "hostOnly" flag, is when :
					 *  		-*- you explicitly define the host of the Component : for it holds the "type" property of that component
					 *  		-*- (optionnaly) you explicitly define subViews on that Component, which the framework shall handle without trying to instanciate them as Components
					 *  
					 *   When NOT explicitly defining the host of a Component's definition, the type-manager includes a short-syntax case :
					 *   	- The resulting definition-object is always a 2 levels deep definition
					 *   			=> it has a "host" property, in which that Component is described (mainly the component's type and the bindings on properties) 
					 */ 
					TypeManager.createComponentDef({
							host : TypeManager.createComponentDef({
								type : 'CompoundComponent',
								nodeName : 'ul',
								attributes : [
									{className  : "todo-list"}
								],
								props : [
									{none : undefined}
								],
								reactOnParent : [
									{
										to : 'none',
										from : 'none'
									}
								],
								section : 2
							})
					}, null, 'rootOnly'),
					TypeManager.createComponentDef({
						type : 'SimpleText',
						nodeName : 'span',
						section : 3,
						attributes : [
							{className  : "todo-count"}
						],
						reactOnParent : [
							{
								cbOnly : true,
								from : 'filter',
								subscribe : function(value) {this.view.setTextContent((value === 0 || value > 1) ? value + ' items left' : value + ' item left');}

							}
						]
					}),
					TypeManager.createComponentDef({
						host : TypeManager.createComponentDef({
							type : 'CompoundComponent',
							nodeName : 'ul',
							attributes : [
								{className  : "filters"}
							],
							section : 3,
							states : [
								{hidden : 'hidden'}
							],
							reactOnParent : [
								{
									to : 'hidden',
									from : 'length',
									map : function(value) {return !value ? 'hidden' : null;}
								}
							]
						}),
						members : [
							TypeManager.createComponentDef({
								host : TypeManager.createComponentDef({
									type : 'ComponentWithView',
									nodeName : 'li',
								}, null, 'hostOnly'),			// DEPRECATED host def -do- need "hostOnly" when there is a type on the group def (as this isn't a group in fact)
								members : [
									TypeManager.createComponentDef({
										nodeName : 'a',
										attributes : [
											{href : '#/'},
											{className  : "selected"},
											{textContent : 'All'}
										]
									}, null, 'hostOnly')
								]
							}, null, 'rootOnly'),
							TypeManager.createComponentDef({
								host : TypeManager.createComponentDef({
									type : 'ComponentWithView',
									nodeName : 'li',
								}, null, 'hostOnly'),
								members : [
									TypeManager.createComponentDef({
										nodeName : 'a',
										attributes : [
											{href : '#/active'},
											{textContent : 'Active'}
										]
									}, null, 'hostOnly')
								]
							}, null, 'rootOnly'),
							TypeManager.createComponentDef({
								host : TypeManager.createComponentDef({
									type : 'ComponentWithView',
									nodeName : 'li',
								}, null, 'hostOnly'),
								members : [
									TypeManager.createComponentDef({
										nodeName : 'a',
										attributes : [
											{href : '#/completed'},
											{textContent : 'Completed'}
										]
									}, null, 'hostOnly')
								]
							}, null, 'rootOnly')
						]
					}, null, 'rootOnly'),
					TypeManager.createComponentDef({
						type : 'VisibleStateComponent',
						nodeName : 'button',
						section : 3,
						attributes : [
							{textContent : 'Clear Completed'},
							{className  : "clear-completed"}
						],
						states : [
							{hidden : 'hidden'}
						],
						reactOnParent : [
							{
								to : 'hidden',
								from : 'someNot',
								map : function(value) {return value ? null : 'hidden';}
							}
						]
					})
				]
	}, null, 'rootOnly');
		// DEPRECATED							
		// Here we use the "rootOnly" flag, which is a needed optimization,
		// as the factory (TypeManager) would otherwise traverse and initialize again 
		// the complete definition, assuming its role, and applying a "strict" behavior: 
		// 	=> a HierarchicalDefinition can't be considered as "typed"
		// 	   unless we have assigned "explicitly" -all- the props.
		// But most of the time we'll build the def component by component,
		// so the only uncertainty lives at the "root" depth.
	new Components.CompoundComponent(moduleDef, parentView, parent);
}

todoMVCDef.__factory_name = 'todoMVCDef';
module.exports = todoMVCDef;