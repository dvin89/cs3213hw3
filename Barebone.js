(function(){
	//setting up. not very sure what is the purpose of this.
	root = this;
	var Barebone = root.Barebone = {};	//something about namespace
	
	// =====================================================
	// This is the Model class
	// Model class will have "attributes" as fields.
	// Methods will be added to Model.prototype instead.
	// =====================================================
	var Model = Barebone.Model = function(){
		this.isNew = true;
		this.event = new Event();
		this.attributes = {},
		this.initialize.apply(this, arguments);
		this.id=1;
	};
	
	// Methods for Model class will be added to Model.prototype via _.extend.
	_.extend(Model.prototype, {
		// This is for the model url. Is it going to be a function?
		url: "",

		initialize: function(){},
		
		toJSON: function() {
			return _.clone(this.attributes);
		},	
		
		// Return whatever is in Model.attribute[attributeKey].
		get: function(attributeKey, index){
			if(Object.prototype.toString.call( this.attributes ) === '[object Array]')
				return this.attributes[index][attributeKey];
			return this.attributes[attributeKey];
		},
		
		// Set Model.attribute[key] to value -OR- set Model.attributes to
		// whatever is in the {key: value} parameter.
		set: function(key, value){
			
			if (key == null) return this;
			if(Object.prototype.toString.call( key ) === '[object Array]'){
				this.attributes = key;
				this.event.trigger("change");
			}
			else{
				// Handle both `"key", value` and `{key: value}` -style arguments.
				if (typeof key === 'object') {	// this is the {key: value} form
					var obj = key;    //change name to make intent more obvious
					var keyArr = Object.keys(obj);

					for(var i = 0; i<keyArr.length; i++){
						if( this.attributes[keyArr[i]] != obj[keyArr[i]]){                    
							//something changed
							this.attributes[keyArr[i]] = obj[keyArr[i]];
							this.event.trigger("change");
						}
					}
				} else {
					if( this.attributes[key] != value){                    
						//something changed
						this.attributes[key] = value;
						this.event.trigger("change");
					}
				}
			}
			//console.log(this.attributes);
			//this.event.trigger("change");
			return this.attributes;
		},
		
		// perform GET on this.url.
		fetch: function(options){
			var instance=this;

			Sync("read", this, null, options);
		},
		
		// perform POST/PUT on this.url.
		save: function(form, options){
			var instance = this;
			if(this.isNew)
				Sync("create", this, form, options);
			else
				Sync("update", this, form, options);
		},
		
		// perform DELETE on this.url.
		destroy: function(){
			var instance = this;
			Sync("delete", this, null, options);
		},

	});
	
	// =========================================================
	// This is the View class.
	// 
	// =========================================================
	var View = Barebone.View = function(){
		this.attributes = {};
		this.initialize.apply(this, arguments);
	};
	
	// Methods for View class will be added to View.prototype via _.extend.
	_.extend(View.prototype, {
		// This is the view DOM div element. Must be an element id for now.
		el: "",
		template: "",
		models: {},	
		events: {},
		
		$el: function(){return $(document.getElementById(this.el));},
		
		template: function(templateName, data, settings){
			_.template(templateName, data, settings);
		},
		
		initialize: function(){},
		
		// Return whatever is in View.attribute[attributeKey].
		get: function(attributeKey){
			return this.attributes[attributeKey];
		},
		
		// Set View.attribute[key] to value -OR- set View.attributes to
		// whatever is in the {key: value} parameter.
		set: function(key, value){
			if (key == null) return this;
			
			// Handle both `"key", value` and `{key: value}` -style arguments.
			if (typeof key === 'object') {	// this is the {key: value} form
				var obj = key;    //change name to make intent more obvious
				var keyArr = Object.keys(obj);

				for(var i = 0; i<keyArr.length; i++){
					if( this.attributes[keyArr[i]] != obj[keyArr[i]]){                    
						//something changed
						this.attributes[keyArr[i]] = obj[keyArr[i]];
					}
				}
			} else {
				if( this.attributes[key] != value){                    
					//something changed
					this.attributes[key] = value;
				}
			}
		},
		
		// Default render is a no-op
		render: function(){},

		//Registering all specified DOM events
		registerDomEvents : function() {
			var domEvents = this.events;			//Dom Events

			//Looping through all the events are registering them.
			for(var domEvent in domEvents) {
				//Converting the callback function from a string to a function type
				var func = _.bind(this[domEvents[domEvent]], this);
				//Splitting the domEvent String object
				var domArr = domEvent.split(" ");

				//Register and listen to event; specify callback function using jQuery's .on function
				$(domArr[1]).on(domEvent, func);
			}		
		}	
	});
	
	// =========================================================
	// This is the Event class.
	// Most other class that needs to handle events will have an
	// event object in it's prototype.
	// =========================================================
	var Event = Barebone.Event = function(){
		var instance = this;
		
		// mapping of events name to function
		this.eventMap = {};
		
		// Add events eventMap
		// callback tell us the function to execute.
		// context tell us which object is responsible for carrying out the callback function
		this.on = function(name, callback, context){
			if(instance.eventMap[name])
				instance.eventMap[name].push({callback:callback, context:context});
			else
				instance.eventMap[name] = [{callback:callback, context:context}];
		};
		
		// Delete events from eventMap
		this.off = function(name){
			delete instance.eventMap[name];
		};
		
		// Execute the function corresponding to the event
		this.trigger = function(name, context){
			var list = instance.eventMap[name];
			var func;
			for(i=0; i<list.length; i++){
				if(context){	//context is defined. We can only trigger context method
					if(list[i].context === context){
						func = list[i].callback;
						var args = Array.prototype.slice.call(arguments);
						args.splice(0, 2);
						func.apply(context, args);
						break;
					}
				}
				else{	//context is undefined. We trigger all callback method
					var args = Array.prototype.slice.call(arguments);
					args.splice(0, 1);
					func = list[i].callback;
					func.apply(list[i].context, args);
				}
			}
		};
	}
	
	
	// =========================================================
	// This is the Sync class.
	// Responsible for performing Ajax using jquery.
	// =========================================================
	var Sync = Barebone.Sync = function(method, model, form, options){
		// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
        var methodMap = {
            'create': 'POST',
            'update': 'PUT',
            'patch':  'PATCH',
            'delete': 'DELETE',
            'read':   'GET'
        };
	   
		// For create and update request, we use ajaxSubmit().
		// For delete and read request, we use ajax();
		// For patch request, we don't care.
		if(method == "create" || method == "update"){
			$(form).ajaxSubmit({
				url: model.url,
				dataType: 'json',
				data: options,
				method: methodMap[method],
				error: function(error, err) {
					alert(method+" Error!");
				},
				success: function(data) {
					// when create request succeed, we need to update
					// model.url to the new model's url.
					if(method == "create"){
						var endPos = model.url.lastIndexOf(".");
						model.url = model.url.substr(0, endPos)+ "/" + data.id + ".json";
					}
					
					// Reset model.attributes and call fetch to update it.
					model.attributes = {};
					model.fetch(options);
				}
			});
		}
		else{	//for GET and DELETE
			$.ajax({	
				url: model.url,
				type: methodMap[method],
				dataType: 'json',
				data: options,
				success: function(data){
					// data will be undefined if it is a destroy request.
					// set model attributes to the one on server.
					if(typeof data != 'undefined'){
						model.attributes = {};
						model.set(data);
						}

					//triggering event after the ajax call above is complete						
					model.event.trigger('change');

					// If this ajax call succeed, that means the model is
					// on the server. Therefore it is not a new model.
					model.isNew = false;
				}
			});
		}
	}
	
	// =========================================================
	// Helper methods
	// =========================================================
	// Currently only allow 1 layer of inheritance. 
	// Parent -> child is OK.
	// Parent -> child -> grandchild is NOT OK.
	var extend = function(staticProps){
		var parent = this;
		var child;
		
		//child is the child class therefore it must be a function.
		//Dummy is created using parent.[[constructor]] therefore it will have
		//the properties of parent.
		//We then add staticProps to dummy and return dummy.
		child = function(){	//this will be the constructor of child class
			dummy = new parent();	
			if (staticProps) _.extend(dummy, staticProps);
			return dummy;
		}

		//Set prototype of child class to a new instance of parent.
		//This is the easiest way to do inheritance
		child.prototype = new parent();
		
		//Extend child with extra methods.
		//if (protoProps) _.extend(child.prototype, protoProps);
		
		//Set constructor to child.
		child.prototype.constructor = child;
		
		return child;
	}
	Model.extend = View.extend = extend;

}).call(this);