var express = require('express');
var router = express.Router();
//var connection = require('../config/dbinfo').init();
var getConnection = require('../config/dbinfo');

var dayjs = require('dayjs');

//const sharp = require('sharp');
const multer = require('multer');
var fs = require('fs');


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
    connection.query("select uploader from stock where num = ?", [req.params.num], function(err, rows, fields) {
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

router.get('/', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select stock.num, name, brand, price, stock, images.img_src from stock left join images on board = null or board = ? and board_num = stock.num order by stock.num desc", ["stock"], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('stock/index', { result: rows });
      }
    });
    connection.release();
  });
});

router.get('/search/:search', function(req,res,next) {
  console.log(req.params.search);
  getConnection((connection) => {
    connection.query("select stock.num, name, brand, price, stock, images.img_src from stock left join images on board = null or board = ? and board_num = stock.num where name like ? order by stock.num desc", ["stock", "%" + req.params.search + "%"], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.render('er', { errmsg: "목록을 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('stock/index', { result: rows });
      }
    });
    connection.release();
  });
});

//업로드에서 재고는 여기서 추가를 하지 않고, 나중에, 관리자 페이지에서 수정할 수 있도록 할 예정이고,
//수정부분에서도 마찬가지로 재고 수정대신, 나머지 부분, 이름, 이미지, 내용 부분을 수정할 예정.
//관리자페이지에서는 한건 수정 대신 리스트 형식으로 보이고, 한꺼번에 재고를 변경할 수 있도록 할 예정. sold out(품절) 기능도 구현할것.
router.get('/new', authenticateUser, adminCheck, function(req, res, next) {
  res.render('stock/new');
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
        //return res.send("Too many files to upload.");
        return res.render('er', { errmsg: "파일을 너무 많이 올렸습니다" });
      }
    }
    else if (err) {
      return res.send(err);
    }
    next();
  });
};

const srcFolder = "/upload/stock/";
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
    res.render('er', { errmsg: "파일이 업로드되지 않았습니다" });
  }
  else {
    next();
  }
};

router.post('/', authenticateUser, adminCheck, uploadImages, saveImages, getResult, function(req, res, next) { //생성
  getConnection((connection) => {
    connection.beginTransaction();
    connection.query("insert into stock(name, description, brand, price, stock, uploader, last_update_date) values (?, ?, ?, ?, ?, ?, ?) ", [req.body.title, req.body.content, req.body.brand, req.body.price, req.body.stock, req.user.id, dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 추가하는 중에 오류가 발생하였습니다." });
        connection.release();
        connection.rollback();
      }
      else {
        res.status(200);
        if (req.file && req.body.image) {
          connection.query("insert into images(img_src, img_original, img_name, img_ext, board, board_num, last_mod_date) values (?, ?, ?, ?, ?, ?, ?)", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "stock", rows.insertId, dayjs().format("YYYY-MM-DD HH:mm:ss")], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).render('er', { errmsg: "이미지를 추가하는 중에 오류가 발생하였습니다." });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.render('redirect', { msg: undefined, redirectUrl: "/stock" });
            }
          });
        }
        else {
          connection.commit();
          res.status(200);
          res.render('redirect', { msg: undefined, redirectUrl: "/stock" });
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
    var sql = "delete from stock where num" + delet;
    connection.beginTransaction();
    connection.query(sql, arr, function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "글을 삭제하는 중에 오류가 발생하였습니다." });
        connection.release();
        connection.rollback();
      }
      else {
        arr.unshift("stock");
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
            res.render('redirect', { msg: "삭제가 완료되었습니다.", redirectUrl: "/stock" });
          }
        });
      }
      connection.release();
    });
  });
});


router.get('/:num/edit', authenticateUser, adminCheck, function(req, res, next) {
  getConnection((connection) => {
    connection.query("select stock.num, name, description, brand, price, stock, img_src, img_original from stock left join images on board = null or board = ? and board_num = stock.num where stock.num = ?", ["stock", req.params.num], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500).render('er', { errmsg: "정보를 가져오는 중에 오류가 발생하였습니다." });
      }
      else {
        res.status(200);
        res.render('stock/edit', { result: rows[0] });
      }
    });
    connection.release();
  });
});


router.put('/:num', authenticateUser, adminCheck, uploadImages, saveImages, getResult, function(req, res, next) { //수정
console.log(req.params);
  getConnection((connection) => {
    connection.beginTransaction();
    var a = connection.query("update stock set name = ?, description = ?, brand = ?, price = ?, stock = ?, uploader = ? where num = ?", [req.body.title, req.body.content, req.body.brand, req.body.price, req.body.stock, req.user.id, req.params.num], function(err, rows, fields) {
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
          var a = connection.query("update images set img_src = ?, img_original = ?, img_name = ?, img_ext = ?, board = ?, board_num = ? where board_num = ?", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "stock", req.params.num, req.params.num], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).render('er', { errmsg: "이미지를 수정하는 중에 오류가 발생하였습니다." });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.render('redirect', { msg: undefined, redirectUrl: "/stock" });
            }
          });
        }
        else {
          connection.query("insert into images(img_src, img_original, img_name, img_ext, board, board_num) values (?, ?, ?, ?, ?, ?)", [req.body.image.img_src, req.body.image.img_original, req.body.image.img_name, req.body.image.img_ext, "event", rows.insertId], function(err, rows, fields) {
            if (err) {
              console.log(err);
              res.status(500).render('er', { errmsg: "이미지를 추가하는 중에 오류가 발생하였습니다." });
              connection.release();
              connection.rollback();
            }
            else {
              connection.commit();
              res.status(200);
              res.render('redirect', { msg: undefined, redirectUrl: "/stock" });
            }
          });
        }
      }
      connection.release();
    });
    console.log(a.sql);
    //connection.release();
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

router.get('/:num', function(req, res, next) { //1개 조회
  getConnection((connection) => {
    connection.query("select stock.num, name, description, uploader, brand, price, stock, images.img_src from stock left join images on board = null or board = ? and board_num = stock.num where stock.num = ?", ["stock", req.params.num], function(err, rows, fields) {
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
          res.render('stock/view', { result: rows[0] });
        }
      }
    });
    connection.release();
    //
  });
});

module.exports = router;
