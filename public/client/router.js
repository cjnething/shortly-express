Shortly.Router = Backbone.Router.extend({
  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create',
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    console.log('Wheee')
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function(){
    console.log("In create")
    this.swapView(new Shortly.createLinkView());
  }
});
