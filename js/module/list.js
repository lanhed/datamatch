//modules/list.js

(function(Lists){
	var Views = App.module('ListViews');

	Lists.TextObject = Backbone.Model.extend({});
	Lists.TextObjects = Backbone.Collection.extend({
        model:Lists.TextObject
    });

    Lists.TextObjectCount = Backbone.Model.extend({
		default:{
			count:0
		}
	});

    Lists.Model = Backbone.Model.extend({
    	initialize:function() {
    		_.bindAll(this, 'doIteration','onAllParseComplete','onGenericParseComplete','onParseComplete','setErrorNum','onErrorCallback','promtComplete','clearErrors');
    		
    		App.on('sites:selected', this.clearData, this);
			App.on('planners:selected', this.fetchGlobalData, this);
			App.on('locales:selected', this.fetchLocalData, this);
			App.on('clearErrors', this.clearErrors,this);

    		this.globalList = new Lists.TextObjects();
    		this.localList = new Lists.TextObjects();
    		this.globalTempList = new Lists.TextObjects();
    		this.localTempList = new Lists.TextObjects();

    		this.genericGlobalParseComplete = this.globalParseComplete = this.genericLocalParseComplete = this.localParseComplete = false;

			this.errors = this.i = 0;
			this.locales = [];
    	},
    	fetchGlobalData:function(selected) {
    		selected.locale = '';
    		this.selected = selected;
    		this.clearData('all');
			var genericPath = selected.site == 'localhost' ? 'http://localhost/datamatch/offline/planner_generic/global_data.xml' : 'http://'+selected.site+'/ms/flash/rooms_ideas/planner_generic/data/global_data.xml';
			this.getData(genericPath, { type:'globalGenericData' }, this.onGenericParseComplete, this.onErrorCallback); // this.onGenericParseComplete, this.errorCallback,

			var globalPath = selected.site == 'localhost' ? 'http://localhost/datamatch/offline/'+selected.planner+'/global_data.xml' : 'http://'+selected.site+'/ms/flash/rooms_ideas/'+selected.planner+'/data/global_data.xml';
			this.getData(globalPath, { type:'globalData' }, this.onParseComplete, this.onErrorCallback); // this.onGenericParseComplete, this.errorCallback,
    	},
    	fetchLocalData:function(selected) {
    		this.selected = selected;
    		App.trigger('errorClearLocal',this.setErrorNum);
    		this.clearData('local');
    		if (!(selected.locale instanceof Array)) {
    			this.locales = [selected.locale];
    		} else {
    			this.locales = selected.locale;
    		}

    		this.doIteration(0);
    	},
    	doIteration:function(i) {
    		this.i = i;
			locale = this.locales[this.i];

			this.localParseComplete = false;
			this.genericLocalParseComplete = false;

			var selected = this.selected;

    		var genericPath = selected.site == 'localhost' ? 'http://localhost/datamatch/offline/'+selected.planner+'/'+locale+'/rooms_ideas/planner_generic/local_data.xml' : 'http://'+selected.site+'/ms/'+locale+'/rooms_ideas/planner_generic/data/local_data.xml';
			this.getData(genericPath, { type:'localGenericData',locale:locale }, this.onGenericParseComplete, this.onErrorCallback); // this.onGenericParseComplete, this.errorCallback,

			var localPath = selected.site == 'localhost' ? 'http://localhost/datamatch/offline/'+selected.planner+'/'+locale+'/rooms_ideas/local_data.xml' : 'http://'+selected.site+'/ms/'+locale+'/rooms_ideas/'+selected.planner+'/data/local_data.xml';
			this.getData(localPath, { type:'localData',locale:locale }, this.onParseComplete, this.onErrorCallback); // this.onGenericParseComplete, this.errorCallback,
    	},
    	setErrorNum:function(num) {
    		this.errors = num;
    	},
    	onErrorCallback:function(error) {
    		this.errors++;
    		// only call doIteration once per locale,
			// if there's an unsupported locale, it'll return two errors, one genericLocalData and one localData
			var i = this.i;
			if (i + 1 < this.locales.length && error.locale == this.prevErrorLocale) {
				this.genericLocalParseComplete = this.localParseComplete = false;
				this.doIteration(i + 1);
			}

			if (i + 1 == this.locales.length && error.locale == this.prevErrorLocale) {

				var msg = 'Done';
				if (this.errors > 0) {
					msg += ' but with ' + this.errors + ' errors';
				}
				this.promtComplete(msg);
			}
			this.prevErrorLocale = error.locale;
    	},
		/* får tillbaka en lista med textobjekt */
		onGenericParseComplete:function(textList,type) {
			if (type == 'globalGenericData') {
				this.genericGlobalParseComplete = true;
				if (this.globalParseComplete) {
					App.trigger('status:changed','Done fetching globalData, waiting for your selection.')
				}

				if (this.errors > 0) {
					App.trigger('status:changed','Found error');
				}
			} else {
				this.genericLocalParseComplete = true;
			}

			if (this.genericGlobalParseComplete || (this.genericLocalParseComplete && this.localParseComplete)) {
				this.onAllParseComplete(textList,type);
			}
			
		},
		onParseComplete:function(textList,type) {
			if (type == 'globalData') {
				this.globalParseComplete = true;
				if (this.genericGlobalParseComplete) {
					App.trigger('status:changed','Done fetching globalData, waiting for your selection.')
				}
			} else {
				this.localParseComplete = true;
			}

			if (this.globalParseComplete || (this.genericLocalParseComplete && this.localParseComplete)) {
				this.onAllParseComplete(textList,type);
			}
		},
		onAllParseComplete:function(textList,type) {
			var self = this;


			if (type == 'globalData' || type == 'globalGenericData') {
				// add them to globalTexts in app
				this.globalTempList.add(textList.toArray());
			} else {
				this.localTempList.add(textList.toArray());
			}

			if (this.globalParseComplete && this.genericGlobalParseComplete && this.localParseComplete && this.genericLocalParseComplete) {
				
				// gå igenom local, matcha mot global
				_.each(this.localTempList.toArray(),function(model) {
					if (!self.globalTempList.get(model.id)) {
						if (!self.globalList.get(model.id)) {
							model.set('type',self.switchType(model.get('type')));
							self.globalList.add(model);
						} else {
							var m = self.globalList.get(model.id);
							var lang = m.get('lang');
							lang.push(self.locales[self.i]);
							m.set('lang',lang);
							App.trigger('addedLocale',m);
						}
					}
				});

				// gå igenom temp-global, matcha mot local
				_.each(this.globalTempList.toArray(),function(model) {
					if (!self.localTempList.get(model.id)) {
						if (!self.localList.get(model.id)) { 
							model.set('type',self.switchType(model.get('type')));
							model.set('lang',[self.locales[self.i]]);
							self.localList.add(model);
						} else {
							var m = self.localList.get(model.id);
							var lang = m.get('lang');
							lang.push(self.locales[self.i]);
							m.set('lang',lang);
							App.trigger('addedLocale',m);
						}
					} 
				});
				
				// ta bort temp
				this.localTempList.remove(this.localTempList.toArray());

				if (this.i + 1 < this.locales.length) {
					this.doIteration(this.i + 1);
				} else {
					var msg = 'Done';
					if (this.errors > 0) {
						msg += ' but with ' + this.errors + '  error(s)';
					}
					App.trigger('status:changed', msg);
				}
			}
		},
    	getData: function(path, ref, completeCallback, errorCallback) {
    		var self = this;
			var list = new Backbone.Collection();
			$.ajax({
				type:'GET',
				url:'xmlproxy.php?url=' + escape(path),
				success: function(response) {
					if (response) {

						App.trigger('status:changed', 'Fetching '+ref.type, ref.locale);
						response = JSON.parse(response);
						if (!response.error) {
							this.parse(response);
						} else {
							var error = {
								locale:ref.locale,
								type:ref.type,
								url:path
							};

							App.trigger('errorFound', error);
							App.trigger('status:changed','Found error');
							
							if (errorCallback)
								errorCallback(error);
						}
					}
				},
				parse: function(data) {
					var list = new Lists.TextObjects();
					$(data.textGroup).each(function(i, val) {
						
						var group = $(this["@attributes"]);
						var groupid = group[0].id;

						$(this.text).each(function() {

							var text = $(this['@attributes']);

							var textObject = new Lists.TextObject({
								id:text[0].id,
								groupid:groupid,
								lang:[ref.locale],
								src:path,
								type:ref.type
							});

							list.add(textObject);
						});
					});

					if (completeCallback) {
						completeCallback(list,ref.type);
					}
				},
				error: function (jqXHR, textStatus, errorThrown) {
					/*
					var error = new App.Error({
						type:jqXHR.responseText+' '+textStatus+' '+errorThrown,
						url:path
					});
					app.errors.addError(error);

					if (errorCallback)
					 	errorCallback(error);
					 */
				}
			});
		},
		switchType:function(type) {
			var switchedType;
			switch(type) {
				case 'localData':
					switchedType = 'globalData';
					break;
				case 'localGenericData':
					switchedType = 'globalGenericData';
					break;
				case 'globalData':
					switchedType = 'localData';
					break;
				case 'globalGenericData':
					switchedType = 'localGenericData';
					break;
				default:
					switchedType = 'unrecognized type';
			}

			return switchedType
		},
		clearData:function(option) {
			if (option === 'local') {
				// locale changed
				console.log('clear local only');
				this.localParseComplete = false;
				this.genericLocalParseComplete = false;
				this.localList.remove(this.localList.toArray());
				this.localTempList.remove(this.localTempList.toArray());
			}
			if ((typeof option) != 'string' || option === 'all') {
				// site or planner changed
				console.log('clear all');
				this.localParseComplete = false;
				this.genericLocalParseComplete = false;
				this.localList.remove(this.localList.toArray());
				this.localTempList.remove(this.localTempList.toArray());

				this.globalParseComplete = false;
				this.genericGlobalParseComplete = false;
				this.globalList.remove(this.globalList.toArray());
				this.globalTempList.remove(this.globalTempList.toArray());

			}
			App.trigger('removeAllListItems');
			/*
			console.log('Lists.model::clearData',option);
			this.localParseComplete = false;
			this.genericLocalParseComplete = false;
			this.localList.remove(this.localList.toArray());

			this.globalList.remove(this.globalList.toArray());

			if ((typeof option) != 'string' && option != 'local') {
				this.globalTempList.remove(this.globalTempList.toArray());
				this.genericGlobalParseComplete = false;
				this.genericLocalParseComplete = false;
			}
			*/
			// måste ändå ta bort locales som ligger i global list view mellan varje laddning
		},
		clearErrors:function() {
			this.errors = 0;
		},
		promtComplete:function(message) {
			App.trigger('status:changed', message);
		}
    });

    Lists.Views = Views;

    return Lists;

})(App.module('Lists'));