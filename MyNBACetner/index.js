'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


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
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome NBA Center';
    const speechOutput = 'Welcome to the Alexa NBA Center. What do you want to know by NBA center?';
    // +
    //    'Please tell me your favorite color by saying, my favorite color is red';

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'What do you want to know by NBA center?';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for using NBA center. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;
    console.log('HYO', 'END');
    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}


// ------------------------ NBA Scoreboard behavior ---------------------------
function getOnedayBeforeDate(date) {
    var selectDate = date.split("-");
    var changeDate = new Date();
    changeDate.setFullYear(selectDate[0], selectDate[1]-1, selectDate[2]-1);
    
    var y = changeDate.getFullYear();
    var m = changeDate.getMonth() + 1;
    var d = changeDate.getDate();
    if(m < 10)    { m = "0" + m; }
    if(d < 10)    { d = "0" + d; }
    
    var resultDate = y + "-" + m + "-" + d;
    return resultDate;
}

function getNBAScoreboardResText(scoreboardJSONdata) {
    console.log('HYO', 'here');
    console.log('HYO', scoreboardJSONdata);
    let returnStr = 'The latest data by NBA center is NBA Scores of ';

    for (var i = 0; i < scoreboardJSONdata.scoreboard.gameScore.length; i++) {
        if (scoreboardJSONdata.scoreboard.gameScore[i].isUnplayed === 'true') {
            console.log('HYO' + 'xcvxcv');
            return 'notReady';
        }

        if (i === 0) {
            returnStr += scoreboardJSONdata.scoreboard.gameScore[i].game.date + '.';
        }

        returnStr += ' Game number ' + (i + 1) + '.'
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.awayTeam.City
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.awayTeam.Name
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].awayScore + ' points.'
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.homeTeam.City
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.homeTeam.Name
            + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].homeScore + ' points.';

        if (Number(scoreboardJSONdata.scoreboard.gameScore[i].awayScore) > Number(scoreboardJSONdata.scoreboard.gameScore[i].homeScore)) {
            returnStr += ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.awayTeam.City
                + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.awayTeam.Name;
        } else {
            returnStr += ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.homeTeam.City
                + ' ' + scoreboardJSONdata.scoreboard.gameScore[i].game.homeTeam.Name;
        }

        returnStr += ' wins the game.';
    }

    return returnStr;
}

function getNBAScoreboard(intent, session, callback, targetDate) {
    let d = new Date();

    if (!targetDate) {
        //targetDate =  getOnedayBeforeDate(d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2));
        targetDate =  d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }

    console.log('HYO', 'targetDate : ' + targetDate);

    let repromptText = '';
    let speechOutput = '';
    let sessionAttributes = {};
    let apiPath = '/api/feed/pull/nba/2017-2018-regular/scoreboard.json?fordate=' + targetDate.replace(/-/gi, '');

    const httpTransport = require('https');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'www.mysportsfeeds.com',
        port: '443',
        path: apiPath,
        method: 'GET',
        headers: {"Authorization":"Basic " + Buffer.from('hjlee5217:go30938!@').toString('base64')}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;

    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';
        
        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;            
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ? 
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;

            console.log('HYO', responseStr);

            if (responseStr === '') {
                targetDate =  getOnedayBeforeDate(targetDate);
                getNBAScoreboard(intent, session, callback, targetDate);
            } else {
                let scoreboardStr = getNBAScoreboardResText(JSON.parse(responseStr));

                if (scoreboardStr === 'notReady') {
                    targetDate =  getOnedayBeforeDate(targetDate);
                    getNBAScoreboard(intent, session, callback, targetDate);
                } else{
                    callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, scoreboardStr, 'What do you want to know by NBA center', false));    
                }
            }
            
        });
        
    })
    .setTimeout(0)
    .on('error', (error) => {
        console.log("HYO", "error : " + error);
    });
    request.write("");
    request.end();

}

// ------------------------ NBA Standing behavior --------------------------
function getNBAStandingResText(standingTypeVal, standingJSONdata) {
    let returnStr = 'Standing of ' + standingTypeVal + '.';

    console.log('HYO', 'standing type : ' + standingTypeVal);

    if (standingTypeVal == 'nba') {
        for (var i = 0; i < standingJSONdata.overallteamstandings.teamstandingsentry.length; i++) {
            returnStr += ' Rank ' + (i + 1) + ' is ' 
                + standingJSONdata.overallteamstandings.teamstandingsentry[i].team.City 
                + ' ' + standingJSONdata.overallteamstandings.teamstandingsentry[i].team.Name
                + '.';
        }
    } else if (standingTypeVal == 'eastern conference' || standingTypeVal == 'western conference') {
        var confIndex;
        if (standingTypeVal == 'eastern conference') {
            confIndex = 0;
        } else {
            confIndex = 1;
        }
        for (var i = 0; i < standingJSONdata.conferenceteamstandings.conference[confIndex].teamentry.length; i++) {
            returnStr += ' Rank ' + (i + 1) + ' is ' 
                + standingJSONdata.conferenceteamstandings.conference[confIndex].teamentry[i].team.City 
                + ' ' + standingJSONdata.conferenceteamstandings.conference[confIndex].teamentry[i].team.Name
                + '.';
        }
    } else if (standingTypeVal == 'eastern atlantic division'
                || standingTypeVal == 'eastern central division'
                || standingTypeVal == 'eastern southeast division'
                || standingTypeVal == 'western northwest division'
                || standingTypeVal == 'western pacific division'
                || standingTypeVal == 'western southwest division') {

        var divIndex;
        if (standingTypeVal == 'eastern atlantic division') {
            console.log('HYO', 'AAAAAAAAA');
            divIndex = 0;
        } else if (standingTypeVal == 'eastern central division') {
            console.log('HYO', 'BBBBBBBBB');
            divIndex = 1;
        } else if (standingTypeVal == 'eastern southeast division') {
            console.log('HYO', 'CCCCCCCCC');
            divIndex = 2;
        } else if (standingTypeVal == 'western northwest division') {
            console.log('HYO', 'DDDDDDDDD');
            divIndex = 3;
        } else if (standingTypeVal == 'western pacific division') {
            console.log('HYO', 'EEEEEEEEE');
            divIndex = 4;
        } else if (standingTypeVal == 'western southwest division') {
            console.log('HYO', 'FFFFFFFFF');
            divIndex = 5;
        }

        for (var i = 0; i < standingJSONdata.divisionteamstandings.division[divIndex].teamentry.length; i++) {
            returnStr += ' Rank ' + (i + 1) + ' is ' 
                + standingJSONdata.divisionteamstandings.division[divIndex].teamentry[i].team.City 
                + ' ' + standingJSONdata.divisionteamstandings.division[divIndex].teamentry[i].team.Name
                + '.';
        }
    }

    console.log('HYO', 'return str : ' + returnStr);

    return returnStr;
}

function getNBAStanding(intent, session, callback) {
    let repromptText = '';
    let speechOutput = '';
    let sessionAttributes = {};

    if (intent.slots.nbaStandingSlot) {
        let standingTypeVal = intent.slots.nbaStandingSlot.value;
        let apiPath;

        if (standingTypeVal == 'league' || standingTypeVal === undefined) {
            standingTypeVal = 'nba';
            apiPath = '/api/feed/pull/nba/2017-2018-regular/overall_team_standings.json?teamstats=W,L,PTS,PTSA';
        } else if (standingTypeVal == 'eastern conference' || standingTypeVal == 'western conference') {
            console.log('HYO', '2');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/conference_team_standings.json?teamstats=W,L,PTS,PTSA';
        } else {
            console.log('HYO', '3');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/division_team_standings.json?teamstats=W,L,PTS,PTSA';
        }

        const httpTransport = require('https');
        const responseEncoding = 'utf8';
        const httpOptions = {
            hostname: 'www.mysportsfeeds.com',
            port: '443',
            path: apiPath,
            method: 'GET',
            headers: {"Authorization":"Basic " + Buffer.from('hjlee5217:go30938!@').toString('base64')}
        };
        httpOptions.headers['User-Agent'] = 'node ' + process.version;
     
        const request = httpTransport.request(httpOptions, (res) => {
            let responseBufs = [];
            let responseStr = '';
            
            res.on('data', (chunk) => {
                if (Buffer.isBuffer(chunk)) {
                    responseBufs.push(chunk);
                }
                else {
                    responseStr = responseStr + chunk;            
                }
            }).on('end', () => {
                responseStr = responseBufs.length > 0 ? 
                    Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;

                console.log('HYO', responseStr);
                let standingStr = getNBAStandingResText(standingTypeVal, JSON.parse(responseStr));

                callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, standingStr, 'What do you want to know by NBA center', false));
            });
            
        })
        .setTimeout(0)
        .on('error', (error) => {
            console.log("HYO", "error : " + error);
        });
        request.write("");
        request.end();

    } else{
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, 'I do not understand what you are takling.' , 'What do you want to know by NBA center', false));
    }   
    
}

// -------------------- NBA League leader ---------------------------------
function getNBALeagueLeaderResText(leagueLeaderSlotValue, leagueLeaderJSONdata) {
    let returnStr = 'NBA League leader of ' + leagueLeaderSlotValue + '.';
    console.log('HYO', leagueLeaderJSONdata);
    
    for (var i = 0; i < leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry.length; i++) {
        if (i == 0) {
            returnStr += ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].player.FirstName
                + ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].player.LastName
                + ' of ' +  leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].team.City
                + ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].team.Name
                + ' is leading ' + leagueLeaderSlotValue;

            if (leagueLeaderSlotValue == 'points') {
                returnStr += ' by ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.PtsPerGame.valtext;
            } else if (leagueLeaderSlotValue == 'assists') {
                returnStr += ' by ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.AstPerGame.valtext;
            } else if (leagueLeaderSlotValue == 'rebounds') {
                returnStr += ' by ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.RebPerGame.valtext;
            } else if (leagueLeaderSlotValue == 'blocks') {
                returnStr += ' by ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.BlkPerGame.valtext;
            } else if (leagueLeaderSlotValue == 'steals') {
                returnStr += ' by ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.StlPerGame.valtext;
            }

            returnStr += ' ' + leagueLeaderSlotValue
                + ' in ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].stats.GamesPlayed.valtext
                + ' games.';
        } else {
            returnStr += ' Rank ' + (i + 1) + ' is'
                + ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].player.FirstName
                + ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].player.LastName
                + ' of ' +  leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].team.City
                + ' ' + leagueLeaderJSONdata.cumulativeplayerstats.playerstatsentry[i].team.Name
                + '.';
        }
    }

    return returnStr;
}

function getNBALeaguLeader(intent, session, callback) {
    let repromptText = '';
    let speechOutput = '';
    let sessionAttributes = {};

    if (intent.slots.nbaStatSlot) {
        let leagueLeaderSlotValue = intent.slots.nbaStatSlot.value;
        console.log('HYO', leagueLeaderSlotValue);
        let apiPath;

        if (leagueLeaderSlotValue == 'points') {
            console.log('HYO', '111');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/cumulative_player_stats.json?sort=stats.PTS/G.D&playerstats=PTS/G&limit=5';
        } else if (leagueLeaderSlotValue == 'assists') {
            console.log('HYO', '222');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/cumulative_player_stats.json?sort=stats.AST/G.D&limit=5&playerstats=AST/G';
        } else if (leagueLeaderSlotValue == 'rebounds') {
            console.log('HYO', '333');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/cumulative_player_stats.json?sort=stats.REB/G.D&limit=5&playerstats=REB/G';
        } else if (leagueLeaderSlotValue == 'blocks') {
            console.log('HYO', '444');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/cumulative_player_stats.json?sort=stats.BS/G.D&limit=5&playerstats=BS/G';
        } else if (leagueLeaderSlotValue == 'steals') {
            console.log('HYO', '555');
            apiPath = '/api/feed/pull/nba/2017-2018-regular/cumulative_player_stats.json?sort=stats.STL/G.D&limit=5&playerstats=STL/G';
        }  

        const httpTransport = require('https');
        const responseEncoding = 'utf8';
        const httpOptions = {
            hostname: 'www.mysportsfeeds.com',
            port: '443',
            path: apiPath,
            method: 'GET',
            headers: {"Authorization":"Basic " + Buffer.from('hjlee5217:go30938!@').toString('base64')}
        };
        httpOptions.headers['User-Agent'] = 'node ' + process.version;
     
        const request = httpTransport.request(httpOptions, (res) => {
            let responseBufs = [];
            let responseStr = '';
            
            res.on('data', (chunk) => {
                if (Buffer.isBuffer(chunk)) {
                    responseBufs.push(chunk);
                }
                else {
                    responseStr = responseStr + chunk;            
                }
            }).on('end', () => {
                responseStr = responseBufs.length > 0 ? 
                    Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;

                responseStr = responseStr.replace(/#/gi, 'val');
                let leagueLeaderStr = getNBALeagueLeaderResText(leagueLeaderSlotValue, JSON.parse(responseStr));
                
                callback(sessionAttributes,
                    buildSpeechletResponse(intent.name, leagueLeaderStr, 'What do you want to know by NBA center', false));
            });
            
        })
        .setTimeout(0)
        .on('error', (error) => {
            console.log("HYO", "error : " + error);
        });
        request.write("");
        request.end();

    } else{
        callback(sessionAttributes,
            buildSpeechletResponse(intent.name, 'I do not understand what you are takling.' , 'What do you want to know by NBA center', false));
    }   
    
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

    // Dispatch to your skill's intent handlers
    if (intentName === 'StandingIntent') {
        console.log('HYO', 'onStandingIntent');
        getNBAStanding(intent, session, callback);
        //setColorInSession(intent, session, callback);
    } else if (intentName === 'LeagueLeaderIntent') {
        console.log('HYO', 'LeagueLeaderIntent');
        getNBALeaguLeader(intent, session, callback);
    } else if (intentName === 'ScoreboardIntent') {
        console.log('HYO', 'ScoreboardIntent');
        getNBAScoreboard(intent, session, callback);
        //getNBALeaguLeader(intent, session, callback);
    } else if (intentName === 'GoodbyeIntent') {
        console.log('HYO', 'LeagueLeaderIntent');
        handleSessionEndRequest(callback);
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

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

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