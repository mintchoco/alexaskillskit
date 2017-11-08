/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills
 * nodejs skill development kit.
 * The Intent Schema, Custom Slots and Sample Utterances for this skill
 **/

'use strict';

const https = require('https');

const APP_ID = 'amzn1.ask.skill.d29b6d44-900a-4f95-a858-b930314f1e12'; // Alexa Skills ID, Hello Air

const WEBHOOKS_API = 'https://maker.ifttt.com/trigger/'
const WEBHOOKS_API_KEY = ''; // use your own key

const BREEZOMETER_API = 'https://api.breezometer.com/baqi/';
const BREEZOMETER_API_KEY = ''; // use your own KEY

const GOOGLE_MAPS_API = 'https://maps.googleapis.com/maps/api/geocode/';
const GOOGLE_MAPS_API_KEY = ''; // use your own KEY

// context object
var context = {
    username: '',
    home: '',
    address: '',
    resolvedLocation: '', // via google maps geocode api
    lat: '',
    lng: ''
}

const languageStrings = {
    SKILL_NAME: 'Air Quality',
    WELCOME_MESSAGE: 'Welcome. This is the first time for you. ',
    ASK_USERNAME: 'I would like to register your information for better service. What is your name?',
    ASK_ADDRESS: 'Where are you leaving? Please let me know your address or city name that you leave now',
    HELP_MESSAGE: 'I can give you useful information about the air quality of a particular city in Korea. You can ask me by saying, How is the air quality of Seoul? ',
    HELP_REPROMPT: 'What can I help you with?',
    STOP_MESSAGE: 'Goodbye!',
};

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `${title}`,
            content: `${output}`,
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

/**
 * Sets the home in the context and prepares the speech to reply to the user.
 */
function setHomeInContext(intent, session, callback) {
    const cardTitle = "Register your information";
    const homeSlot = intent.slots.HomeCity;
    let repromptText = '';
    let sessionAttributes = {};
    var shouldEndSession = false;
    let speechOutput = '';

    if (homeSlot) {
        const myHome = homeSlot.value;
        speechOutput = "Good. I now know your home is in " + myHome + ". Do you want to know the air quality of " + myHome + "?";
        repromptText = "You can change the city name that you are leaving by saying, I leave in Seoul";
    } else {
        speechOutput = "I'm not sure where your home is. Please try again.";
        repromptText = "I'm not sure where your home is. You can tell me your " +
            'home by saying, my home is in Seoul';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

/**
 * Sets the name in the context and prepares the speech to reply to the user.
 */
function setNameInContext(intent, session, callback) {
    const cardTitle = "Register your information";
    const nameSlot = intent.slots.Name;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';

    if (nameSlot) {
        const myName = nameSlot.value;
        speechOutput = "Hi " + myName + ". " + languageStrings['HELP_MESSAGE'];
    } else {
        speechOutput = "I'm not sure what your name is. Please try again.";
        repromptText = "I'm not sure what your name is. You can tell me your " +
            'name by saying, my name is Chris';
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    console.log('onIntent intentName' + intentName);

    // Dispatch to your skill's intent handlers
    if (intentName === 'SetHomeIntent') {
        setHomeInContext(intent, session, callback);
    } else if (intentName === 'SetNameIntent') {
        setNameInContext(intent, session, callback);
    } else if (intentName === 'AskAirQualityIntent') {
        handleRequest(intent, session, callback);
    } else if (intentName === 'TurnOnOffAirPurifierIntent') {
        handleRequest(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        // Checks the application id
        if (event.session.application.applicationId !== APP_ID) {
             callback('Invalid Application ID');
        }

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

// --------------- Functions that control the skill's behavior -----------------------
function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const shouldEndSession = false;
    var speechOutput, repromptText = '';

    if (!context.username && !context.home) {
        speechOutput = languageStrings['WELCOME_MESSAGE'] + languageStrings['ASK_USERNAME'];
        repromptText = speechOutput;
    } else {
        speechOutput = languageStrings['HELP_MESSAGE'];
        repromptText = languageStrings['HELP_REPROMPT'];
    }

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Good bye. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function handleRequest (intent, session, callback) {
    var shouldEndSession = true;
    var repromptText, speechOutput;
    
    console.log("Slots : " + intent.slots);
    
    if (intent.name === "AskAirQualityIntent") {
        const addressSlot = intent.slots.Address;

        // in case we end with this intent but location is not recognized
        if (!addressSlot.value) {
            console.log('address slot is empty');
            repromptText = "Please try again providing me with a city in Korea, for example, Seoul, Incheon, or Busan. "
                + "For which location would you like air quality information?";
            speechOutput = "I'm sorry, I didn't recognize that location. " + repromptText;
            
            shouldEndSession = false;
            callback({}, buildSpeechletResponse('Air Quality', speechOutput, repromptText, shouldEndSession));
        } else {
            // address is found
            var address = addressSlot.value;
            context.address = address;
            console.log("address : " + address);

            getAirQuality(address, function(err, speechOutput, sessionHandle) {
                if (err) {
                    // error occurred
                    if (err.message) {
                        callback({}, buildSpeechletResponse('Air Quality', err.message, null, shouldEndSession));
                    } else {
                        callback({}, buildSpeechletResponse('Air Quality', 'Sorry, the Air Quality service is experiencing a problem. Please try again later.', null, shouldEndSession));
                    }
                } else {
                    // success
                    if (sessionHandle) {
                        shouldEndSession = sessionHandle;
                    }
                    console.log("session : " + sessionHandle);
                    callback({}, buildSpeechletResponse('Air Quality', speechOutput, speechOutput, false));
                }
            });
        }
    } else if (intent.name === "TurnOnOffAirPurifierIntent") {
        const onOffSlot = intent.slots.OnOffControl;
        
        if (!onOffSlot.value) {
            console.log('on off slot is empty');
            repromptText = "Please try again providing me with a valid statement. "
                + "If you want to turn on the air purifier, you can say please turn on the air purifier.";
            speechOutput = "I'm sorry, I didn't recognize. " + repromptText;
            
            callback({}, buildSpeechletResponse('Air Quality', speechOutput, repromptText, shouldEndSession));
        } else {
            var onOff = onOffSlot.value;
            console.log("on off : " + onOff);

            turnOnOffAirPurifier(onOff, function(err, speechOutput, sessionHandle) {
                const cardTitle = 'Turn ' + (onOff === 'on' ? 'on' : 'off') + ' the Air Purifier';

                if (err) {
                    // error occurred
                    if (err.message) {
                        callback({}, buildSpeechletResponse(cardTitle, err.message, null, shouldEndSession));
                    } else {
                        callback({}, buildSpeechletResponse(cardTitle, 'Sorry, I can not control it now. Please try again later.', null, shouldEndSession));
                    }
                } else {
                    // success
                    if (sessionHandle) {
                        shouldEndSession = sessionHandle;
                    }
                    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
                }
            });
        } 
    }
}

// Turn on and off the air purifier via IFTTT Webhooks
function turnOnOffAirPurifier (onOff, callback) {
    console.log("turnOnOffAirPurifier");
    const on = (onOff === 'on' ? true : false);

    var webhooksAPI = WEBHOOKS_API + (on ? 'turn_on_air_purifier' : 'turn_off_air_purifier') + WEBHOOKS_API_KEY;

    https.get(webhooksAPI, function(res) {
        console.log(webhooksAPI);
        var speechOutput = '';

        if (res.statusCode == 200) {
            speechOutput += "Alright, " + (on ? "The air purifier will be turned on." : "The air purifier has been turned off.");
            callback(null, speechOutput);
        } else {
            callback(new Error("Sorry, Something wrong. I cannot control your air purifier. Please check your home network and try again later."));
        }
    });
}

// Get the air quality from Breezometer API. The geocode is from the Google Maps API
function getAirQuality (address, callback) {
    console.log("getAirQuality");
    var geocodeAPI = GOOGLE_MAPS_API + getGoogleMapsAPIParameters();

    // get latitude and longitude
    https.get(geocodeAPI, function(res) {
        console.log(geocodeAPI);
        var response = '';
        var shouldEndSession = true;

        if (res.statusCode != 200) {
            callback(new Error());
        }

        res.on('data', function (data) {
            response += data;
        });

        res.on('end', function () {
            var obj = JSON.parse(response);

            if (obj.status == "ZERO_RESULTS") {
                callback(new Error("Sorry! Google did not recognize that location. Please try again!"))
            } else if (obj.status == "REQUEST_DENIED"){
                callback(new Error("Sorry! There is a problem with Google Maps API."))
            } else if (obj.status == "INVALID_REQUEST"){
                callback(new Error("Address parameter is missing. Please try again!"))
            } else {
                context.resolvedLocation = obj.results[0].formatted_address;
                context.lat = obj.results[0].geometry.location.lat;
                context.lng = obj.results[0].geometry.location.lng;

                var breezometerAPI = BREEZOMETER_API + getBreezemeterAPIParameters();
                https.get(breezometerAPI, function (res) {
                    console.log(breezometerAPI);
                    var response = '';

                    if (res.statusCode != 200) {
                        callback(new Error());
                    }

                    res.on('data', function (data) {
                        response += data
                    });
                    res.on('end', function () {
                        var obj = JSON.parse(response);
                        if (obj.error) {
                            callback(new Error("Error: " + obj.error.message));
                        } else {
                            var speechOutput = '';
                            console.log(obj);
                            var airq_desc = obj.breezometer_description;
                            var country_description = obj.country_description;
                            var country = obj.country_name;
                            var country_aqi = obj.country_aqi;
                            var pm10 = obj.pollutants['pm10'].concentration;
                            var pm25 = obj.pollutants['pm25'].concentration;
                            
                            speechOutput += "The air quality index of " + country + " is " + country_aqi + ". ";
                            speechOutput += "This is " + country_description + ". ";
                            
                            speechOutput += "Inhalable particulate matter is " + pm10 + ". ";
                            speechOutput += "And Fine particulate matter is " + pm25 + ". ";
                            
                            speechOutput += "Alright. This is my recommendations for you. ";
                            
                            for (var prop in obj.random_recommendations) {
                                speechOutput += "For " + prop + ", ";
                                speechOutput += obj.random_recommendations[prop] + '... ';
                            }
                            
                            if (pm10 >= 30 || pm25 >= 30) {
                                speechOutput += "I recommend that you turn on your air purifier. Do you want?";
                                shouldEndSession = false;
                            }

                            console.log('Breezometer result : ' + speechOutput);
                            callback(null, speechOutput, shouldEndSession);
                        }
                    }).on('error', function (e) {
                        console.log("Error: " + e.message);
                        callback(new Error(e.message));
                    })
                });
            }
        }).on('error', function (e) {
            console.log("Error: " + e.message);
            callback(new Error(e.message));
        })
    })
}

// Get google maps api parameters
function getGoogleMapsAPIParameters () {
    var params = 'json';
    params += '?address=' + encodeURIComponent(context.address);
    params += '&key=' + GOOGLE_MAPS_API_KEY;
    return params;
}

// Get parameters before getting the air quality
function getBreezemeterAPIParameters () {
  var params = '?';
  params += 'lat=' + encodeURIComponent(context.lat);
  params += '&lon=' + encodeURIComponent(context.lng);
  params += '&key=' + BREEZOMETER_API_KEY;
  return params;
}
