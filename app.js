/**
 * Module dependencies
 */

var express = require('express'),
  routes = require('./routes'),
  api = require('./routes/api'),
  http = require('http'),
  path = require('path');

var logger = require('morgan');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');

var app = module.exports = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

const leaderboard = require('./routes/leaderboard');

/**
 * Configuration
 */

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// development only
if (app.get('env') === 'development') {
  app.use(errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
};


/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/seasons', api.seasons);
app.get('/api/seasons/:id', api.season);
app.get('/api/games/:id', api.game);

// J-Archive proxy
app.get('/media/*', require('./routes/proxy'));

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication
io.sockets.on('connection', require('./routes/socket')(io));

/**
 * Start Server
 */

// Handle graceful shutdown and save leaderboard
process.on('SIGINT', () => {
  console.log('\nSaving leaderboard and shutting down...');
  leaderboard.processNewGames();
  process.exit();
});

process.on('SIGTERM', () => {
  console.log('\nSaving leaderboard and shutting down...');
  leaderboard.processNewGames();
  process.exit(); 
});

server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});
