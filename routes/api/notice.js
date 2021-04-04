//이부분만 json으로 처리하도록 함.
var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../../config/dbinfo');
var dayjs = require('dayjs');


const authenticateUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    //res.status(301).redirect('../users/login');
    res.status(401).send({ resultCode: 0, message: "로그인이 되어 있지 않습니다." });
    console.log("로그인 안됨");
  }
};
const adminCheck = (req, res, next) => {
  if (req.user.is_admin == true) {
    next();
  }
  else {
    res.status(401).send({ resultCode: 0, message: "관리자만 접근 가능합니다." });
    console.log("관리자아님");
  }
};

const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select uploader from notice where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        res.render('er', { errmsg: "db에러발생" });
      }
      else {
        if (req.user != undefined && (rows[0].uploader == req.user.id || req.user.is_admin == true)) {
          next();
        } else {
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

router.get('/', function(req, res, next) {
  var sql = "select * from notice order by num desc";
  var limit = 10;
  var page = 1;
  if (req.query.limit != null) {
    limit = req.query.limit;
  }

  if (page != null) {
    page = req.query.page;
  }
  var offset = (page - 1) * limit;
  if (req.query.page != null) {
    sql += " limit " + offset + ", " + limit;
  }
  var sql2 = ";select count(*) as total_count from notice";
  getConnection((connection) => {
    connection.query(sql + sql2, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { response: {resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } }});
      }
      else {
        res.status(200);
        /*for (var i = 0; i < rows[0].length; i++) { //날짜 형식 변환 과정
          //console.log(dayjs());
          //console.log("1." + dayjs(rows[0][i].upload_date).format("YYYY-MM-DD") + " 2." + dayjs().format("YYYY-MM-DD") + " " + dayjs().isSame(dayjs(rows[0][i].upload_date), 'date'));
          if (dayjs().isSame(dayjs(rows[0][i].upload_date), 'date')) { //오늘
            rows[0][i].upload_date = dateformat(rows[0][i].upload_date, "HH:mm:ss");
          }
          else {
            rows[0][i].upload_date = dateformat(rows[0][i].upload_date, "YYYY-MM-DD");
          }
          //rows[0][i].upload_date = dateformat(rows[0][i].upload_date, "YYYY-MM-DD HH:mm:ss");
        }*/
        res.json({ response: { resultCode: 1, message: "성공" }, query: req.query, total_count: rows[1][0].total_count, offset: offset, result: rows[0] });
      }
    });
    connection.release();
  });
});
router.post('/', authenticateUser, adminCheck, function(req, res, next) { //생성
  getConnection((connection) => {
    connection.query("insert into notice(title, content, uploader) values (?, ?, ?)", [req.body.title, req.body.content, req.user.id], function(err, rows, fields) {
      if (err) {
         res.json({ response: { resultCode:0, message:"db에러발생" }});
      }
      else {
        res.json({ response: { resultCode: 1, message: "성공" }});
      }
    });
    connection.release();
  });
});

router.get('/search/:categorie/:search', function(req, res, next) {
  var categorie = "";
  var search = "";
  if (req.params.categorie != null) {

  }
  if (req.params.search != null) {
    res.json({ response: { resultCode: 0, message: "검색 항목이 비어있습니다." } });
  }
  else {
    getConnection((connection) => {
      connection.query("select * from notice where ? = ?", [req.params.categorie, req.params.search], function(err, rows, fields) {
        if (err) {
          console.err(err);
          res.status(500).json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
        }
        else {
          res.json({ response: { resultCode: 1, message: "성공" }, params: req.params, result: rows });
        }
      });
      connection.release();
    });
  }

});


router.delete('/array/:numbers', adminCheck, function(req, res, next) {
  getConnection((connection) => {
    console.log(req.params);
    var arr = req.params.numbers.split(',');
    var sql = "delete from notice where num in (";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        sql += "?);";
      }
      else {
        sql += "?,";
      }
    }
    console.log(sql);
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제 완료" } });
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});

router.delete('/:num', function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.query("delete * from notice where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제 완료" } });
      }
    });
    connection.release();
  });
});

router.get('/:num', function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select * from notice where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {

        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        console.log(req.headers.host);
        //console.log(res.getHeader("Content-Type"));
        
        //console.log(rows.length);
        if (rows.length == 0) {
          res.status(400).json({ response: { resultCode: 0, message: "게시물이 없습니다" }, params: req.params });
        }
        else {
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" }, params: req.params, result: rows[0] });
        }
      }
    });
    connection.release();
    //
  });
});

router.get('/new', function(req, res, next) {
  res.render('notice/new', { title: 'Express' });
});
router.put('/:num', function(req, res, next) { //수정
  getConnection((connection) => {
    connection.query("update notice set title = ?, content = ?, last_update_date = CURRENT_TIMESTAMP where num = ?", [req.body.title, req.body.content, req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "수정하는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "수정이 완료되었습니다" } });
      }
    });
    connection.release();
  });
})
module.exports = router;
