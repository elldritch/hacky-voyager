var graph = require('fbgraph')
  , moment = require('moment');

module.exports = {
  index: function(req, res){
    res.render('index');
  },
  dash: function(req, res, next){
    if(req.loggedIn){
      graph.setAccessToken(req.session.auth.facebook.accessToken);
      graph.get('/me/events', function(err, result){
        if(err){
          return next(err);
        }
        var upcoming_events = [];
        result.data.forEach(function(event){
          if(moment(event.start_time).isAfter()){
            upcoming_events.push(event);
          }
        });
        res.render('dash', {upcoming: upcoming_events});
      });
    }
    else{
      res.redirect('/');
    }
  },

  get_event: function(req, res){
    var user = req.user
      , event = req.body.id;
  }
};