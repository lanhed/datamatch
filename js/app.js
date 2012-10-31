// app.js
window.App = {};
_.extend(App, {
	module: function() {	
		var modules = {};
		return function(name) {
			if( modules[name] ) {
				return modules[name];
			}
			return modules[name] = {};
		};
	}(),

	init: function() {
		var Main = App.module('Main');
		App.router = new Main.Router();
		Backbone.history.start();    
	}

}, Backbone.Events);


$(function() {
	App.init();
});
