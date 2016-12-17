
var express = require('express');
var app	= express();
var db = require('./db');

var port = process.env.PORT ||  4000;
var nunjucks = require('nunjucks');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var multer = require('multer');
var upload = multer({ dest: __dirname + '/views/static/uploads/' });
var session = require('express-session');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
	secret: 'I tsgw 337',
	resave: true,
	saveUnitialized: true
}));

app.use(flash());

app.use(express.static(__dirname + '/views/static/'));
app.set('view engine', 'nunjucks');
require(__dirname + '/app/routes.js')(app, db, upload);

nunjucks.configure('views', {
	autoescape: true,
	express: app
});

app.listen(port);
console.log("Listening on port", port);
