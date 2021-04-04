var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');
//var connection = require('../config/dbinfo').init();
var getConnection = require('../../config/dbinfo');

const nodemailer = require('nodemailer');
const transporter = require('../../config/transport');
/* GET users listing. */

router.get('/', function(req, res, next) {
  //console.log(req.session.cookie._expires);
});

router.post('/login', function(req, res, next) {
  //successRedirect: '/', failureRedirect: '/login', 옵션 빼버림ㅁ
  passport.authenticate('local', { failureFlash: true }, function(err, user, info) {
    if (err)
      return next(err);
    if (!user)
      return res.status(400).json({ response: { resultCode: 0, message: "로그인 정보가 일치하지 않습니다." } });
    req.logIn(user, function(err) {
      if (err)
        return next(err);
      if (!err) {
        //req.is_admin = true;
        console.log(req.user)
        req.user.expire = req.session.cookie._expires;
        return res.json({ response: { resultCode: 1, message: "로그인 성공." }, session: req.user });
      }
    });
  })(req, res, next);
});
router.get("/logout", function(req, res) {
  //req.session = null;
  req.logout();
  //req.session.destory();
  res.clearCookie("sid");
  res.json({ response: { resultCode: 1, message: "로그아웃 성공." }, session: req.user });
});
router.get('/register', function(req, res, next) {
  res.render('users/register');
});
router.post('/register', function(req, res, next) {
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(req.body.password, salt);
  /*var a = connection.query('insert into user(student_id, id, name, email, password) values ( ?, ?, ?, ?, ? )', [req.body.student_id, req.body.id, req.body.name, req.body.email, hash], function(err, rows, fields) {
    if (err) {
      console.log(err);
      res.status(500);
      res.send({ resultCode: 0, message: "가입하는 중에 오류가 발생했습니다" });
    }
    else {
      res.status(200);
      //console.log(rows.insertId);
      res.send({ resultCode: 1, message: "가입이 성공적으로 완료되였습니다." });
    }
  });*/
  //console.log(a.sql);
  getConnection((connection) => {
    var a = connection.query('insert into user(student_id, id, name, email, password) values ( ?, ?, ?, ?, ? )', [req.body.student_id, req.body.id, req.body.name, req.body.email, hash], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "가입하는 중에 오류가 발생했습니다" } });
      }
      else {
        res.status(200);
        //console.log(rows.insertId);
        res.json({ response: { resultCode: 1, message: "가입이 성공적으로 완료되였습니다." } });
      }
    });
    connection.release();
  });
});
router.post('/idfind', function(req, res, next) {
  getConnection((connection) => {
    var a = connection.query('select id from user where email = ? ', [req.body.email], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "아이디 찾는 중에 오류가 발생했습니다" } });
      }
      else {
        res.status(200);
        //console.log(rows.insertId);
        res.json({ response: { resultCode: 1, message: "성공" }, id:rows[0].id });
      }
    });
    connection.release();
  });
});
let pw_setting = {
  "number": true,
  "symbol": true,
  "capital": true,
  "small": true,
  "removeSimilar": false,
  "length": 8
};

function createChars() {
  let tmp = "";

  if (pw_setting.number) {
    tmp = tmp + "0123456789";
  }
  if (pw_setting.symbol) {
    tmp = tmp + "!@#$%^&*()-_=+";
  }
  if (pw_setting.capital) {
    tmp = tmp + "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  }
  if (pw_setting.small) {
    tmp = tmp + "abcdefghijklmnopqrstuvwxyz";
  }
  if (pw_setting.removeSimilar) {
    tmp = tmp.replace(/01|i|I|O/g, "");
  }

  return tmp;
}

function generate_password(password) {
  var salt = bcrypt.genSaltSync(10);
  var hash = bcrypt.hashSync(password, salt);
}
let chars = createChars();
router.post('/pwfind', function(req, res, next) {
  let password = "";
  if (req.body.id === '') {
    res.status(400);
    res.json({ response: { resultCode: 0, message: "아이디를 입력해야합니다." } });
  }
  else {
    getConnection((connection) => {
      var a = connection.query('select email, id from user where id = ?', [req.body.id], function(err, rows, fields) {
        if (err) {
          console.log(err);
          res.status(500);
          res.json({ response: { resultCode: 0, message: "이메일 존재 여부를 찾는 도중 문제가 발생하였습니다." } });
        }
        else {
          if (rows.length == 0) {
            res.status(400).json({ response: { resultCode: 0, message: "입력하신 아이디와 일치하는 정보가 없습니다." } });
          }
          else {

            const length = chars.length;
            //for(var i = 0; i<=20; i++) {테스트용 for문
            let password = "",
              tmp;
            for (let i = 0; i < pw_setting.length; i++) {
              const random = Math.floor(Math.random() * length);
              tmp = chars.charAt(random);
              password = password + tmp;
            }
            //}

            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            getConnection((connection) => {
              var a = connection.query('update user set password = ? where id = ?', [hash, rows[0].id], function(err, rowss, fields) {
                if (err) {
                  console.log(err);
                  res.status(500);
                  //res.send({ resultCode: 0, message: "Error occured while register" });
                }
                else {
                  res.status(200);
                  //console.log(rows.insertId);
                  //res.send({ resultCode: 1, message: "register complete successfully" });
                  const emailOptions = { // 옵션값 설정
                    from: 'test@gmail.com',
                    to: rows[0].email,
                    subject: '재능냉장고 임시 비밀번호입니다',
                    html: '<p>임시 비밀번호입니다. 접속 후 바꿔주시기 바랍니다.</p><p><b>' + password + '</b></p>',
                    //text: '임시 비밀번호입니다. 접속 후 바꿔주시기 바랍니다.' + 
                  };

                  transporter.sendMail(emailOptions, function(error, info) {
                    if (error) {
                      console.log(error);
                      res.status(500).json({ response: { resultCode: 0, message: "이메일을 보내는 동안 문제가 발생하였습니다." } });
                    }
                    else {
                      res.status(200).json({ response: { resultCode: 1, message: "전송완료" }, email: rows[0].email });
                    }
                  }); //전송*/
                }
              });
              connection.release();
            });
          }

        }
      });
      connection.release();
    });
  }
});
const authenticateUser = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  else {
    //res.status(301).redirect('../users/login');
    res.status(401).json({ response: { resultCode: 0, message: "로그인이 되어 있지 않습니다." } });
  }
};
/*const checkme = (req,res,next) => {
  if(authenticateUser) {
    //if(req)
    next();
  }
}*/
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

const checkme = (req, res, next) => { //수정, 삭제시 필요
  getConnection((connection) => {
    connection.query("select id from user where num = ?", [req.params.num], function(err, rows, fields) {
      if (err) {
        res.render('er', { errmsg: "db에러발생" });
      }
      else {
        if (req.user != undefined && rows[0].id == req.user.id) {
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

router.get('/authcheck', authenticateUser, function(req, res, next) {
  res.status(200);
  res.json({ response: { resultCode: 1, message: "접속 성공" }, session: req.user });
  //console.log(req.user.name);
});
router.get('/userinfo', authenticateUser, function(req, res, next) {
  res.render('users/userinfo_form');
});
router.post('/userinfo', authenticateUser, function(req, res, next) {
  getConnection((connection) => {
    var a = connection.query('select student_id, id, email, name, password from user where id = ?', [req.session.passport.user], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "유저 정보를 보여주는데 문제가 발생하였습니다." } });
      }
      else {
        if (rows.length != 0) {
          if (!bcrypt.compareSync(req.body.password, rows[0].password)) {
            // 입력받은 ID와 비밀번호에 일치하는 회원정보가 없는 경우   
            //if (result.length === 0) {
            res.json({ response: { resultCode: 0, message: "정보가 일치하지 않습니다" } });
          }
          else {
            res.json({ response: { resultCode: 1, message: "성공." }, result: rows[0] });
          }
        }
        else {
          res.json({ response: { resultCode: 0, message: "정보가 일치하지 않습니다" } });
        }
      }
    });
    connection.release();
  });
});
router.put('/userinfo/:num', authenticateUser, function(req, res, next) {

});
router.get("/getUserInfo", authenticateUser, function(req, res, next) {
  //console.log(res.user);
  console.log(req.session);
  getConnection((connection) => {
    var a = connection.query('select student_id, id, name, is_admin from user where id = ?', [req.session.passport.user], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "유저 정보를 보여주는데 문제가 발생하였습니다." } });
      }
      else {
        if (rows.length == 0) {
          res.status(200).json({ response: { resultCode: 0, message: "아이디와 일치하는 정보가 없습니다." } });
        }
        else {
          res.status(200);
          //console.log(rows.insertId);
          res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
        }

      }
    });
    connection.release();
  });

  //console.log(a.sql);
});

router.get("/check/:username", function(req, res, next) {
  getConnection((connection) => {
    var a = connection.query('select id from user where id = ?', [req.params.username], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "유저 정보를 보여주는데 문제가 발생하였습니다." } });
      }
      else {
        if (rows.length == 0) {
          res.status(200).json({ response: { resultCode: 0, message: "이 아이디는 사용가능합니다." }, params: req.params, result: rows[0] });
        }
        else {
          res.status(500).json({ response: { resultCode: 0, message: "이미 같은 아이디가 존재합니다." } });
        }
      }
    });
    connection.release();
  });
  //console.log(a.sql);
});

router.get("/:username", authenticateUser, adminCheck, function(req, res, next) {
  //console.log(req.user);
  //console.log(req.params);
  getConnection((connection) => {
    var a = connection.query('select student_id, id, name, is_admin from user where id = ?', [req.params.username], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "유저 정보를 보여주는데 문제가 발생하였습니다." } });
      }
      else {
        if (rows.length == 0) {
          res.status(200).json({ response: { resultCode: 0, message: "유저 정보를 보여주는데 문제가 발생하였습니다." } });
        }
        else {
          res.status(200);
          res.json({ response: { resultCode: 1, message: "성공" }, result: rows[0] });
        }
      }
    });
    connection.release();
  });
  //console.log(a.sql);
});
module.exports = router;
