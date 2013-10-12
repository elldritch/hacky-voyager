var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')

  , everyauth = require('everyauth');

var app = express();

everyauth.facebook
  .appId('523413021085825')
  .appSecret('c16caf47cee6780001ef846c40d32cd7')
  // .handleAuthCallbackError(function(req, res){
  //   // If a user denies your app, Facebook will redirect the user to
  //   // /auth/facebook/callback?error_reason=user_denied&error=access_denied&error_description=The+user+denied+your+request.
  //   // This configurable route handler defines how you want to respond to
  //   // that.
  //   // If you do not configure this, everyauth renders a default fallback
  //   // view notifying the user that their authentication failed and why.
  // })
  .findOrCreateUser(function(session, accessToken, accessTokExtra, fbUserMetadata){
    // find or create user logic goes here
  })
  .redirectPath('/dash');

everyauth.facebook
  .entryPath('/auth/facebook')
  .callbackPath('/auth/facebook/callback')
  .scope('email')
  .fields('id,name,email,picture');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('falcon PAWNCH'));
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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
