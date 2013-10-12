var Voyage = require('../models')
  , router = require('../lib/router')

  , crypto = require('crypto');

var get_token = function(callback){
  crypto.randomBytes(6, function(ex, buf) {
    callback(buf.toString('hex'));
  });
};

module.exports = {
  index: function(req, res){
    res.render('index');
  },
  new_voyage: function(req, res){
    res.render('new');
  },

  create_voyage: function(req, res, next){
    get_token(function(event_token){
      get_token(function(owner_token){
        var voyage = new Voyage({
          name: req.body.name,
          destination: req.body.destination,
          token: event_token,
          users: [{
            token: owner_token,
            name: req.body['owner-name'],
            owner: true,
            location: req.body['owner-location']
          }]
        });
        voyage.save(function(err){
          if(err){
            return next(err);
          }
          res.redirect('/' + event_token + '/' + owner_token);
        });
      });
    });
  },
  voyage: function(req, res, next){
    Voyage.findOne({
      token: req.params.eventid,
      'users.token': req.params.userid
    }, function(err, result){
      if(err || result.length > 1){
        return next(err);
      }
      if(result.length === 0){
        return res.render('voyage-not-found');
      }
      var voyage = result
        , drivers = []
        , moochers = []
        , end = result.destination;
      // console.log(end, result, result.destination, result.name);
      voyage.users.forEach(function(user, index, array){
        if(user.token == req.params.userid){
          voyage.current_user = user;
        }

        if(user.name && user.location){
          if(user.driving){
            drivers.push(user);
          }
          else{
            moochers.push(user);
          }
        }
      });

      voyage.uri = req.headers.host;

      if(drivers.length > 0){
        return router.get_groups(drivers, moochers, end, function(err, groups){
          voyage.routing = JSON.stringify(groups);

          // console.log(groups, voyage.routing);

          var directions = [];
          groups.forEach(function(group){
            router.get_directions(group, function(err, direction){
              directions.push(direction);
              if(directions.length == groups.length){
                voyage.directions = directions;
                res.render('voyage', voyage);
              }
            });
          });
        });
      }
      res.render('voyage', voyage);
    });
  },
  invite: function(req, res, next){
    Voyage.find({
      token: req.params.eventid,
      'users.token': req.params.userid
    }, function(err, result){
      if(err || result.length > 1){
        return next(err);
      }
      var voyage = result[0];

      var owner = false;
      voyage.users.forEach(function(user){
        if(user.token == req.params.userid && user.owner){
          owner = true;
        }
      });
      if(!owner){
        return next('No invite permissions.');
      }

      get_token(function(new_user_token){
        Voyage.update({
          token: req.params.eventid
        }, {
          $push: {
            users: {
              token: new_user_token
            }
          }
        }, function(err){
          if(err){
            return next(err);
          }
          res.send('http://' + req.headers.host + '/' + req.params.eventid + '/' + new_user_token);
        });
      });
    });
  },
  save: function(req, res, next){
    Voyage.update({
      token: req.params.eventid,
      'users.token': req.params.userid
    }, {
      'users.$.name': req.body.name,
      'users.$.location': req.body.location,
      'users.$.driving': req.body.driving
    }, function(err){
      if(err){
        return next(err);
      }
      res.redirect('/' + req.params.eventid + '/' + req.params.userid);
    });
  },

  not_found: function(req, res){
    res.render('error', {
      code: 404
    });
  }
};