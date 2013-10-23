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
		this.attributes = {};
		this.event = new Event();
	};
	
	// Methods for Model class will be added to Model.prototype via _.extend.
	_.extend(Model.prototype, {
		// This is for the model url. Is it going to be a function?
		url: "",
		
		// Return whatever is in Model.attribute[attributeKey].
		get: function(attributeKey){
			return this.attribute[attributeKey];
		},
		
		// Set Model.attribute[key] to value -OR- set Model.attributes to
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
						//shld fire some change events
					}
				}
			} else {
				if( this.attributes[key] != value){                    
					//something changed
					this.attributes[key] = value;
					//shld fire some change events
				}
			}
		},
		
		// perform GET on this.url.
		fetch: function(){
			var instance = this;
			Sync("read", this).done(function(data){
				//console.log(data);
				instance.set(data);
				console.log(instance);
			});
		}
	});
	
	// =========================================================
	// This is the View class.
	// 
	// =========================================================
	var View = Barebone.View = function(){
		
	}
	
	_.extend(View.prototype,{
	
		// Default render is a no-op
		render: function(){}
	
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
		this.on = function(name, callback){
			instance.eventMap[name] = callback;
		};
		
		// Delete events from eventMap
		this.off = function(name){
			delete instance.eventMap[name];
		};
		
		// Execute the function corresponding to the event
		this.trigger = function(name){
			var func = instance.eventMap[name];
			
			var args = Array.prototype.slice.call(arguments);
			args.splice(0, 1);
			
			func.apply(this, args);
		};
	}
	
	
	// =========================================================
	// This is the Sync class.
	// Responsible for performing Ajax using jquery.
	// =========================================================
	var Sync = Barebone.Sync = function(method, model){
		// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
        var methodMap = {
            'create': 'POST',
            'update': 'PUT',
            'patch':  'PATCH',
            'delete': 'DELETE',
            'read':   'GET'
        };
        
        return $.ajax({
            url: model.url,
            type: methodMap[method]
        });
	}
	
	
	// =========================================================
	// Helper methods
	// =========================================================
	// Currently only allow 1 layer of inheritance. 
	// Parent -> child is OK.
	// Parent -> child -> grandchild is NOT OK.
	var extend = function(protoProps){
		var parent = this;
		
		// add additional methods to parent.prototype.
		_.extend(parent.prototype, protoProps);
		
		var child = new parent();
		
		// Add static properties
		_.extend(child, parent);
		
		return child;
	}
	Model.extend = View.extend = extend;


}).call(this);