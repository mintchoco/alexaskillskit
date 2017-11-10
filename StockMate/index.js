'use strict';

const Alexa = require('alexa-sdk');
const stockmate = require("./stockparse.js");  

var handlers = {
  "HelloIntent": function () {
    this.response.speak("Hello, StockPrice"); 
    this.emit(':responseReady');
  },
  "StockPrice": function () {
    //066570 LG 전자
    //053210 SKY LIFE
    //003550 LG
    var stockNumber = this.event.request.intent.slots.stockNumber.value;
    var stockNo = this.event.request.intent.slots.stockNo.value;
    var stockName = "Stock Name is ";
    if(stockNumber != undefined){
        if(stockNumber == 'lge'){
            this.response.speak(stockName + "LG Electronics " + stockmate.getPrice("066570"));      
        }else if(stockNumber == 'skylife'){
            this.response.speak(stockName + "SKY LIFE " + stockmate.getPrice("053210"));         
        }
    }else{
        if(stockNo != undefined){
            if(stockNo == '1'){
                this.response.speak(stockName + "LG Electronics " + stockmate.getPrice("066570")); 
            }else if(stockNo == '2'){
                this.response.speak(stockName + "SKY LIFE " + stockmate.getPrice("053210")); 
            }else if(stockNo == 1){
                this.response.speak(stockName + "LG Electronics " + stockmate.getPrice("066570")); 
            }
        }else{
            this.response.speak("Stock name is "+ stockNo+", so default stock is LG. "+stockmate.getPrice("066570"));      
        }
    }
   
    console.log("DATA~~~!!! - "+stockNumber);
    console.log("SLOTS~~~!!! - "+stockNo);
    
    
    this.emit(':responseReady');
  },
  "LaunchRequest": function () {
    this.response.speak("Welcome to trade mate. Please tell me the stock name."); 
    this.emit(':responseReady');
  }
};

exports.handler = function(event, context, callback){
  var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.execute();
};


const handlers = {
    'LaunchRequest': function () {
        this.emit('GetFact');
    },
    'GetNewFactIntent': function () {
        this.emit('GetFact');
    },
    'GetFact': function () {
        // Get a random space fact from the space facts list
        // Use this.t() to get corresponding language data
        const factArr = this.t('FACTS');
        const factIndex = Math.floor(Math.random() * factArr.length);
        const randomFact = factArr[factIndex];

        // Create speech output
        const speechOutput = this.t('GET_FACT_MESSAGE') + randomFact;
        this.emit(':tellWithCard', speechOutput, this.t('SKILL_NAME'), randomFact);
    },
    'AMAZON.HelpIntent': function () {
        const speechOutput = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
};