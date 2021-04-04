var express = require('express');
var router = express.Router();
var getConnection = require('../../config/dbinfo');

var dayjs = require('dayjs');

var bcrypt = require('bcryptjs');

var dayjs = require('dayjs');


const multer = require('multer');
var fs = require('fs');


/*router.use(function(req,res,next) {// 현재 라우터 전역으로 설정할 수 있음.
  console.log(Date.now());
  next();
});*/

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
      res.stauts(401).json({ response: { resultCode: 0, message: "관리자만 접근 가능합니다." } });
    }
  }
  else {
    res.json({ response: { resultCode: 0, message: "에러가 발생했습니다." } });
  }
};

router.use(adminCheck);

router.get('/', function(req, res, next) {
  res.render('admin/', { title: 'Express' });
});
/*router.get('/createmember' function(req,res,next) {
  
});*/

function dateformat(date, format) {
  return dayjs(date).format(format);
}

router.get('/user', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select num, student_id, id, email, name from user", function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생" } });
        console.log(err);
      }
      else {
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});

router.delete('/user/array/:numbers', adminCheck, function(req, res, next) {
  getConnection((connection) => {
    console.log(req.params);
    var arr = req.params.numbers.split(',');
    var sql = "delete from user where num in (";
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
        res.status(500).json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다." } });
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 0, message: "삭제가 완료되었습니다." } });
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});

router.get('/coupon', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select * from couponlist", function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생" } });
        console.log(err);
      }
      else {
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].create_date != null) {
            rows[i].create_date = dateformat(rows[i].create_date, "YYYY-MM-DD");
          }
          if (rows[i].expire_date != null) {
            rows[i].expire_date = dateformat(rows[i].expire_date, "YYYY-MM-DD");
          }
          if (rows[i].is_used == true) {
            rows[i].is_used = "사용";
          }
          else {
            rows[i].is_used = "미사용";
          }
        }
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});

router.get('/coupon/new', authenticateUser, adminCheck, function(req, res, next) {
  res.render('admin/coupon/new');
});
router.post('/coupon', authenticateUser, adminCheck, function(req, res, next) { //생성
  getConnection((connection) => {
    connection.query("insert into couponlist(title, description, issue_from, cou_num, expire_date) values (?, ?, ?, ?, ?)", [req.body.title, req.body.description, req.user.id, req.body.cou_num, req.body.expire_date], function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생" } });
      }
      else {
        if (rows[0] == null) {

        }
        res.json({ response: { resultCode: 1, message: "성공" } });
      }
    });
    connection.release();
  });
});


router.get('/coupon/groupuser', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select coupon.num, userid, get_from, issue_from, title, description, cou_num, is_used, expire_date, create_date from coupon right join couponlist on coupon.couponlist_num = couponlist.num", function(err, rows, fields) {
      if (err) {
        res.json({ response: { resultCode: 0, message: "db에러발생" } });
        console.log(err);
      }
      else {
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].create_date != null) {
            rows[i].create_date = dateformat(rows[i].create_date, "YYYY-MM-DD");
          }
          if (rows[i].expire_date != null) {
            rows[i].expire_date = dateformat(rows[i].expire_date, "YYYY-MM-DD");
          }
          if (rows[i].is_used == true) {
            rows[i].is_used = "사용";
          }
          else {
            rows[i].is_used = "미사용";
          }
        }
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});

router.get('/banner', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select banner.num, images.img_src from banner left join images on board = null or board = ? and board_num = banner.num order by banner.num desc", ["banner"], function(err, rows, fields) {
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
        for (var i = 0; i < rows.length; i++) { //날짜 형식 변환 과정
          if (rows[i].start_date != null) {
            rows[i].start_date = dateformat(rows[i].start_date, "YYYY-MM-DD");
          }
          if (rows[i].end_date != null) {
            rows[i].end_date = dateformat(rows[i].end_date, "YYYY-MM-DD");
          }
        }
        res.json({ response: { resultCode: 1, message: "목록을 가져오는 중에 오류가 발생하였습니다." }, result: rows });
      }
    });
    connection.release();
  });
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

const srcFolder = "/upload/banner/";
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
    res.json({ response: { resultCode: 0, message: "파일이 업로드되지 않았습니다" } });
  }
  else {
    next();
  }
};

router.post('/banner', uploadImages, saveImages, getResult, function(req, res, next) {
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("insert into banner(uploader, last_mod_date) values (?, ?) ", [req.user.id, dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 추가하는 중에 오류가 발생하였습니다." } });
        connection.release();
        connection.rollback();
      }
      else {
        res.status(200);
        if (req.file && req.body.image) {
          connection.query("insert into images(img_src, img_original, img_name, img_ext, board, board_num, last_mod_date) values (?, ?, ?, ?, ?, ?, ?)", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "banner", rows.insertId, dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).json({ response: { resultCode: 0, message: "이미지를 추가하는 중에 오류가 발생하였습니다." } });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.json({ response: { resultCode: 1, message: "성공" } });
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" } });
        }
      }
      connection.release();
    });
    //connection.release();
  });
});


router.delete('/banner/array/:numbers', function(req, res, next) {
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
    var sql = "delete from banner where num" + delet;
    connection.beginTransaction();
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 삭제하는 중에 오류가 발생하였습니다." } });
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
            res.status(500).json({ response: { resultCode: 0, message: "이미지를 삭제하는 중에 오류가 발생하였습니다." } });
            connection.release();
            connection.rollback();
          }
          else {
            connection.commit();
            res.status(200);
            res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다." } });
          }
        });
        /*} else {
          connection.commit();
          res.status(200);
          res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/banner" });
        }*/
      }
      connection.release();
    });
    //connection.release();
  });
});


router.get('/banner/:num/edit', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select banner.num, uploader, img_src, img_original from banner left join images on board = null or board = ? and board_num = banner.num where banner.num = ?", ["banner", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "정보를 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        console.log(rows);
        res.status(200);
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
      }
    });
    connection.release();
  });
});

router.get('/banner/:num', function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select banner.num, uploader, img_src from banner left join images on board = null or board = ? and board_num = banner.num where banner.num = ?", ["banner", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." } });
      }
      else {
        if (rows.length == 0) {
          res.status(400).json({ response: { resultCode: 1, message: "게시물이 없습니다" } });
        }
        else {
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
        }
      }
    });
    connection.release();
    //
  });
});

router.put('/banner/:num', uploadImages, saveImages, getResult, function(req, res, next) { //수정
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("update banner set uploader = ? where num = ?", [req.body.title, req.body.content, req.user.id, req.params.num], function(err, rows, fields) {
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
          var a = connection.query("update images set img_src = ?, img_original = ?, img_name = ?, img_ext = ?, board = ?, board_num = ? where board_num = ?", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "banner", req.params.num, req.params.num], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.stauts(500).json({ response: { resultCode: 0, message: "이미지를 수정하는 중에 오류가 발생하였습니다." }});
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

router.delete('/banner/:num', function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("delete from banner where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.stauts(500).json({ response: { resultCode: 0, message: "글을 삭제하는 중에 오류가 발생하였습니다." }});
        connection.rollback();
        connection.release();
      }
      else {
        //console.log(req.file != null && req.file != undefined && req.body.image);
        //console.log(req.body.image);
        //if (req.file && req.body.image == null) {
        console.log(true);
        var a = connection.query("delete from images where board = ? and board_num = ?", ["banner", req.params.num], function(err, rows, fields) {
          if (err) {
            console.log(err);
            res.stauts(500).json({ response: { resultCode: 0, message: "이미지를 삭제하는 중에 오류가 발생하였습니다." }});
            connection.rollback();
            connection.release();
          }
          else {
            connection.commit();
            res.status(200);
            res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다." }});
          }
        });
        //console.log(a.sql);
      }
      connection.release();
    });
    //connection.release();
  });
});

//아래서 부터 작업해야함.

router.delete('/coupon/array/:numbers', adminCheck, function(req, res, next) {
  getConnection((connection) => {
    console.log(req.params);
    var arr = req.params.numbers.split(',');
    var sql = "delete from couponlist where num in (";
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
        res.status(500).json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다."}});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다."}});
        res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/admin/coupon" });
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});

router.delete('/coupon/:num', authenticateUser, function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.query("delete from couponlist where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다."}});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다."}});
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});
router.delete('/banner/:num', authenticateUser, function(req, res, next) { //삭제
  getConnection((connection) => {
    connection.query("delete from banner where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "삭제하는 중에 오류가 발생하였습니다."}});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다."}});
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});

router.get('/user/:num/edit', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select num, student_id, id, email, name from user where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 가져오는 중에 오류가 발생하였습니다." }});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "성공"}, result: rows[0]});
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
})
router.put('/user/:num', function(req, res, next) {
  getConnection((connection) => {
    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(req.body.password, salt);
    connection.query("update user set student_id = ?, password = ?, name = ?, email = ? where num = ?", [req.body.student_id, hash, req.body.name, req.body.email, req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 수정하는 중에 오류가 발생하였습니다." }});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "수정이 완료되었습니다."}});
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
})

router.delete('/user/:num', adminCheck, function(req, res, next) { //삭제
  console.log(req.params);
  getConnection((connection) => {
    connection.query("delete from user where num=?", [req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).json({ response: { resultCode: 0, message: "글을 삭제하는 중에 오류가 발생하였습니다." }});
      }
      else {
        res.status(200);
        //console.log(rows);
        //var os = require("os");
        //var hostname = os.hostname();
        //console.log(hostname);
        //console.log(req.headers.host);
        res.json({ response: { resultCode: 1, message: "삭제가 완료되었습니다."}});
        //res.redirect("/notice");
      }
    });
    connection.release();
  });
});
module.exports = router;
