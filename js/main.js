
(function(Main) {
    
    // dependencies
    var Header = App.module('Header');
    var Lists = App.module('Lists');
    
    Main.Router = Backbone.Router.extend({
        routes: {
            "":'index',
            ':url' : 'onSource',
            ':url/:planner' : 'onPlanner',
            ':url/:planner/:locale' : 'onLocale'
        },

        onSource: function(e) {
            //console.log('site',e);
        },

        onPlanner: function(e) {
            //console.log('Planner', e); 
        },

        onLocale: function(e) {
            //console.log('Locale', e); 
        },

        index:function() {
            // start view
            var headerView = new Header.Views.HeaderView({model:new Header.Model()});
            var listsView = new Lists.Views.ListViews({model:new Lists.Model()});
        }            
    });
    
    return Main;
})(App.module('Main'));