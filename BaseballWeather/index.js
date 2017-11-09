'use strict';

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
   
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Hello, I am Alexa 27 years old,' + 'May i know where your team will play today';
    
    const repromptText = 'i am alexa ' + 'please check your launch voice again';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'thank you for using baseball weather skill. Have a nice day!';
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function createPlayAreaAttributes(cityName) {
    return {
        cityName,
    };
}

function createSkyAttributes(skyName) {
    return {
        skyName,
    };
}

function setPlaceInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const playAreaSlot = intent.slots.city;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';
    
    if (playAreaSlot) {
        const cityName = playAreaSlot.value;
//        sessionAttributes = createPlayAreaAttributes(cityName);
        speechOutput = `Okebari, i got it`;
        repromptText = `Okebari, i got it`;
    } else {
        speechOutput = "some confusing. Please try again.";
        repromptText = "some confusing. Please try again";
    }
 
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function isPlayingGameFromSession(intent, session, callback) {
    let cityName=intent.slots.city.value;
//    let skyName;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';

 //    if (session.attributes) {
 //       skyName = session.attributes.skyName;
 //       skyName = skyName.toLowerCase();
 //   }

 //   console.log("TJH 10 -> ${skyName}");
 
     cityName = cityName.toLowerCase();
 
    const http = require('http');
    const urlName = "http://api.openweathermap.org/data/2.5/weather?q="+cityName+"&mode=json&APPID=8bfb9804526be33703e94d03c421cc07";
 
    console.log("TJH 10 --> " + urlName);
 
     http.get(urlName, (resp) => {
            let data='';
         
         console.log("TJH 11 --> request ");  
            resp.on('data', (chunk) => {
                data += chunk;
            });
    
            resp.on('end', () => {
                console.log(data);
                
                    let convertObj = JSON.parse(data);
                    let temperature = convertObj.main.temp;
                    temperature = (temperature -32)/18;
                    temperature = parseInt(temperature);
                    let humidity = convertObj.main.humidity;
                    let wind = convertObj.wind.speed;
                    let sky = convertObj.weather[0].main;
                    
                    sky = sky.toLowerCase();
 
                    console.log("TJH 12 --> ${sky}");

    if (sky != "rain") {
        speechOutput = `Today game will be played. because weather is ${sky}`;
        shouldEndSession = true;
    } else {
        speechOutput = `Today game will be cancelled. because weather is ${sky}`;
        shouldEndSession = true;
    }

    callback(sessionAttributes,
         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));  
    
            });
        }).on("error", (err) => {
            console.log("TJH 3 --> error "); 
            console.log("Error: " + err.message);
        });
}

function getCityWeatherFromSession(intent, session, callback) {
//    const playAreaSlot = intent.slots.city;
    let cityName = intent.slots.city.value;
//    let cityName;
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    
    let tempDegreeInfo = 0;
    let humidityInfo = 0;
    let weatherInfo = '';
    let windInfo = 0;

//    if (session.attributes) {
//        cityName = session.attributes.cityName;
//    }
    cityName = cityName.toLowerCase();
    
    console.log("TJH 1 --> " + cityName);

// ask to open weather 
//    if (playAreaSlot) {
        const http = require('http');
        const urlName = "http://api.openweathermap.org/data/2.5/weather?q="+cityName+"&mode=json&APPID=8bfb9804526be33703e94d03c421cc07";
 
        console.log("TJH 1-1 --> " + urlName);
        
 //       http.get('http://api.openweathermap.org/data/2.5/weather?q=${cityName}&mode=json&APPID=8bfb9804526be33703e94d03c421cc07', (resp) => {
         http.get(urlName, (resp) => {
            let data='';
         
         console.log("TJH 2 --> request ");  
            resp.on('data', (chunk) => {
                data += chunk;
            });
            
            resp.on('end', () => {
                console.log(data);
                
                    let convertObj = JSON.parse(data);
                    let temperature = convertObj.main.temp;
                    temperature = (temperature -32)/18;
                    temperature = parseInt(temperature);
                    let humidity = convertObj.main.humidity;
                    let wind = convertObj.wind.speed;
                    let sky = convertObj.weather[0].main;
//                  tempDegreeInfo = data.main.temp.value;
//                  humidityInfo = data.main.humidity.value;
//                  weatherInfo = data.weather.main.value;
//                  windInfo = data.wind.speed.value;

 //                   const skyName = sky;
 //                   sessionAttributes = createSkyAttributes(skyName);
            
                 console.log("TJH 2 --> done "); 
//            speechOutput = `Temperature in ${cityName} is ${tempDegreeInfo} degree. humidity is ${humidityInfo} percent, wind is ${windInfo} meter and sky is ${sky}`;
               speechOutput = `Temperature in ${cityName} is ${temperature} degree. humidity is ${humidity} percent, wind is ${wind} meter, and sky is ${sky}`;
            shouldEndSession = true;
            callback(sessionAttributes, buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
 //           sessionAttributes = createPlayAreaAttributes(cityName, tempDegreeInfo, humidityInfo, weatherInfo, windInfo);
            console.log("TJH 2 --> tempDegreeInfo=${tempDegreeInfo}, humidityInfo=${humidityInfo}, weatherInfo=${weatherInfo}, windInfo=${windInfo}");
            });
        }).on("error", (err) => {
            console.log("TJH 3 --> error "); 
            console.log("Error: " + err.message);
        });
//    }
//

      console.log("TJH 4 --> out of range "); 
      
//    if (cityName) {
//        speechOutput = `Temperature in ${cityName} is ${tempDegreeInfo} degree. humidity is ${humidityInfo} percent, wind is ${windInfo} meter weatehr is ${weatherInfo}`;
//        shouldEndSession = true;
//    } else {
//        speechOutput = "some confusing. Please try again";
//    }
    
//    callback(sessionAttributes,
//         buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Events -----------------------

function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    getWelcomeResponse(callback);
}

function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    if (intentName === 'PlayAreaIntent') {
        setPlaceInSession(intent, session, callback);
    } else if (intentName === 'CityWeatherIntent') {
        getCityWeatherFromSession(intent, session, callback);
    } else if (intentName === 'PlayGameIntent') {
        isPlayingGameFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);    
}


// --------------- Main handler -----------------------

exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
