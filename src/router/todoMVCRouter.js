// A bit of Doc here, a simple example on reactivity
//		props : [
//		  {myReactiveProp : null}
//		],
//		reactOnParent : [
//		  {
//			from : 'myPropOnParent',
//			to : 'myReactiveProp',
//			subscribe : function(propVal) {
//			  // here, the scope is the component object
//			}
//		],

/**
 * @router todoMVC
 */


var App = require('src/core/AppIgnition');
var rDataset = require('src/core/ReactiveDataset');

var createTodoMVCDef = require('src/clientDef/todoMVCDef');
var createTodoMVC_rowDef = require('src/clientDef/todoMVC_rowDef');

var classConstructor = function() {	
	
	function init(containerIdOrContainerNode) {
		
		/*
		 * Get the definitions, init the root component, instanciate a Dataset obj
		 * (Dataset offers us all the "standard" behaviors needed by any app, mainly "list-type" data management logic)
		 */
		
		var appDef = createTodoMVCDef;
		var todoMVCObj = new App.RootView({init : appDef})._children[0];
		var rowDef = createTodoMVC_rowDef();
		var todoList = new rDataset(
					todoMVCObj,
					todoMVCObj._children[2],
					rowDef,
					['todoTitle', 'active'],
					['none', 'someNot', 'filter']
				);
		
		
		
		/*
		 * The View-Model :
		 */
			/*
			 * recover App :
			 */
		function getInitialState() {
			var initArray = [];
			if (localStorage.getItem('todos-RecitalJS')) {
				JSON.parse(localStorage.getItem('todos-RecitalJS')).forEach(function(item) {
					initArray.push(todoList.newItem(item.todoTitle, item.active));
				})
			}
			todoList.pushApply(initArray);
		}
			/*
			 * New Todo :
			 */
		function newTodo(e) {
			todoList.push(todoList.newItem(e.data.value, true));
			updateBackend();
		}
			/*
			 * Dispatch allChecked (app-level and child-level reactive props)
			 */
		function handleCompleted(e) {
			if (e.data.completed === 'all')
				todoList.setDatasetState('none', todoList.getDatasetState('none') ? null : 'active');
			else
				todoList.updateDatasetState();

			updateBackend();
		}
			/*
			 * Remove Todo
			 */
		function handleRemove(e) {
			todoList.splice(e.data.idx || 0, 1); 			// TODO there is no remove()
			updateBackend();
		}
			/*
			 * Clear Completed
			 */
		function handleClearCompleted(e) {
			todoList.spliceOnProp('active', null);
			updateBackend();
		}
			/*
			 * Filter todos list
			 */
		function filterOnCompleted(inverse) {
			if (inverse !== '') {
				if (inverse === 'active') {
					todoList.setDatasetState('none', todoList.filter(function(item, key) {
						this._children[key].streams.hidden.value = !item.active ? 'hidden' : null;
						return item.active;
					}, this).length ? false : true, true);
					todoList.setDatasetState('someNot', false, true);
				}
				else {
					var active = todoList.filter(function(item, key) {
						this._children[key].streams.hidden.value = item.active ? 'hidden' : null;
						return item.active;
					}, this).length;
					todoList.setDatasetState('none', active ? false : true, true);
					todoList.setDatasetState('someNot', (todoList.length - active) > 0 ? true : false, true);
				}
			}
			else {
				todoList.forEach(function(item, key) {
						this._children[key].streams.hidden.value = null;
					}, this);
				todoList.updateDatasetState();
			}
		}
		function setClassNameOnFiltering(node) {
			this._children.forEach(function(module) {
				if (module.view.getMasterNode().firstChild === node)
					module.view.getMasterNode().firstChild.className = 'selected';
				else
					module.view.getMasterNode().firstChild.className = '';
			});
		}

			/*
			 * Update Store
			 */
		function updateBackend() {
			localStorage.setItem('todos-RecitalJS', todoList.serialize());
		}

		/*
		 * App-level Event binding: 
		 * This is the Controler (the listening and reacting layer) for the master-view,
		 * it calls the methods defined by the View-Model (the link-to-data layer)
		 */
		todoMVCObj.addEventListener('update', function(e) {
			if (e.data.action === 'newtodo')
				newTodo(e);
			else if (typeof e.data.completed !== 'undefined')
				handleCompleted(e);
			else if (e.data.action === 'todoTitle') {
				if (!e.data.value.length)
					handleRemove(e);
				else
					updateBackend();
			}
		});
		todoMVCObj._children[1].addEventListener('clicked_ok', function(e) {
			handleCompleted.call(todoMVCObj, {data : {completed : "all"}});
		});
		todoMVCObj._children[5].addEventListener('clicked_ok', function(e) {
			handleClearCompleted.call(todoMVCObj);
		});
			/*
			 * CSS class update on routing : fallback to DOMEvent binding 
			 * 		=> The current implementation isn't designed to catch click events in the footer (it's handier to work with non-components <a> nodes in that case)
			 */
		todoMVCObj._children[4]._children[0].view.getMasterNode().firstChild.addEventListener('click', function(e) {
			setClassNameOnFiltering.call(todoMVCObj._children[4], this);
		});
		todoMVCObj._children[4]._children[1].view.getMasterNode().firstChild.addEventListener('click', function(e) {
			setClassNameOnFiltering.call(todoMVCObj._children[4], this);
		});
		todoMVCObj._children[4]._children[2].view.getMasterNode().firstChild.addEventListener('click', function(e) {
			setClassNameOnFiltering.call(todoMVCObj._children[4], this);
		});
		
		
		/*
		 * The "router", expressed as a single function call
		 */
		window.onhashchange = () => {
			filterOnCompleted.call(todoMVCObj._children[2], location.hash.replace(/#\//, ''));
		};
		
		

		
		// Add the footer as "rough HTML" (it's not considered as being part of the app)
//		if (typeof containerIdOrContainerNode.getMasterNode() !== 'undefined') {
			var parser = new DOMParser();
			var footerString = ' \
			<footer class="info">\
				<p>Double-click to edit a todo</p>\
				<p>\
					Created by <a href="http://sylvainbreil.com">Sylvain Breil</a>\
					using an "in house" Framework (temporary branded : Kinegraphx Formant)\
				</p>\
				<p>Part of <a href="http://todomvc.com">TodoMVC</a></p>\
			</footer>';
			var doc = parser.parseFromString(footerString, "text/html");
			var rootNode = todoMVCObj._parent.view.getWrappingNode();
			rootNode.append.apply(rootNode, Array.prototype.slice.call(doc.body.childNodes));
//			containerIdOrContainerNode.getRoot().append.apply(containerIdOrContainerNode.getRoot(), Array.prototype.slice.call(doc.body.childNodes));
//		}
		
		
		// HACK for the todoMVC style to traverse the shadowDOM
		// => in a usual case, the todoMVC stylesheet would be transcribed in the framework's syntax
		// Let's spare time and typing, as style is not our point here
		var todoMVCStylesheetContent = '';
		Array.prototype.slice.call(document.styleSheets).forEach(function(style) {
		  if(style.href && style.href.match(/todoMVC/)) {
			  Array.prototype.slice.call(style.rules).forEach(function(rule) {
				  if (rule instanceof CSSStyleRule)
				  	todoMVCStylesheetContent += rule.cssText;
			  });
		  }
		})
		var styleElem = document.createElement('style');
		styleElem.innerHTML = todoMVCStylesheetContent;
		todoMVCObj._parent.view.getWrappingNode().appendChild(styleElem);
		
		
		/*
		 * Retrieve the todos stored on the backend
		 */
		getInitialState();
		
		
		
		
		/*
		 * Some helper functions, usefull to benchmark the App
		 */
		
		function getData(count) {
			var adjectives = ["important ", "minor ", "quite simple ", "imperative "];
		    var tasks = ["Prioritize your ", "We've always a couple of ", "Big stack, but all aren't "];
		    var todosNoun = "todos";
		    var data = [];
		    for (let i = 0; i < count; i++) {
		        data.push(todoList.newItem(tasks[_random(tasks.length)] + adjectives[_random(adjectives.length)] + todosNoun, true));
		    }
		    return data;
		}
		function _random(max) {
		    return Math.round(Math.random() * 1000) % max;
		}
		
	}

	return {
		init : init
	}
}

module.exports = classConstructor;
