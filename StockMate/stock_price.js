'use strict';

var request = require("sync-request");
var cheerio = require("cheerio"); 
var url = "http://finance.daum.net/item/main.daum?code=";

exports.getPrice = function(number) {
  
  var res = request('GET', url + number);
  var body = res.getBody('utf8');
  var $ = cheerio.load(body);
  var stopPrice =  $("em.curPrice").text();
  var sisePrice =  $("span.sise").text();
  var sizeUp = $("span.sise").text() == "sise up" ? true : false;

  var result = "Stock code is "+number +" and the price is "+stopPrice+" won, whitch is " + sisePrice + " won " +(sizeUp ? "highter " : "lower ") +
  "than before."
  
  return result;
};