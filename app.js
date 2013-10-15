var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')

  , stylus = require('stylus')
  , foundation = require('foundation')
  , nib = require('nib');

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: "FUCK I'M TIRED"}));
app.use(express.methodOverride());
app.use(stylus.middleware({
  src: __dirname + '/public',
  compile: function(str, path){
    return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(foundation())
      .use(nib());
  }
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.use(function(err, req, res, next){
  console.error(err);
  res.render('error', {
    code: 500
  });
});

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/new', routes.new_voyage);
app.get('/:eventid/:userid', routes.voyage);

app.post('/create', routes.create_voyage);
app.post('/:eventid/:userid/save', routes.save);
app.post('/:eventid/:userid/invite', routes.invite);

app.all('*', routes.not_found);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});