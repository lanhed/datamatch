// module/header.js

(function(Header){

    // var views = {};
    var Views = App.module('HeaderViews');

    Header.Site = Backbone.Model.extend({});
    Header.Planner = Backbone.Model.extend({});
    Header.Locale = Backbone.Model.extend({});
    Header.Error = Backbone.Model.extend({});

    Header.Errors = Backbone.Collection.extend({
        model:Header.Error
    });
    Header.Planners = Backbone.Collection.extend({
        model:Header.Planner
    });

    Header.Sites = Backbone.Collection.extend({
        model:Header.Site
    });

    Header.Locales = Backbone.Collection.extend({
        model:Header.Locale
    });

    Header.Model = Backbone.Model.extend({

    	defaults: {
    		site: '',
    		planner: '',
    		locale: ''
    	},

    	initialize:function() {
    		this.sites = new Header.Sites([
    			{id:0,text:'localhost'},
    			{id:1,text:'www.ikea.com'},
	            {id:2,text:'preview.ikea.com'},
	            {id:3,text:'ptirw141.ikea.com'},
	            {id:4,text:'ptstag141.ikea.com'}
	        ]);

            this.planners = new Header.Planners([
	            {id:0,text:'planner_pax'},
	            {id:1,text:'planner_vika'},
	            {id:2,text:'planner_galant'},
                {id:3,text:'planner_bathroom'},
                {id:4,text:'guide_sultan'},
                {id:5,text:'guide_ledare'},
                {id:6,text:'guide_sparsam'}
	        ]);

            this.locales = new Header.Locales([
                {id:0,text:'nl_BE'},
                {id:1,text:'cs_CZ'},
                {id:2,text:'da_DK'},
	            {id:3,text:'de_DE'},
	            {id:4,text:'es_ES'},
                {id:5,text:'fr_FR'},
	            {id:6,text:'en_IE'},
	            {id:7,text:'it_IT'},
	            {id:8,text:'hu_HU'},
	            {id:9,text:'nl_NL'},
	            {id:10,text:'no_NO'},
	            {id:11,text:'de_AT'},
	            {id:12,text:'ru_RU'},
	            {id:13,text:'pl_PL'},
	            {id:14,text:'pt_PT'},
	            {id:15,text:'ro_RO'},
	            {id:16,text:'sk_SK'},
	            {id:17,text:'fi_FI'},
	            {id:18,text:'sv_SE'},
	            {id:19,text:'en_GB'},
	            {id:20,text:'en_CA'},
                {id:21,text:'en_US'},
                {id:22,text:'zh_CN'},
                {id:23,text:'en_CN'}
	        ]);

            this.errors = new Header.Errors();
    	}
    });

    

    Header.Views = Views;

    return Header;

})(App.module('Header'));