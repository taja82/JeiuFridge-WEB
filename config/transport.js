const nodemailer = require('nodemailer');
// nodemailer Transport 생성
const transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: { // 이메일을 보낼 계정 데이터 입력
          user: '',
          pass: '',
        },
      });
      module.exports = transporter;
