var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../../config/dbinfo');
var dayjs = require('dayjs');

//const sharp = require('sharp');
const multer = require('multer');
var fs = require('fs');

const formidable = require('formidable');


const authenticateUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    //res.status(301).redirect('../users/login');
    res.json({ response: { resultCode: 0, message: "로그인이 되어 있지 않습니다." } });
  }
};
const adminCheck = (req, res, next) => {
  if (req.user != undefined) {
    if (req.user.is_admin == true) {
      next();
    }
    else {
      res.stauts(401).json({ response: { resultCode: 0, message: "관리자만 접근 가능합니다."  } });
    }
  }
  else {
    res.json({ response: { resultCode: 0, message: "에러가 발생했습니다." } });
  }
};


const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select uploader from event where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생"} });
      }
      else {
        if (req.user != undefined && (rows[0].uploader == req.user.id || req.user.is_admin == true)) {
          next();
        }
        else {
          res.json({ response: { resultCode: 0, message: "정보가 일치하지 않습니다"} });
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
  getConnection((connection) => {
    connection.query("select event.num, title, content, uploader, start_date, end_date, custom_start_date, custom_end_date, images.img_src from event left join images on board = null or board = ? and board_num = event.num order by event.num desc", ["event"], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        /*for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].start_date != null) {
            rows[i].start_date = dateformat(rows[i].start_date, "YYYY-MM-DD");
          }
          if (rows[i].end_date != null) {
            rows[i].end_date = dateformat(rows[i].end_date, "YYYY-MM-DD");
          }
        }*/
        res.json({ response: { resultCode: 0, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});


/*
const srcFolder = "/upload/event/";
//const uploadFolder = "./public/upload/event";
const uploadFolder = "./public" + srcFolder;


//일단 다시 multer로 구현해볼 예정.
//https://grokonez.com/node-js/multer/nodejs-express-upload-text-fields-multipartfile-with-multer-jquery-ajax-bootstrap-4
//https://blog.naver.com/pjt3591oo/220517017431
//https://stackoverflow.com/questions/45892610/formidable-always-returns-empty-fields-and-files-when-i-upload-a-file-in-node-js
router.post('/', authenticateUser, adminCheck, function(req, res, next) { //생성
  var fields = [];
  var fields_array = [];
  var files = [];
  var files_array = [];
  var origfiles_array = [];
  //console.log(req.body);
  var form = new formidable.IncomingForm();
  form.encoding = 'utf-8';
  form.uploadDir = uploadFolder;
  form.multiples = true;
  form.keepExtensions = true;

  var num = 0;

  form.parse(req, function(error, field, file) {
    const ext = files_array[0].replace(/(\w|-)+./, '');
    getConnection((connection) => {
      console.log(files_array);
      var img_src;
      var img_ext;
      var img_name;
      var img_original;
      if(files_array.length == 0) {
        img_src=null;
        img_ext=null;
        img_name=null;
        img_original=null;
      } else {
        img_src = srcFolder + files_array[0];
        img_ext = ext;
        img_name = files_array[0];
        img_original = origfiles_array[0];
        //srcFolder + files_array[0], origfiles_array[0], files_array[0], ext
      }
      var a = connection.query("insert into event(title, content, uploader, img_src, img_original, img_name, img_ext, start_date, end_date, custom_start_date, custom_end_date) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [field.title, field.content, req.user.id, img_src, img_original, img_name, img_ext, field.start_date, field.end_date, field.custom_start_date, field.custom_end_date], function(err, rows, fields) {
        if (err) {
          res.render('er', { errmsg: "db에러발생" });
        }
        else {
          //res.render('redirect', { msg: undefined, redirectUrl: "/event" });
          //console.log(rows.insertId);
          num = rows.insertId;
        }
        console.log(a.sql);
        connection.release();
      });
    });
  });
  form.on('field', function(field, value) {
      fields.push([field, value]);
      fields_array.push(value);
    }).on('file', function(field, file) {
      //console.log(file);
      

      const filename = file.name.replace(/\..+$/, "");
      const ext = file.name.replace(/(\w|-)+./, '');
      const newFilename = `${filename}-${Date.now()}` + '.' + ext;
      console.log("filename : " + file.name);
      if(file.name != undefined || file.name != "") {
        console.log(true);
        fs.rename(file.path, form.uploadDir + '/' + newFilename, function(err) {
          if (err) res.render('er', { errmsg: "에러발생" });
        });
        origfiles_array.push(file.name);
        files.push([field, newFilename]);
        files_array.push(newFilename);
      }
    })
    .on('end', function() {
      res.render('redirect', { msg: undefined, redirectUrl: "/event" });
    }).on('error', function(error) {
      res.render('er', { errmsg: "글 쓰는 도중에 에러 발생" });
    });
});*/



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
        //return res.send("Too many files to upload.");
        return res.json({ response: { resultCode: 0, message: "파일을 너무 많이 올렸습니다" }});
      }
    }
    else if (err) {
      return res.json({ response: { resultCode: 0, message: "파일을 올리는 중 오류가 발생했습니다." } });
    }
    next();
  });
};

const srcFolder = "/upload/event/";
const uploadFolder = "./public" + srcFolder;

const saveImages = async(req, res, next) => {
  if (!req.file) return next();

  req.body.image = null;

  const filename = req.file.originalname.replace(/\..+$/, "");
  const ext = req.file.originalname.replace(/(\w|-)+./, '');
  const newFilename = `${filename}-${Date.now()}.${ext}`;
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
    res.json({ response: { resultCode: 0, message: "파일이 업로드되지 않았습니다" }});
  }
  else {
    next();
  }
};

router.post('/', authenticateUser, adminCheck, uploadImages, saveImages, getResult, function(req, res, next) { //생성
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("insert into event(title, content, uploader, start_date, end_date, custom_start_date, custom_end_date) values (?, ?, ?, ?, ?, ?, ?) ", [req.body.title, req.body.content, req.user.id, req.body.start_date, req.body.end_date, req.body.custom_start_date, req.body.custom_end_date], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 추가하는 중에 오류가 발생하였습니다."}});
        connection.release();
        connection.rollback();
      }
      else {
        res.status(200);
        if (req.file && req.body.image) {
          connection.query("insert into images(img_src, img_original, img_name, img_ext, board, board_num) values (?, ?, ?, ?, ?, ?)", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "event", rows.insertId], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).json({ response: { resultCode: 0, message: "이미지를 추가하는 중에 오류가 발생하였습니다." }});
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.json({ response: { resultCode: 1, message: "성공" }});
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" }});
        }
      }
      connection.release();
    });
    //connection.release();
  });
});



router.delete('/array/:numbers', authenticateUser, adminCheck, function(req, res, next) {
  getConnection((connection) => {
    var arr = req.params.numbers.split(',');
    //이 부분 수정 필요. 두 sql다 num으로 들어가버려서 images 항목 삭제 안됨
    var delet = " in (";
    for (var i = 0; i < arr.length; i++) {
      if (i == arr.length - 1) {
        delet += "?);";
      }
      else {
        delet += "?,";
      }
    }
    var sql = "delete from event where num" + delet;
    connection.beginTransaction();
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 삭제하는 중에 오류가 발생하였습니다."  }});
        connection.release();
        connection.rollback();
      }
      else {
        //if (req.file && req.body.image) {
        sql = "delete from images where board_num" + delet;
        connection.query(sql, arr, function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.status(500).json({ response: { resultCode: 0, message: "이미지를 삭제하는 중에 오류가 발생하였습니다."  }});
            connection.release();
            connection.rollback();
          }
          else {
            connection.commit();
            res.status(200);
            res.json({ response: { resultCode: 1, message: "성공" }});
          }
        });
      }
      connection.release();
    });
  });
});

router.get('/:num/edit', authenticateUser, adminCheck, function(req, res, next) {
  getConnection((connection) => {
    connection.query("select event.num, title, content, start_date, custom_start_date, end_date, custom_end_date, img_src, img_original from event left join images on board = null or board = ? and board_num = event.num where event.num = ?", ["event", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "정보를 가져오는 중에 오류가 발생하였습니다." }});
      }
      else {
          if (rows[0].start_date != null) {
            rows[0].start_date = dateformat(rows[0].start_date, "YYYY-MM-DD");
          }
          if (rows[0].end_date != null) {
            rows[0].end_date = dateformat(rows[0].end_date, "YYYY-MM-DD");
          }
        res.status(200);
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0]});
      }
    });
    connection.release();
  });
});

router.put('/:num', authenticateUser, adminCheck, uploadImages, saveImages, getResult, function(req, res, next) { //수정
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("update event set title = ?, content = ?, uploader = ?, start_date = ?, custom_start_date = ?, end_date = ?, custom_end_date = ? where num = ?", [req.body.title, req.body.content, req.user.id, req.body.start_date, req.body.custom_start_date, req.body.end_date, req.body.custom_end_date, req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 수정하는 중에 오류가 발생하였습니다." }});
        connection.release();
        connection.rollback();
      }
      else {
        if (req.file && req.body.image) {
          //console.log(req.file != null && req.file != undefined && req.body.image);
          //console.log(req.body.image);
          //if (req.file && req.body.image == null) {
          var a = connection.query("update images set img_src = ?, img_original = ?, img_name = ?, img_ext = ?, board = ?, board_num = ? where board_num = ?", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "event", req.params.num, req.params.num], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).json({ response: { resultCode: 0, message: "이미지를 수정하는 중에 오류가 발생하였습니다." }});
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.json({ response: { resultCode: 1, message: "성공" }});
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" }});
        }
      }
      connection.release();
    });
    //connection.release();
  });
});

router.delete('/:num', authenticateUser, adminCheck, function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("delete from event where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.stauts(500).json({ response: { resultCode: 0, message: "글을 삭제하는 중에 오류가 발생하였습니다."}});
        connection.rollback();
        connection.release();
      }
      else {
        //console.log(req.file != null && req.file != undefined && req.body.image);
        //console.log(req.body.image);
        //if (req.file && req.body.image == null) {
        console.log(true);
        var a = connection.query("delete from images where board = ? and board_num = ?", ["event", req.params.num], function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.stauts(500).json({ response: { resultCode: 0, message: "이미지를 삭제하는 중에 오류가 발생하였습니다."}});
            connection.rollback();
            connection.release();
          }
          else {
            connection.commit();
            res.status(200);
            res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다."}});
          }
        });
        //console.log(a.sql);
      }
      connection.release();
    });
    //connection.release();
  });
});

router.get('/:num', function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select event.num, title, content, uploader, start_date, end_date, custom_start_date, custom_end_date, images.img_src from event left join images on board = null or board = ? and board_num = event.num where event.num = ?", ["event", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message:"목록을 가져오는 중에 오류가 발생하였습니다."}});
      }
      else {
        if (rows.length == 0) {
          res.status(400).json({ response: { resultCode: 0, message:"게시물이 없습니다"}});
        }
        else {
          res.status(200).json({ response: { resultCode: 1, message:"성공"}, result: rows[0]});
        }
      }
    });
    connection.release();
    //
  });
});
module.exports = router;