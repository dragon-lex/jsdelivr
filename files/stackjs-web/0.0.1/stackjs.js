/**
*
*	StackJS Framework Version 0.0.1
*	Author: Elad Yarkoni
*
*
*/
(function(){

	/**
	*
	*	STACKJS Defaults
	*
	**/
	var Defaults = {
		defaultObjectName: "STObject",
		extendsSeperator: "::",
		stackSize: 50
	};
	
	/**
	*
	*	STACKJS Classes holder
	*
	**/
	var _classes = {};
	/**
	*
	*	STACKJS exception callbacks holder
	*
	**/
	var _exceptionCallbacks = {};

	/**
	*
	*	STACKJS Privates
	*
	**/
	var report = function(text) {
		var date = new Date();
		console.log("STACKJS: " + date.toString() + " : " + text);
	};

	var parseClassName = function(classStr) {
		var classNameArray = classStr.split(Defaults.extendsSeperator);
		var className = classNameArray[0];
		var extend = classNameArray[1];
		return {
			name: className,
			extend: extend
		};
	};

	/**
	*
	*	STACKJS Stack Object
	*
	**/
	var Stack = {

		stack: [],
		/**
		* push data to stack
		*/
		push: function(className, methodName) {
			if (Defaults.stackSize == this.stack.length) {
				this.stack.shift();
			}
			this.stack.push({
				className: className,
				methodName: methodName
			});
		},
		/**
		* pop data from stack
		*/
		pop: function() {
			return this.stack.pop();
		},
		/**
		* clear stack
		*/
		clear: function() {
			this.stack = [];
		},
		/**
		* print stack trace
		*/
		printStackTrace: function(exceptionObject) {
			var traceStr = "";
			for (var i = 0; i < this.stack.length; i++) {
				var stackObect = this.stack[i];
				traceStr += stackObect.className + " : " + stackObect.methodName + " -> ";
			}
			traceStr += exceptionObject.toString();
			report(traceStr);
		}
	};

	/**
	* Throw Method
	*
	*/
	var Throw = function(exceptionObject) {
		Stack.printStackTrace(exceptionObject);
		Stack.clear();
		if (typeof(_exceptionCallbacks[exceptionObject._className]) !== 'undefined') {
			_exceptionCallbacks[exceptionObject._className](exceptionObject);	
		} else {
			// throw exceptionObject.toString();	
		}
			
	};

	/**
	* Catch Method
	*
	*/
	var Catch = function(exceptionName, callback) {
		_exceptionCallbacks[exceptionName] = callback;		
	};

	/**
	*
	*	STACKJS Publics
	*
	**/
	var Class = function(name,data) {
		//
		// Get class name and extended class name
		//
		var classNameObject = parseClassName(name);
		name = classNameObject.name;
		var extendsClassName = classNameObject.extend;

		if (typeof(extendsClassName) === 'undefined') {
			extendsClassName = Defaults.defaultObjectName;	
		}
		

		//
		// class empty function function
		//
		_classes[name] = function(){
			// active class constructors
			if (typeof(this[name]) !== 'undefined') {
				this[name].apply(this,arguments);	
			} else if (typeof(this[extendsClassName]) !== 'undefined') {
				this[extendsClassName].apply(this,arguments);	
			}

		};

		//
		// Copy Extended class to new class
		//
		for (var proto in _classes[extendsClassName].prototype) {
			_classes[name].prototype[proto] = _classes[extendsClassName].prototype[proto];
		}

		//
		// Modify Class Methods
		//
		for (var propertyName in data) {
			if ((typeof(data[propertyName]) !== 'function')) {
				// create getter
				var getterName = "get" + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
				if ((typeof(data[getterName]) !== 'function') && (propertyName.charAt(0) !== '_')) {
					data[getterName] = (function(originalProperty){
						return function(){
							Stack.push(name, originalProperty);
							var retValue = this[originalProperty];
							Stack.pop();
							return retValue;
						};
					}).apply(data,[propertyName]);	
				}
				// create setter
				var setterName = "set" + propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
				if ((typeof(data[setterName]) !== 'function') && (propertyName.charAt(0) !== '_')) {
					data[setterName] = (function(originalProperty){
						return function(object){
							Stack.push(name, originalProperty);
							this[originalProperty] = object;
							Stack.pop();
						};
					}).apply(data,[propertyName]);
				}
			} else {
				data[propertyName] = (function(originalProperty){
						var myFunction = this[originalProperty];
						return function(object){
							Stack.push(name, originalProperty);
							var retValue = myFunction.apply(this,arguments);
							Stack.pop();
							return retValue;
						};
				}).apply(data,[propertyName]);
			}
		}

		// convert data object to class
		for (var propertyName in data) {
			_classes[name].prototype[propertyName] = data[propertyName];
		}
		// adding class name
		_classes[name].prototype["_className"] = name;
		// adding singleton instance
		_classes[name].prototype["_sharedInstance"] = new _classes[name]();
		window[name] = _classes[name];
	};

	/********************************************************
	*
	* StackJS Library
	*
	*********************************************************/
	Class(Defaults.defaultObjectName, {
		
		_className: Defaults.defaultObjectName,

		delegate: null,

		callDelegate: function(methodName,params) {
			if ((this.delegate !== null) && (typeof(this.delegate[methodName]) !== 'undefined')) {
				this.delegate[methodName].apply(this.delegate, params);
			}	
		}

	}); 

	Class('Exception',{
		message: null,
		Exception: function(message) {
			this.message = message;
		},
		toString: function() {
			return "Exception: " + this._className + " '" + this.message + "'";
		}
	});

	/*
	*
	*	Global Variables
	*
	*/
	window.Class = Class;
	window.Throw = Throw;
	window.Catch = Catch;
})();
