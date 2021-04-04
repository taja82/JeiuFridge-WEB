var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../../config/dbinfo');
var dayjs = require('dayjs');


const authenticateUser = (req, res, next) => {
  //console.log(req.user);
  if (req.isAuthenticated()) {
    next();
  }
  else {
    //res.status(301).redirect('../users/login');
    res.status(401);
    res.json({ response: { resultCode: 0, message: "로그인이 되어 있지 않습니다." } });
  }
};
const adminCheck = (req, res, next) => {
  if (req.user != undefined) {
    if (req.user.is_admin == true) {
      next();
    }
    else {
      res.status(401).json({ response: { resultCode: 0, message: "관리자만 접근 가능합니다." } });
    }
  }
  else {
    res.json({ response: { resultCode: 0, message: "에러가 발생했습니다." } });
  }
};

router.use(authenticateUser)

const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select uploader from coupont where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생" } });
      }
      else {
        if (req.user != undefined && (rows[0].uploader == req.user.id || req.user.is_admin == true)) {
          next();
        }
        else {
          res.json({ response: { resultCode: 0, message: "정보가 일치하지 않습니다" } });
        }
      }
    });
    connection.release();
  });
};

router.get('/', authenticateUser, function(req, res, next) {
  //console.log(req.session.passport.user);
  getConnection((connection) => {
    connection.query("select coupon.num, userid, get_from, issue_from, title, description, cou_num, is_used, expire_date, create_date from coupon join couponlist on coupon.couponlist_num = couponlist.num where userid = ?", [req.session.passport.user], function(err, rows, fields) {
      //console.log(rows);
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //res.render('boardview', {result: rows, divide: 'coupon'});
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});
router.post('/', authenticateUser, function(req, res, next) { //쿠폰추가(쿠폰리스트 아님)
  getConnection((connection) => {
    //쿠폰 존재 여부 확인
    var a = connection.query('select cou_num, couponlist.num as num, userid from coupon right join couponlist on couponlist.num = coupon.couponlist_num where cou_num = ?', [req.body.cou_num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        console.log(req.body.code_input);
        if (rows[0] != undefined) {
          if (rows[0].userid != null && rows[0].userid != "") {
            res.status(409);
            res.json({ response: { resultCode: 0, message: "이미 등록된 번호입니다." } });
          }
          else {
            getConnection((connection) => {
              //쿠폰 추가
              var a = connection.query('insert into coupon(couponlist_num, userid, get_from) values ( ?, ?, ? )', [rows[0].num, req.session.passport.user, "쿠폰번호 입력"], function(err, rows, fields) {
                if (err) {
                  console.log(err);
                  res.status(500);
                  res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
                }
                else {
                  res.status(200);
                  //console.log(rows.insertId);
                  res.json({ response: { resultCode: 1, message: "추가가 완료되었습니다." } });
                }
              });
              //console.log(a.sql);
              connection.release();
            });
          }
        }
        else {
          res.status(404);
          //console.log(rows.insertId);
          //res.render('redirect', { msg: "추가가 완료되었습니다.", redirectUrl: "/coupon" });
          res.json({ response: { resultCode: 0, message: "존재하지 않는 쿠폰번호입니다" } });
        }
      }
    });
    //console.log(a.sql);
    connection.release();
  });
});

router.get('/:num', authenticateUser, function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select coupon.num, userid, get_from, issue_from, title, description, cou_num, is_used, expire_date, create_date from coupon join couponlist on coupon.couponlist_num = couponlist.num where userid = ? and coupon.num = ?;", [req.session.passport.user, req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        if (rows.length == 0) {
          res.status(400).json({ response: { resultCode: 0, message: "쿠폰이 없습니다" } });
        }
        else {
          if (rows[0].expire_date != null || rows[0].expire_date == "") {
            if (dayjs().isAfter(dayjs(rows[0].expire_date), 'date')) {
              res.json({ response: { resultCode: 0, message: "현재 선택된 쿠폰은 유효기간이 지난 쿠폰입니다." } });
            }
            else {
              res.status(200);
              res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
            }
          }
          else {
            res.status(200);
            res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
          }
        }
      }
    });
    connection.release();
    //
  });
});

router.delete('/:num', authenticateUser, checkme, function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.query("delete from coupon where num=?", [req.params.num], function(err, rows, fields) {
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
        res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다." } });
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});
module.exports = router;
