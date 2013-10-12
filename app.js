var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')

  , everyauth = require('everyauth')

  , User = require('./models').user

  , io = require('socket.io');

var app = express();

everyauth.everymodule
  .findUserById(function(id, cb){
    User.findById(id, cb);
  });

everyauth.facebook
  .appId('523413021085825')
  .appSecret('c16caf47cee6780001ef846c40d32cd7')
  .findOrCreateUser(function(session, accessToken, accessTokExtra, fbUser){
    var promise = this.Promise();
    User.find({fbid: fbUser.id}, function(err, users){
      if(err){
        return promise.fail(err);
      }
      if(users.length === 0){
        console.log(fbUser.location);
        var new_user = new User({
          fbid: fbUser.id,
          location: fbUser.location
        });
        new_user.save(function(err){
          if(err){
            return promise.fail(err);
          }
          promise.fulfill(new_user);
        });
      }
      else{
        promise.fulfill(users[0]);
      }
    });
    return promise;
  })
  .entryPath('/login')
  .redirectPath('/dash')
  .scope('user_events,friends_events,user_location');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('falcon PAWNCH'));
app.use(express.session({secret: 'Captain Falcon is pretty terrible.'}));
app.use(express.methodOverride());
app.use(require('stylus').middleware(__dirname + '/public'));
app.use(everyauth.middleware(app));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/dash', routes.dash);

app.post('/get-event', routes.dash);

var server = http.createServer(app);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);
// io.sockets.on('connection', function(socket){
//   ;
// });