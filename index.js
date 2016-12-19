
var express = require('express');
var app	= express();
var db = require('./db');
const crypto = require('crypto');
var mime = require('mime');

var port = process.env.PORT ||  4000;
var nunjucks = require('nunjucks');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var multer = require('multer');
var storage = multer.diskStorage({
	destination: __dirname + '/views/static/uploads',
	filename: function (req, file, cb){
		var mimeType = file.mimetype;
		var extension = mimeType.split('/');
		if(extension[1] == 'mpeg')
			extension[1] = 'mp3';
		crypto.pseudoRandomBytes(16, function(err, raw){
			cb(null, raw.toString('hex') + '.' + extension[1]);
		});
	}
});

var upload = multer({ storage: storage });
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
