var Voyage = require('../models')
  , router = require('../lib/router')

  , crypto = require('crypto')

  , gm = require('googlemaps');

// Get a unique token.
var get_token = function(callback){
  crypto.randomBytes(6, function(ex, buf) {
    callback(null, buf.toString('hex'));
  });
};

// Validate a location.
var validate_location = function(location, callback){
  gm.geocode(location, function(err, result){
    if(err){
      return callback(err, null);
    }
    if(result.status == 'ZERO_RESULTS'){
      return callback(null, false);
    }
    callback(null, true);
  });
};

module.exports = {
  index: function(req, res){
    res.render('index');
  },
  new_voyage: function(req, res){
    var message = req.session.creation_error
      , form = req.session.creation_form;
    if(message){
      delete req.session.creation_error;
      delete req.session.creation_form;
    }
    res.render('new', {
      message: message,
      form: form
    });
  },

  create_voyage: function(req, res, next){
    if(req.body.name.length === 0 || req.body['owner-name'] === 0 ||
      req.body.destination.length === 0 || req.body['owner-location'] === 0){
      req.session.creation_error = 'All fields must be completed.';
      req.session.creation_form = req.body;
      return res.redirect('/new');
    }
    gm.geocode(req.body.destination, function(err, result){
      if(err){
        return next(err);
      }
      if(result.status == 'ZERO_RESULTS'){
        req.session.creation_error = 'Event location invalid or too vague.';
        req.session.creation_form = req.body;
        return res.redirect('/new');
      }

      gm.geocode(req.body['owner-location'], function(err, result){
        if(err){
          return next(err);
        }
        // console.log(result);
        if(result.status == 'ZERO_RESULTS'){
          req.session.creation_error = 'Owner location invalid or too vague.';
          req.session.creation_form = req.body;
          return res.redirect('/new');
        }
        get_token(function(err, event_token){
          get_token(function(err, owner_token){
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

          var directions = [];
          // console.log('g', groups);
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

      get_token(function(err, new_user_token){
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
    if(req.body.name.length === 0 || req.body.location.length === 0){
      res.status(500);
      return res.send('Please enter a name and location.');
    }
    gm.geocode(req.body.location, function(err, result){
      if(err){
        return next(err);
      }
      // console.log(result);
      if(result.status == 'ZERO_RESULTS'){
        res.status(500);
        return res.send('Location invalid or too vague.');
      }
      Voyage.update({
        token: req.params.eventid,
        'users.token': req.params.userid
      }, {
        'users.$.name': req.body.name,
        'users.$.location': req.body.location,
        'users.$.driving': req.body.driving
      }, function(err){
        console.log(req.body.driving);
        if(err){
          return next(err);
        }
        res.send('Changes saved successfully.');
      });
    });
  },

  not_found: function(req, res){
    res.render('error', {
      code: 404
    });
  }
};