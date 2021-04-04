var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../config/dbinfo');
var dayjs = require('dayjs');

var qrcode = require('qrcode');


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
  console.log(req.user);
  if (req.user.is_admin == true) {
    next();
  }
  else {
    res.render('er', { errmsg: "관리자만 접근 가능합니다." });
  }
}
const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select userid from coupon where num = ?", [req.params.num], function(err, rows, fields) {
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
  //console.log(req.session.passport.user);
  getConnection((connection) => {
    connection.query("select coupon.num, userid, get_from, issue_from, title, description, cou_num, is_used, expire_date, create_date from coupon join couponlist on coupon.couponlist_num = couponlist.num where userid = ?", [req.session.passport.user], function(err, rows, fields) {
      //console.log(rows);
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        console.log(req.headers.host);
        //res.render('boardview', {result: rows, divide: 'coupon'});
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].expire_date != null) {
            rows[i].expire_date = dateformat(rows[i].expire_date, "YYYY-MM-DD");
          }
        }
        res.render('coupon/index', { result: rows });
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
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        console.log(rows);
        if (rows[0] != undefined) {
          console.log(rows[0]);
          if (rows[0].userid != null && rows[0].userid != "") {
            res.status(409);
            res.render('er', { errmsg: "이미 등록된 번호입니다." });
          }
          else {
            getConnection((connection) => {
              //쿠폰 추가
              var a = connection.query('insert into coupon(couponlist_num, userid, get_from) values ( ?, ?, ? )', [rows[0].num, req.session.passport.user, "쿠폰번호 입력"], function(err, rows, fields) {
                if (err) {
                  console.log(err);
                  res.status(500);
                  res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
                }
                else {
                  res.status(200);
                  //console.log(rows.insertId);
                  res.render('redirect', { msg: "추가가 완료되었습니다.", redirectUrl: "/coupon" });
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
          res.render('er', { errmsg: "존재하지 않는 쿠폰번호입니다" });
        }
      }
    });
    connection.release();
  });
});

router.get('/:num', authenticateUser, function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select coupon.num, userid, get_from, issue_from, title, description, cou_num, is_used, expire_date, create_date from coupon join couponlist on coupon.couponlist_num = couponlist.num where userid = ? and coupon.num = ?;", [req.session.passport.user, req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        if (rows.length == 0) {
          res.status(400).render('er', { errmsg: "쿠폰이 없습니다" });
        }
        else {
          if (rows[0].cou_num) {
            qrcode.toDataURL(rows[0].cou_num, {
              errorCorrectionLevel: 'H'
            }, function(err, url) {
              if (err) { console.log(err); }
              else {
                if (rows[0].expire_date != null || rows[0].expire_date == "") {
                  if (dayjs().isAfter(dayjs(rows[0].expire_date), 'date')) {
                    res.render('confirm', { msg: "현재 선택된 쿠폰은 유효기간이 지난 쿠폰입니다. 삭제하시겠습니까?", true_form_action: "/coupon/" + rows[0].num, true_form_method: "delete", true_form_data: undefined, true_redirect: undefined, false_form_action: undefined, false_form_method: undefined, false_form_data: undefined, false_redirect: "/coupon" });
                  }
                  else {
                    res.status(200);
                    res.render('coupon/view', { result: rows[0], qrUrl: url });
                  }
                }
                else {
                  res.status(200);
                  res.render('coupon/view', { result: rows[0], qrUrl: url });
                }
              }

            });
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
        res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/coupon" });
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});
module.exports = router;
