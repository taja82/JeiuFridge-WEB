var express = require('express');
var router = express.Router();

var getConnection = require('../../config/dbinfo');

var dayjs = require('dayjs');

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("session : " + req.session.passport);
  //console.log(req.session.passport.user);
  /*if(req.session.passport.user != undefined) {
    session = req.user
  }*/
  res.render('index/index', { title: 'Express', session: req.user, logined: req.isAuthenticated() });

});

function dateformat(date, format) {
  return dayjs(date).format(format);
}


router.get('/banner', function(req, res, next) {
  getConnection((connection) => {
    connection.query("select banner.num, images.img_src from banner left join images on board = null or board = ? and board_num = banner.num order by banner.num desc", ["banner"], function(err, rows, fields) {
      if (err) {
        console.log(err);
        res.status(500);
        res.json({ response: { resultCode: 0, message: "목록을 가져오는 중에 오류가 발생하였습니다." }});
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
        res.json({ response: { resultCode: 1, message: "성공" }, result: rows });
      }
    });
    connection.release();
  });
});

/*router.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), // 인증 실패 시 401 리턴, {} -> 인증 스트레티지
  function(req, res) {
    res.redirect('/home');
  });*/
module.exports = router;
