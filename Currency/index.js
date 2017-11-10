var request = require("request");
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request, event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "GetInfoIntent") {
        handleGetInfoIntent(intent, session, callback)
    } else if (intentName == "GetCurrencyIntent") {
    	handlerPostInfoIntent(intent, session, callback)
    } else {
         throw "Invalid intent"
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "This is an Alexa Skill that provide today's currency. Start request"

    var reprompt = "Do you want to hear more about this skill?"

    var header = "Get Info"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}

function handleGetInfoIntent(intent, session, callback) {

    var speechOutput = "There is an error";
    getJSON(function(data){
        if(data != "ERROR"){
            var speechOutput = data;
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
    })
}

function url(){
    return "http://en.wikipedia.org/w/api.php?action=query&format=json&list=search&utf8=1&srsearch=Seoul";
}

function getJSON(callback){
    request.get(url(), function(error, response, body){
        var d = JSON.parse(body);
        var result = d.query.searchinfo.totalhits
        if(result>0){
            callback(result);
        }
    })
}


function handlerPostInfoIntent(intent, session, callback) {
	var currencyTaget = intent.slots.targetCurrency.value;
    var speechOutput = "There is an error";
    postJSON(currencyTaget, function(data){
        if(data != "ERROR"){
            var speechOutput = data;
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
    })
}

function postJSON(currencyTaget, callback){

    var postData={
        comments: currencyTaget,
        subject: '오늘의 환율정보'
    };
	request.post({
        uri:'http://아이피:포트/sayHello', 
        // {json: { comments:'<div class="airportia-widget"> <iframe scrolling="no" frameborder="0" style="border:0; width: 100%; height: 95%; margin:0; padding:0;" src="https://www.airportia.com/widgets/airport/icn/arrivals"></iframe> <div style="font-family: arial,serif; font-size:12px; color:#3f9bdc; width: 100%; text-align: center; margin-top: 2px; padding-top: 5px; border-top: 1px solid #65747e;"> <a style="text-decoration:none; color:#3f9bdc;" href="https://www.airportia.com/south-korea/incheon-international-airport/arrivals" title="Seoul Incheon International Airport Arrivals" target="_top">Seoul Incheon International Airport Arrivals</a> powered by <a style="text-decoration:none; color:#3f9bdc;" href="https://www.airportia.com" target="_top">Airportia</a> </div></div>', subject:'Seoul Weather Forecast', email:'redpolex@naver.com'}}, 
        headers:{'content-type': 'application/x-www-form-urlencoded'},
        body:require('querystring').stringify(postData)},
		function(err,httpResponse,body){ 
			var result = "Today's Currency to " + currencyTaget +" has been sent. Please Check your email";
			if(result!= "" || result != null){
				console.log(">>>>>>>>>>>>>>"+ result);
				callback(result);
			}
	 	})
}

// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}
