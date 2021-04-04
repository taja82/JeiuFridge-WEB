/*
모든(웹, api, 어플리케이션) 개발, db 설계, 디자인 대부분은 권석진이 맡았습니다.
나머지는 안하고 노느라 바쁨
*/
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');

var methodOverride = require("method-override");

//var connection = require('../config/dbinfo').init();

/*var dbconnection = require("./config/dbinfo");
dbconnection.init();
dbconnection.dbopen();*/

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var noticeRouter = require('./routes/notice');
var stockRouter = require('./routes/stock');
var eventRouter = require('./routes/event');
var couponRouter = require('./routes/coupon');
var adminRouter = require('./routes/admin');
var cartRouter = require('./routes/cart');
var buyRouter = require('./routes/buy');


var indexApiRouter = require('./routes/api/index');
var userApiRouter = require('./routes/api/users');
var noticeApiRouter = require('./routes/api/notice');
var stockApiRouter = require('./routes/api/stock');
var eventApiRouter = require('./routes/api/event');
var couponApiRouter = require('./routes/api/coupon');
var adminApiRouter = require('./routes/api/admin');
var cartApiRouter = require('./routes/api/cart');
//var buyApiRouter = require('./routes/api/buy');


var passport = require('./config/passport');
//var LocalStrategy = require('passport-local').Strategy;
var flash = require('connect-flash');

var app = express();

process.env.TZ = 'Asia/Seoul';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded
({extended : true}));
app.use(express.json());

app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    //maxAge: 30 * 24 * 60 * 60 * 1000//30일
    maxAge: 1 *  3 * 60 * 60 * 1000//3시간
  }
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next) {
  //console.log(req.session.user);
  //console.log("req.user : " + req.user);
  if(req.user) res.locals.user = req.user;
  else res.locals.user = undefined;
  if(req.query) res.locals.query = req.query;
  else res.locals.query = undefined;
  if(req.params) res.locals.param = req.params;
  else res.locals.param = undefined;
  next();
});


app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/js', express.static(__dirname + '/node_modules/moment/dist'));
app.use('/js', express.static(__dirname + '/node_modules/dayjs'));
app.use('/js', express.static(__dirname + '/node_modules/chart.js/dist'));
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap*/
app.use('/js', express.static(__dirname + '/node_modules/jsbarcode/dist'));
app.use('/js', express.static(__dirname + '/node_modules/bs-custom-file-input/dist'));
app.use('/css', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/css'));
app.use('/js', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/js'));
app.use('/webfonts', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/webfonts'));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/notice', noticeRouter);
app.use('/stock', stockRouter);
app.use('/event', eventRouter);
app.use('/coupon', couponRouter);
app.use('/admin', adminRouter);
app.use('/cart', cartRouter);
app.use('/buy', buyRouter);

app.use('/api', indexApiRouter);
app.use('/api/users',userApiRouter);
app.use('/api/notice', noticeApiRouter);
app.use('/api/stock', stockApiRouter);
app.use('/api/event', eventApiRouter);
app.use('/api/coupon', couponApiRouter);
app.use('/api/admin', adminApiRouter);
app.use('/api/cart', cartApiRouter);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
