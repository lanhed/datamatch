//modules/views/listview.js
(function(Views){

	Views.ListViews = Backbone.View.extend({
		el:$('#deviations'),
		tagName:'div',

		initialize:function() {
			this.render();
		},

		render:function() {
			var globalView = new Views.ListView({odel:this.model, collection:this.model.globalList,id:'global',el:$('#global')});
			this.$el.append(globalView.render().el);

			var localView = new Views.ListView({odel:this.model, collection:this.model.localList,id:'local',el:$('#local')});
			this.$el.append(localView.render().el);

			return this;
		}
	});

	Views.ListView = Backbone.View.extend({
		tagName:'div',

		initialize:function() {
			_.bindAll(this,'modelAdded','modelRemoved','removeAllItems')
			this.collection.on('add',this.modelAdded, this);
			this.collection.on('remove',this.modelRemoved, this);
			App.on('removeAllListItems',this.removeAllItems);
			this.items = {};
		},

		render:function() {
			this.$el.append('<ul class="copyList"><li class="th">ID missing in '+this.id+'Data<span class="right" id="'+this.id+'_count"></span></li></ul>');
			return this;
		},
		modelAdded:function(model, collection, options) {
			var item = new Views.ListItem({model:model,id:model.get('type')+'_'+model.id});
			this.items[model.id] = item;
			this.$el.find('ul.copyList').append(item.render().el);
			this.$el.find('li.th span.right').html('Text count: '+options.index);
		},
		modelRemoved:function(model, collection, options) {
			item = this.items[model.id];
			item.unrender();
			this.$el.find('li.th span.right').html('Text count: '+options.index);
		},
		removeAllItems:function() {
			console.log('ListView:removeAllItems');
			if (this.collection.length > 0) {
				this.collection.remove(this.collection.toArray());
			}
		}
	});

	Views.ListItem = Backbone.View.extend({
		tagName:'li',
		className:'data',

		initialize:function() {
			_.bindAll(this,'unrender','updateCount');
			// kan inte få denna att funka
			//this.model.on('change',this.updateCount, this);
			App.on('addedLocale',this.updateCount, this);
			return this;
		},

		render:function() {
			var self = this;
			this.count = new Views.TextListItemCount({
				id:this.id+'_locale_count', model:this.model
			});
			this.$el.append(this.count.render().el);
			this.$el.append('<div class="inGroup"><strong>'+this.model.get('groupid')+'</strong></div>');
			this.$el.append('<div class="textId">'+this.model.get('id')+'</div>');

			var localeList = new Views.LocalesList({model:this.model});
			this.$el.append(localeList.render().el);

			this.$el.click(function() {
				localeList.$el.toggleClass('closed', 'open');
			});
			
			return this;
		},
		unrender:function() {
			this.$el.remove();
		}, 

		updateCount:function(model, collection, options) {
			this.count.updateCount(model);
		}
	});

	Views.TextListItemCount = Backbone.View.extend({
		tagName:'div',
		className:'right',
		initialize:function() {
			_.bindAll(this,'render','updateCount');
			App.on('addedLocale',this.updateCount, this);
			this.count = this.model.get('lang').length;
		},

		render:function() {
			this.$el.html('<strong>Language count:</strong> <span class="countLength">'+this.count+'</span>');
			
			if (this.count <= 1 && !this.$el.hasClass('hidden')) {
				this.$el.addClass('hidden');
			} else {
				this.$el.removeClass('hidden');
			}
			
			return this;
		}, 

		updateCount:function(model, collection, options) {
			this.count = this.model.get('lang').length;
			this.render();
		}
	});

	Views.LocalesList = Backbone.View.extend({
		tagName:'ul',
		className:'localesData closed',

		initialize:function() {
			App.on('addedLocale',this.updateList, this);
		},

		render:function() {
			var lang = this.model.get('lang')[this.model.get('lang').length -1];
			this.$el.append('<li>'+lang+', found in: '+this.model.get('src')+'</li>');
			return this;
		},

		updateList:function(model) {
			if (this.model == model) {
				this.render();
			}
		}
	});

    return Views;

})(App.module('ListViews'));