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

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
 if (intentName == "ChangeColorIntent") {
    	handlerColorIntent(intent, session, callback)
    }else if (intentName == "ManageServerIntent") {    	
    	handlerManagementIntent(intent, session, callback)
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
    var speechOutput = "Start the request"

    var reprompt = "Do you want to hear more about this skill?"

    var header = "Get Info"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}



//Handle Color Intent Start
function handlerColorIntent(intent, session, callback) {
	var colorSlotValue = intent.slots.colorChatbot.value;	
    var speechOutput = "There is an error while executing Change Chatbot Color Skill. Please Try Again.";
    postJSON(colorSlotValue, function(data){
        if(data != "ERROR"){
            var speechOutput = data;
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
    })
}

function postJSON(colorTaget ,callback){
    var postData={
        action: colorTaget
    };
	request.post({
        uri:'http://IP:PORT/serverMgm', 
        headers:{'content-type': 'application/x-www-form-urlencoded'},
        body:require('querystring').stringify(postData)},
		function(err,httpResponse,body){ 
			var result = "Your Chatbot's Background color has been changed to " + colorTaget + " as you have just requested. Please Check your chatbot";
			if(result!= "" || result != null){
				console.log(">>>>>>>>>>>>>>"+ result);
				callback(result);
			}
	 	})
}

//Handle Color Intent End

//Handle Server Management Intent Start
function handlerManagementIntent(intent, session, callback){
	var actionSlotValue = intent.slots.actionChatbot.value;
	var speechOutput = "There is an error while executing Server Management Skill. Please Try Again.";
    postJSON2(actionSlotValue, function(data){
        if(data != "ERROR"){
            var speechOutput = data;
        }
        callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, "", true));
    })
}

function postJSON2(actionTarget, callback){
    var postData={
        action: actionTarget
    };
	request.post({
        uri:'http://IP:PORT/serverMgm', 
        headers:{'content-type': 'application/x-www-form-urlencoded'},
        body:require('querystring').stringify(postData)},
		function(err,httpResponse,body){ 
			var result = "You have just requested to " + actionTarget+ " your Chatbot Service, and it's done. Please Check Your Chatbot to check if there is any error on your service";
			if(result!= "" || result != null){
				console.log(">>>>>>>>>>>>>>"+ result);
				callback(result);
			}
	 	})
}

//Handle Server Management Intent End

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
