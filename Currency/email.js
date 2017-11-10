var express = require('express');
var nodemailer = require('nodemailer');
var smtpPool = require('nodemailer-smtp-pool');
var config = require('./config/config.json');
var router = express.Router();
var app = express();
var bodyParser = require('body-parser'); // parser for post requests
var exec = require('child_process').exec;


var request = require('request');


var winston = require('winston'); // 로그 모듈
var winstonDaily = require('winston-daily-rotate-file'); //일별 로그 모듈


var htmlText;
var requestCode;
var requestCountry;
var requestedCurrency;

var date = new Date();
var year = date.getFullYear();
var month = date.getMonth() + 1;
var day = date.getDate();
var moment = require('moment'); // 시간처리 모듈

function timeStampFormat() {
        return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ')
}


var logger = new (winston.Logger)({
        transports: [
                new (winstonDaily)({
                                name: 'info-file',
                                filename: '/logs001/subServer',
                                datePattern: 'yyyyMMdd.log',
                                colorize: false,
                                maxsize: 50000000,
                                maxFiles: 1000,
                                level: 'info', // info이상 파일 출력
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                        }),
                new (winston.transports.Console)({
                                name: 'debug-console',
                                colorize: true,
                                level: 'debug', // debug이상 콘솔 출력
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                }),
                 new (winstonDaily)({
                                name: 'warn-file',
                                filename: '/logs001/ads/ads',
                                datePattern: 'yyyyMMdd.log',
                                colorize: false,
                                maxsize: 50000000,
                                maxFiles: 1000,
                                level: 'warn', // info이상 파일 출력
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                        }),
                new (winston.transports.Console)({
                                name: 'debug-console2',
                                colorize: true,
                                level: 'debug', // debug이상 콘솔 출력
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                })

        ],
        exceptionHandlers: [ // uncaughtException 발생시 처리
                new (winstonDaily)({
                                name: 'exception-file',
                                filename: '/logs001/errorLog/app-exception',
                                datePattern: '_yyyy-MM-dd.log',
                                colorize: false,
                                maxsize: 50000000,
                                maxFiles: 1000,
                                level: 'error',
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                }),
                new (winston.transports.Console)({
                                name: 'exception-console',
                                colorize: true,
                                level: 'debug',
                                showLevel: true,
                                json: false,
                                timestamp: timeStampFormat
                })
        ]
});


//var apiCurrency = {};

function checkDate(i){

  if(i < 10){
    if(i <= 0){
        i = 30;
     }else{
        i = "0" + i;
     }
  }
  return i;
}

function checkDateVeille(day){
  var refinedDay = day - 3;
  if(refinedDay < 10){
    if(refinedDay <= 0){
        refinedDay = 28;
     }else{
        refinedDay = "0" + refinedDay;
     }
  }
  return refinedDay;
}


function checkMonthVeille(day, oldMonth){
  var refinedDay = day - 3;

    if(refinedDay <= 0){
        oldMonth = oldMonth-1;
          if(oldMonth < 10){
                oldMonth = "0" + oldMonth;
          }
     }else{
          if(oldMonth < 10){
                oldMonth = "0" + oldMonth;
          }
     }

  return oldMonth;
}


var newDate = year+""+checkDate(month)+""+checkDate(day);
var newDateVeille = year+""+checkMonthVeille(day, month)+""+checkDateVeille(day, month);



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/sayHello', function(req, res) {

  var text = req.body.comments;
  var subject = req.body.subject;
  var email = req.body.email;
  logger.info('>>>>>>>>>>>>>>>>>>'+ text);
  if(text == 'dong'){
     requestCode = '0000035';
     requestCountry = '베트남';
     requestedCurrency = '동';
  }
  if(text == 'yen'){
     requestCode = '0000002';
     requestCountry = '일본';
     requestedCurrency = '엔';
  }
  if(text == 'euro'){
     requestCode = '0000003';
     requestCountry = '유럽';
     requestedCurrency = '유로';
  }
  if(text == 'pound'){
     requestCode = '0000012';
     requestCountry = '영국';
     requestedCurrency = 'pound';
  }
  if(text == 'yuan'){
     requestCode = '0000027';
     requestCountry = '중국';
     requestedCurrency = '위안';
  } 
  logger.info('-------------'+ requestCode +'---------------'+ requestCountry);
  var apiCurrency = {};
  request({
      url: 'http://ecos.bok.or.kr/api/StatisticSearch/JKHAKQG132Z72KGQ28HO/json/kr/1/1/036Y002/DD/'+ newDateVeille + '/'+ newDate +'/' + requestCode+ '/',
      method: 'GET'
    }, function(error, response, body){
      logger.info('test123---------'+body);
      apiCurrency = body;

      logger.info('test123---------'+apiCurrency);

         var temp = JSON.parse(apiCurrency);
           
         logger.info('>>>>>>>>temp>>>>>>>>>>'+ temp);
    var transporter = nodemailer.createTransport({
      service: 'naver',
        auth: {
          user: '유저ID',
          pass: '패스워드'
        }
    });
    
         logger.info('>>>>>>>>>>>>>>>>>>'+ year);
         logger.info('>>>>>>>>>>>>>>>>>>'+ month);
         logger.info('>>>>>>>>>>>>>>>>>>'+ day);
         logger.info('>>>>>>>>>>>>>>>>>>'+ requestedCurrency);
         htmlText = "<div class='img-box' style='width:95%; height:170px;'><img src='https://i.pinimg.com/originals/84/28/ac/8428ac93db024a72fca3adddf1310630.png' style='width:95%; height:170px;'/><h2>" + year+ "년 " + month + "월 " + day + "일 기준  환율정보</h2><h3>1달러는 " + temp.StatisticSearch.row[0].DATA_VALUE +" " + requestedCurrency + " 입니다.</h3></div>";
         logger.info('>>>>>>>>>>>htmlText>>>>>>>'+ htmlText);

    var mailOptions = {
      from: 'evermx@naver.com',
      to: 'redpolex@naver.com',
      subject: subject,
      html: '<h1>오늘의'+ requestCountry +' 환율정보</h1>' + htmlText
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        logger.info(error);
        transporter.close();
      }
      else {
        transporter.close();
      }
    });
    res.send("e-mail has been sent successfully");
  });
});
// Server start
app.post('/serverMgm', function(req, res) {

  var text = req.body.action;
  
  logger.info('>>>>>>>>>>>>>>>>>>'+ text);
    if(text == 'stop'){
       exec('/src003/nodemailer-example/stop.sh', function(err,stdout,stderr){
        		if(err){
        			logger.info('child process exited with error code ', err.code);
        			return;
        	   }
    	       logger.info(stdout);
       });  
  }else if(text == 'start'){
       exec('/src003/nodemailer-example/start.sh', function(err,stdout,stderr){
            if(err){
              logger.info('child process exited with error code ', err.code);
              return;
             }
             logger.info(stdout);
       }); 
  }

});

module.exports = app;
