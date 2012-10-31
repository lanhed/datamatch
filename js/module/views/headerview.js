// module/views/headerview.js
(function(Views){

    var Header = App.module('Header');

    Views.HeaderView = Backbone.View.extend({
    	el:$('#header'),
		tagName:'div',
		initialize:function() {
			App.on('sites:selected', this.displayPlanners, this);
			App.on('planners:selected', this.displayLocales, this);
			App.on('locales:selected', this.match, this);
			this.render();
		},
		render:function() {
			this.$el.prepend('<h1>String ID matching system</h1>');
			this.sites = new Views.SelectView({model:this.model, collection:this.model.sites,id:'sites'});
			this.$el.append(this.sites.render().el);
			this.errors = new Views.ErrorView({model:this.model, collection:this.model.errors});
			this.$el.append(this.errors.render().el);
			return this;
		},

		displayPlanners: function() {
			if (!this.planners) {
				this.planners = new Views.SelectView({model:this.model, collection:this.model.planners,id:'planners'});
				this.$el.append(this.planners.render().el);
			} else {
				this.reset();
				App.trigger('status:changed','Waiting for your selection');
				$(this.planners.el).prop("selectedIndex",0);
				if (this.locales) {
					// remove the first two.
					this.locales.collection.shift();
					this.locales.collection.shift();
					$(this.locales.el).remove();
					this.locales = undefined;
				}
			}
		},

		displayLocales: function() {
			if (!this.locales) {
				this.locales = new Views.SelectView({model:this.model, collection:this.model.locales,id:'locales'});
				this.$el.append(this.locales.render().el);
			} else {
				$(this.locales.el).prop("selectedIndex",0);
			}
		},
		match:function(){
			App.trigger('data:complete',this.model.defaults);
		},
		statusChanged:function(type, locale) {
			this.$el.append(this.status.render(type,locale).el);
		},
		reset:function(){
			App.trigger('errorClearAll');
		}
    });

    Views.SelectView = Backbone.View.extend({
    	tagName:'select',
    	events: {
			'change':'selectionChanged'
    	},
    	initialize:function(){
			_.bindAll(this,'render','selectionChanged');

			this.collection.add({
				value:'',
				text:'- Select -'
			},{ at:0 });

			if(this.id === "locales") {
				this.collection.add({
					value:'all',
					text:'All locales'
				},{ at:1 });
			}
    	},
    	render:function(){
			var selectTemplate = _.template($('#select_template').html(), {
				options:this.collection
			});
			$(this.el).html(selectTemplate);
			return this;

    	},
    	selectionChanged:function(e) {
			var index = parseInt($(e.currentTarget).val());
			if(this.id === "sites") {
				this.model.defaults.site = this.collection.at(index+1).get('text');
				App.trigger('errorClearAll');
				//App.router.navigate(this.model.defaults.site, {trigger:true});
			}
			if(this.id === "planners") {
				this.model.defaults.planner = this.collection.at(index+1).get('text');
				App.trigger('errorClearAll');
				//App.router.navigate(this.model.defaults.site+'/'+this.model.defaults.planner, {trigger:true});
			}
			if(this.id === "locales") {
				if((parseFloat(index) == parseInt(index)) && !isNaN(index)) {
					this.model.defaults.locale = this.collection.at(index+2).get('text');
					//App.router.navigate(this.model.defaults.site+'/'+this.model.defaults.planner+'/'+this.model.defaults.locale, {trigger:true});
				} else {
					var locales = [];
					_.each(this.collection.toArray(), function(model) {
						if ((typeof model.id) == 'number') {
							locales.push(model.get('text'));
						}
					});
					this.model.defaults.locale = locales;
				}
			}
			App.trigger(this.id+':selected',this.model.defaults);
    	}
    });

	Views.ErrorView = Backbone.View.extend({
		tagName:'span',
		id:'errors',

		initialize:function() {
			_.bindAll(this,'render','addError','clear','hasErrors');
			App.on('errorFound',this.addError, this);
			App.on('errorClearLocal',this.clearLocal, this);
			App.on('errorClearAll',this.clearAll, this);
			App.on('status:changed', this.statusChanged, this);
			this.errorItems = {};
		},
		render:function() {
			var self = this;
			this.$el.append('<ul id="errorHeader"><li class="th"><span id="errorCount">Status: Waiting for your selection</span></ul>');
			this.$el.find('.th').append('<ul id="errorList"></ul>');

			this.$el.find('#errorHeader').click(function() {
				if (self.collection.length > 0) {
					$(this).toggleClass('error_open');
					$(this).find('#errorList').toggleClass('error_open');
				}
			});
			
			return this;
		},
		addError:function(error) {
			var model = new Header.Error(error);
			var id = model.get('type');
			if (model.get('locale')) {
				id += '_'+ model.get('locale');
			}
			model.id = id;
			this.collection.add(model);
			var itemView = new Views.ErrorItemView({model:model});
			this.errorItems[id] = itemView;

			this.$el.find('.th').addClass('hasErrors');
			this.$el.find('#errorCount').html(this.collection.length + ' error(s)');

			// render itemView
			$('#errorList').append(itemView.render().el);
		},
		clear:function() {
			App.trigger('clearErrors');
			this.$el.find('#errorCount').html('Status: Waiting for your selection');
			this.$el.find('.th').removeClass('hasErrors');
			this.$el.find('ul').removeClass('error_open');
		},
		clearAll:function() {
			this.clear();
			this.collection.remove(this.collection.toArray());

			for(var item in this.errorItems) {
				this.collection.remove(this.errorItems[item].model);
				this.errorItems[item].unrender();
			}
		},
		clearLocal:function(callback) {
			var model;
			var item;
			var models = [];
			for (var i = this.collection.length - 1; i >= 0; i--) {
				model = this.collection.at(i);
				if (model.get('type') == 'localData' || model.get('type') == 'localGenericData') {
					models.push(model);
					item = this.errorItems[model.id];
					item.unrender();
				}
			};

			if (models.length > 0) {
				this.collection.remove(models);
			}

			if(this.collection.length == 0) {
				this.clear();
			}
			callback(this.collection.length);
		},
		hasErrors:function() {
			if (this.collection.length > 0) {
				return true;
			} else {
				return false;
			}
		}, 
		statusChanged:function(type, locale) {
			if (type == "Done") {
				this.$el.addClass('done');
			} else {
				this.$el.removeClass('done');
			}
			var msg = 'Status: ';
			if (type) { msg += type; }
			if (locale) { msg += ' for '+locale; }

			this.$el.find('#errorCount').html(msg);
		}
	});

	Views.ErrorItemView = Backbone.View.extend({
		tagName:'li',

		initialize:function() {
			_.bindAll(this,'render','unrender','remove');
		},
		render:function() {
			var forType = this.model.get('type') == 'globalData' || this.model.get('type') == 'globalGenericData' ? '' : 'for ' + this.model.get('locale');
			$(this.el).html('Could not load '+this.model.get('type')+' '+ forType + '<br><span class="errorURL">'+this.model.get('url')+'</span>');
			return this;
		},
		unrender:function() {
			$(this.el).remove();
		}
	});

    return Views;

})(App.module('HeaderViews'));