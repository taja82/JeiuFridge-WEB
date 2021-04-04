var express = require('express');
var router = express.Router();

var getConnection = require('../config/dbinfo');
var dayjs = require('dayjs');


const multer = require('multer');
var fs = require('fs');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("session : " + req.session.passport);
  //console.log(req.session.passport.user);
  /*if(req.session.passport.user != undefined) {
    session = req.user
  }*/
  res.render('index/index', { title: 'Express', session: req.user, logined: req.isAuthenticated() });
});


router.get('/banner', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select banner.num, images.img_src from banner left join images on board = null or board = ? and board_num = banner.num order by banner.num desc", ["banner"], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].start_date != null) {
            rows[i].start_date = dateformat(rows[i].start_date, "YYYY-MM-DD");
          }
          if (rows[i].end_date != null) {
            rows[i].end_date = dateformat(rows[i].end_date, "YYYY-MM-DD");
          }
        }
        res.json({ result: rows });
      }
    });
    connection.release();
  });
});



function dateformat(date, format) {
  return dayjs(date).format(format);
}

router.get('/test', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select * from test order by num desc", function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].upload_date != null) {
            rows[i].upload_date = dateformat(rows[i].upload_date, "YYYY-MM-DD");
          }
        }
        res.render('test/index', { result: rows });
      }
    });
    connection.release();
  });
});

router.get('/test/new', function(req, res, next) {
  res.render('test/new');
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    //console.log(file);
    //console.log("image files");
    cb(null, true);
  }
  else {
    console.log("not image files");
    cb("Please upload only images.", false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: multerFilter,
  limits: { fileSize: 3 * 1024 * 1024 }
});

const uploadFiles = upload.single("file");

const uploadImages = (req, res, next) => {
  uploadFiles(req, res, err => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.send("Too many files to upload.");
      }
    }
    else if (err) {
      return res.send(err);
    }
    next();
  });
};

const srcFolder = "/upload/test/";
const uploadFolder = "./public" + srcFolder;

const saveImages = async(req, res, next) => {
  if (!req.file) return next();

  req.body.image = null;

  const filename = req.file.originalname.replace(/\..+$/, "");
  const ext = req.file.originalname.replace(/(\w|-)+./, '');
  const newFilename = `bezkoder-${filename}-${Date.now()}.${ext}`;
  const json = {
    //img_src: uploadFolder + newFilename,
    img_src: srcFolder + newFilename,
    img_original: req.file.originalname,
    img_name: newFilename,
    img_ext: ext
  }
  fs.writeFile(`${uploadFolder}/${newFilename}`, req.file.buffer, 'binary', function(err) {
    if (err) {
      console.log(err);
    }
  });
  req.body.image = json;

  next();
};

const getResult = async(req, res, next) => {
  if (req.file && req.body.image == null) {
    res.render('er', { errmsg: "파일이 업로드되지 않았습니다" });
  }
  else {
    next();
  }
};

router.post('/test', uploadImages, saveImages, getResult, function(req, res, next) {
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("insert into test(title, content, uploader, last_update_date) values (?, ?, ?, ?) ", [req.body.title, req.body.content, "test", dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 추가하는 중에 오류가 발생하였습니다." });
        connection.release();
        connection.rollback();
      }
      else {
        res.status(200);
        if (req.file && req.body.image) {
          connection.query("insert into images(img_src, img_original, img_name, img_ext, board, board_num, last_mod_date) values (?, ?, ?, ?, ?, ?, ?)", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "test", rows.insertId, dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).render('er', { errmsg: "이미지를 추가하는 중에 오류가 발생하였습니다." });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.render('redirect', { msg: undefined, redirectUrl: "/test" });
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.render('redirect', { msg: undefined, redirectUrl: "/test" });
        }
      }
      connection.release();
    });
    //connection.release();
  });
});

router.delete('/test/array/:numbers', function(req, res, next) {
  /*getConnection((connection) => {
    var arr = req.params.numbers.split(',');
    var table = "test";
    
    var delet = " where num in (";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        delet += "?);";
      }
      else {
        delet += "?,";
      }
    }
    var sql = "delete from " + table + delet;
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "삭제하는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/test" });
      }
    });
    connection.release();
  });*/

  getConnection((connection) => {
    var arr = req.params.numbers.split(',');

    var delet = " in (";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        delet += "?);";
      }
      else {
        delet += "?,";
      }
    }
    var sql = "delete from test where num" + delet;
    connection.beginTransaction();
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 삭제하는 중에 오류가 발생하였습니다." });
        connection.release();
        connection.rollback();
      }
      else {
        res.status(200);
        //if (req.file && req.body.image) {
        sql = "delete from images where board_num" + delet;
        connection.query(sql, arr, function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).render('er', { errmsg: "이미지를 삭제하는 중에 오류가 발생하였습니다." });
            connection.release();
            connection.rollback();
          }
          else {
            connection.commit();
            res.status(200);
            res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/test" });
          }
        });
        /*} else {
          connection.commit();
          res.status(200);
          res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/test" });
        }*/
      }
      connection.release();
    });
    //connection.release();
  });
});

router.get('/test/:num/edit', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select test.num, title, content, uploader, img_src, img_original from test left join images on board = null or board = ? and board_num = test.num where test.num = ?", ["test", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "정보를 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('test/edit', { result: rows[0] });
      }
    });
    connection.release();
  });
});

router.get('/test/:num', function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select test.num, title, content, uploader, img_src from test left join images on board = null or board = ? and board_num = test.num where test.num = ?", ["test", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        if (rows.length == 0) {
          res.status(400).render('er', { errmsg: "게시물이 없습니다" });
        }
        else {
          res.status(200);
          res.render('test/view', { result: rows[0] });
        }
      }
    });
    connection.release();
    //
  });
});


router.put('/test/:num', uploadImages, saveImages, getResult, function(req, res, next) { //수정
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("update test set title = ?, content = ?, uploader = ? where num = ?", [req.body.title, req.body.content, "test", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 수정하는 중에 오류가 발생하였습니다." });
        connection.release();
        connection.rollback();
      }
      else {
        if (req.file && req.body.image) {
          //console.log(req.file != null && req.file != undefined && req.body.image);
          //console.log(req.body.image);
          //if (req.file && req.body.image == null) {
          var a = connection.query("update images set img_src = ?, img_original = ?, img_name = ?, img_ext = ?, board = ?, board_num = ? where board_num = ?", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "test", req.params.num, req.params.num], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).render('er', { errmsg: "이미지를 수정하는 중에 오류가 발생하였습니다." });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.render('redirect', { msg: undefined, redirectUrl: "/test" });
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.render('redirect', { msg: undefined, redirectUrl: "/test" });
        }
      }
      connection.release();
    });
    //connection.release();
  });
});

router.delete('/test/:num', function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("delete from test where num = ?", [req.params.num], function(err, rows, fields) {
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
        var a = connection.query("delete from images where board = ? and board_num = ?", ["test", req.params.num], function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).render('er', { errmsg: "이미지를 삭제하는 중에 오류가 발생하였습니다." });
            connection.rollback();
            connection.release();
          }
          else {
            connection.commit();
            res.status(200);
            res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/test" });
          }
        });
        //console.log(a.sql);
      }
      connection.release();
    });
    //connection.release();
  });
});


/*router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
  function(req, res) {
    res.redirect('/home');
  });*/
module.exports = router;
