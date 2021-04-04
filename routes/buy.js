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
    connection.query("select uploader from buylist where num = ?", [req.params.num], function(err, rows, fields) {
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
    connection.query("select buylist.num as buylistnum, buylist.count, stock.num, name, description, uploader, brand, price, stock, images.img_src from buylist left join stock on stocknum = stock.num left join images on board = null or board = ? and board_num = stock.num where userid = ? order by buylist.num desc", ["stock", req.user.id], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('buy/index', { result: rows });
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

module.exports = router;
