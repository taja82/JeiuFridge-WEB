var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
//var connection = require('../config/dbinfo').init();
var getConnection = require('../config/dbinfo');
var bcrypt = require('bcryptjs');



passport.serializeUser(function(user, done) {
    //console.log("serializeUser ", user);
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    //console.log("de");
    //console.log("deserializeUser id ", id);
    var userinfo;
    var sql = 'SELECT * FROM user WHERE id=?';
    getConnection((connection) => {
        connection.query(sql, [id], function(err, result) {
            if (err) console.log('mysql 에러');

            //console.log("deserializeUser mysql result : ", result);
            /*var json = JSON.stringify(result[0]);
            userinfo = JSON.parse(json);*/
            var session_json = {
                student_id: result[0].student_id,
                id: result[0].id,
                email: result[0].email,
                name: result[0].name,
                is_admin: result[0].is_admin
            };
            //console.log(req.isAuthenticated())
            //done(null, userinfo);
            done(null, JSON.parse(JSON.stringify(session_json)));
        });
        connection.release();
    });
});

passport.use(new LocalStrategy({ usernameField: 'username', passwordField: 'password' }, function(username, password, done) {
    var sql = 'SELECT student_id, id, email, name, password, is_admin FROM user WHERE ID=?';
    getConnection((connection) => {
        var execSql = connection.query(sql, [username], function(err, result) {
            //console.log(result);
            if (err) {
                console.log('mysql 에러');
                return done(null, false, { message: '데이터베이스 에러입니다.' });
            }
            if (result.length != 0) {
                if (!bcrypt.compareSync(password, result[0].password)) {
                    // 입력받은 ID와 비밀번호에 일치하는 회원정보가 없는 경우   
                    //if (result.length === 0) {
                    console.log("결과 없음");
                    return done(null, false, { message: '아이디 또는 비밀번호가 일치하지 않습니다.' }); //비밀번호 일치안함
                }
                else {
                    //console.log(result);
                    /*var json = JSON.stringify(result[0]);
                    var userinfo = JSON.parse(json);*/
                    var session_json = {
                        student_id: result[0].student_id,
                        id: result[0].id,
                        email: result[0].email,
                        name: result[0].name,
                        is_admin: result[0].is_admin
                    };
                    //console.log("userinfo " + userinfo);
                    //return done(null, userinfo); // result값으로 받아진 회원정보를 return해줌
                    done(null, JSON.parse(JSON.stringify(session_json)));
                }

            }
            else {
                return done(null, false, { message: '아이디 또는 비밀번호가 일치하지 않습니다.' }); //아이디 일치안함
            }
        });
        connection.release();
    });
    //console.log(execSql.sql);
}));

module.exports = passport;
