// Dependencies
// -----------------------------------------------------
var express         = require('express');
var mongoose        = require('mongoose');
var port            = process.env.PORT || 3000;
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var app             = express();
var config 			= require('config')

// Express Configuration
// -----------------------------------------------------
// Sets the connection to MongoDB
mongoose.connect(config.get('Database'));

// Logging and Parsing
app.use(express.static(__dirname + '/public'));                 // sets the static files location to public
app.use('/admin',express.static(__dirname + '/admin'));         // sets the static files location to admin while accessing the admin files
app.use('/bower_components',  express.static(__dirname + '/bower_components')); // Use BowerComponents
app.use('/assets',  express.static(__dirname + '/assets'));		// Assets/Images location
app.use(morgan('dev'));                                         // log with Morgan
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.urlencoded({extended: true}));               // parse application/x-www-form-urlencoded
app.use(bodyParser.text());                                     // allows bodyParser to look at raw text
app.use(bodyParser.json({ type: 'application/vnd.api+json'}));  // parse application/vnd.api+json as json
app.use(methodOverride());

// HTML5MODE settings
// ------------------------------------------------------
// app.use('/js', express.static(__dirname + '/public/js'));
// app.use('/css', express.static(__dirname + '/public/css'));
// app.use('/html', express.static(__dirname + '/public/html'));

// Routes
// ------------------------------------------------------
require('./app/js/routes/routes.js')(app);

// app.all('/*', function(req, res, next) {
//     // Just send the index.html for other files to support HTML5Mode
//     res.sendFile('/public/index.html', { root: __dirname });
// });

// Listen
// -------------------------------------------------------
app.listen(port);
console.log('App listening on port ' + port);