var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../config/dbinfo');

var dayjs = require('dayjs');


const authenticateUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    //res.status(301).redirect('../users/login');
    res.render('er', { errmsg: "로그인이 되어 있지 않습니다." });
  }
};
const adminCheck = (req, res, next) => {
  if (req.user != undefined) {
    if (req.user.is_admin == true) {
      next();
    }
    else {
      res.render('er', { errmsg: "관리자만 접근 가능합니다." });
    }
  }
  else {
    res.render('er', { errmsg: "로그인을 확인해주세요" });
  }
};

const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select uploader from cart where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        res.render('er', { errmsg: "db에러발생" });
      }
      else {
        if (req.user != undefined && (rows[0].uploader == req.user.id || req.user.is_admin == true)) {
          next();
        }
        else {
          res.render('er', { errmsg: "정보가 일치하지 않습니다" });
        }
      }
    });
    connection.release();
  });
};

function dateformat(date, format) {
  return dayjs(date).format(format);
}

router.get('/', authenticateUser, function(req, res, next) {
  getConnection((connection) => {
    connection.query("select cart.num as cartnum, cart.count, stock.num, name, description, uploader, brand, price, stock, images.img_src from cart left join stock on stocknum = stock.num left join images on board = null or board = ? and board_num = stock.num where userid = ? order by cart.num desc", ["stock", req.user.id], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('cart/index', { result: rows });
      }
    });
    connection.release();
  });
});

router.post('/', authenticateUser, function(req, res, next) { //생성
  getConnection((connection) => {
    connection.query("insert into cart(userid, stocknum, count) values (?, ?, ?) ", [req.user.id, req.body.stocknum, req.body.quantity], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 추가하는 중에 오류가 발생하였습니다." });
        connection.release();
      }
      else {
        res.status(200);
        res.render('redirect', { msg: "추가가 완료되었습니다.", redirectUrl: "/stock" });
      }
      connection.release();
    });
    //connection.release();
  });
});

router.put('/buy/array/:numbers', adminCheck, function(req, res, next) {
  getConnection((connection) => {
    
    var arr = req.params.numbers.split(',');
    var sql = "insert into buylist(buylist.userid, buylist.stocknum, buylist.count) select b.userid, b.stocknum, b.count from cart as b where b.num in(";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        sql += "?);";
      }
      else {
        sql += "?,";
      }
    }
    console.log(sql);
    var a = connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "추가하는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('redirect', { msg: undefined, redirectUrl: "/buy" });
      }
    });
    connection.release();
    console.log(a.sql);
  });
});



router.delete('/array/:numbers', adminCheck, function(req, res, next) {
  getConnection((connection) => {
    console.log(req.params);
    var arr = req.params.numbers.split(',');
    var sql = "delete from cart where num in (";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        sql += "?);";
      }
      else {
        sql += "?,";
      }
    }
    console.log(sql);
    var a = connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "삭제하는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/cart" });
        //res.redirect("/notice");
      }
    });
    console.log(a.sql);
    connection.release();
  });
});


router.delete('/:num', authenticateUser, adminCheck, function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("delete from stock where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 삭제하는 중에 오류가 발생하였습니다." });
        connection.rollback();
        connection.release();
      }
      else {
        //console.log(req.file != null && req.file != undefined && req.body.image);
        //console.log(req.body.image);
        //if (req.file && req.body.image == null) {
        console.log(true);
        var a = connection.query("delete from images where board = ? and board_num = ?", ["stock", req.params.num], function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).render('er', { errmsg: "이미지를 삭제하는 중에 오류가 발생하였습니다." });
            connection.rollback();
            connection.release();
          }
          else {
            connection.commit();
            res.status(200);
            res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/stock" });
          }
        });
        //console.log(a.sql);
      }
      connection.release();
    });
    //connection.release();
  });
});

module.exports = router;
