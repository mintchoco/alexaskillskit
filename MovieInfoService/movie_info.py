"""
This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well
as testing instructions are located at http://amzn.to/1LzFrj6

For additional samples, visit the Alexa Skills Kit Getting Started guide at
http://amzn.to/1LGWsLG
"""
from __future__ import print_function
import json
import decimal
import time

def search_title(name):
    founded = False
    resultStr = "I'm sorry. There is no match movie"
    with open("moviedata.json") as json_file:
        movies = json.load(json_file, parse_float=decimal.Decimal)
        for movie in movies:
            title = movie['title']
            if name.lower() in title.lower():
                story = getMovieInformation(movie,title)
                json_file.close()
                return  story
    json_file.close()
    return resultStr

def search_actor(name):
    founded = False
    print(name)
    resultStr = "I'm sorry. There is no match actor's information"
    with open("moviedata.json") as json_file:
        movies = json.load(json_file, parse_float=decimal.Decimal)
        for movie in movies:
            if 'actors' in movie['info']:
                actors = movie['info']['actors']
                for actor in actors:
                    if name.lower() in actor.lower():
                        resultStr = getActorInformation(movie, actor)
                        json_file.close()
                        return resultStr
    json_file.close()
    return resultStr


def getActorInformation(movie,name):
    resultStr = "Here are the movie information related to the actor {}.\n".format(name)

    resultStr += "The movie title is {}.\n".format(movie['title'])
    resultStr += "The movie year is {}.\n".format(movie['year'])

    if 'rating' in movie['info']:
        resultStr += "And the rating is {}.\n".format(movie['info']['rating'])

    if 'plot' in movie['info']:
        resultStr += "Story about this movie is {}.\n".format(movie['info']['plot'])

    return resultStr

def getMovieInformation(movie,title):
    resultStr = "Here are the movie information related to the movie {}.\n".format(title)
    resultStr += "The movie making year is {}.\n".format(movie['year'])

    if 'rating' in movie['info']:
        resultStr += "And the rating is {}.\n".format(movie['info']['rating'])

    if 'running_time_secs' in movie['info']:
        runningTime = int(movie['info']['running_time_secs'])
        timeStr = time.strftime("%H:%M:%S", time.gmtime(runningTime))
        resultStr += "The running time is {}.\n".format(timeStr)

    if 'genres' in movie['info']:
        resultStr += "The Genres are\t"
        for g in movie['info']['genres']:
            resultStr +="{}\t".format(g)

    if 'actors' in movie['info']:
        resultStr += "\nThe actors are "
        for actor in movie['info']['actors']:
            resultStr += "{}\n".format(actor)

    if 'plot' in movie['info']:
        resultStr += "Story about this movie is {}.\n".format(movie['info']['plot'])
    else:
        resultStr += "There gives no Story Information about this movie.\n"

    return resultStr

# --------------- Helpers that build all of the responses ----------------------

def build_speechlet_response(title, output, reprompt_text, should_end_session):
    return {
        'outputSpeech': {
            'type': 'PlainText',
            'text': output
        },
        'card': {
            'type': 'Simple',
            'title': "SessionSpeechlet - " + title,
            'content': "SessionSpeechlet - " + output
        },
        'reprompt': {
            'outputSpeech': {
                'type': 'PlainText',
                'text': reprompt_text
            }
        },
        'shouldEndSession': should_end_session
    }


def build_response(session_attributes, speechlet_response):
    return {
        'version': '1.0',
        'sessionAttributes': session_attributes,
        'response': speechlet_response
    }


# --------------- Functions that control the skill's behavior ------------------

def get_welcome_response():
    """ If we wanted to initialize the session to have some attributes we could
    add those here
    """

    session_attributes = {}
    card_title = "Welcome"
    speech_output = "Welcome to the Movie Information Service. " \
                    "Please tell me actor's name or movie title saying, " \
                    "give me the summary of the movie Robot Cap or" \
                    "Let me know about information of movie Mel Gibson"
    # If the user either does not reply to the welcome message or says something
    # that is not understood, they will be prompted again with this text.
    reprompt_text = "Please tell me again by saying, " \
                    "give me the summary of the movie Robot Cap or" \
                    "Let me know about information of movie Mel Gibson"
    should_end_session = False
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def handle_session_end_request():
    card_title = "Session Ended"
    speech_output = "Thank you for trying the Alexa Skills Kit sample. " \
                    "Have a nice day! "
    # Setting this to true ends the session and exits the skill.
    should_end_session = True
    return build_response({}, build_speechlet_response(
        card_title, speech_output, None, should_end_session))


def create_favorite_color_attributes(favorite_color):
    return {"favoriteColor": favorite_color}

def get_movie_info(intent, session):
    card_title = intent['name']
    session_attributes = {}
    should_end_session = False

    if 'MOVIE' in intent['slots']:
        title = intent['slots']['MOVIE']['value']
        #founded = my_movie_info.get_first_movie(title)
        founded = search_title(title)

        speech_output = "I wanna give the movie information about" + title + "\n" + \
                        founded + \
                        "\nYou can ask me movie information by saying, " \
                        "give me the summary of the movie Robot Cap"
        reprompt_text = "You can ask me the movie info which you want to know by saying, " \
                        "give me the summary of the movie Robot Cap"
    else:
        speech_output = "I'm not sure what you wanted. " \
                        "Please try again."
        reprompt_text = "I'm not sure what your movie information is. " \
                        "You can ask me your favorite color by saying, " \
                        "give me the summary of the movie Robot Cap"
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))

def get_actor_info(intent, session):
    card_title = intent['name']
    session_attributes = {}
    should_end_session = False

    if 'actors' in intent['slots']:
        name = intent['slots']['actors']['value']
        #founded = my_movie_info.get_first_person(name)
        #founded = name + "is founded"
        founded = search_actor(name)

        speech_output = "I wanna give the person information about\t"+ name + "\n" + \
                        founded + \
                        "\nYou can ask me person information by saying, " \
                        "Let me know about information of movie Mel Gibson"

        reprompt_text = "You can ask me the person information which you want to know by saying, " \
                        "Let me know about information of movie Mel Gibson"
    else:
        speech_output = "I'm not sure what you wanted. " \
                        "Please try again."
        reprompt_text = "I'm not sure what your movie person information is. " \
                        "You can ask me your movie person information by saying, " \
                        "Let me know about information of movie Mel Gibson"
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))

# --------------- Events ------------------

def on_session_started(session_started_request, session):
    """ Called when the session starts """
    print("on_session_started requestId=" + session_started_request['requestId']
          + ", sessionId=" + session['sessionId'])


def on_launch(launch_request, session):
    """ Called when the user launches the skill without specifying what they
    want
    """

    print("on_launch requestId=" + launch_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # Dispatch to your skill's launch
    return get_welcome_response()


def on_intent(intent_request, session):
    """ Called when the user specifies an intent for this skill """

    print("on_intent requestId=" + intent_request['requestId'] +
          ", sessionId=" + session['sessionId'])

    intent = intent_request['intent']
    intent_name = intent_request['intent']['name']

    # Dispatch to your skill's intent handlers
    if intent_name == "askMoviePerson":
        return get_actor_info(intent, session)
    elif intent_name == "searchMovieInfo":
        return get_movie_info(intent, session)
    elif intent_name == "AMAZON.HelpIntent":
        return get_welcome_response()
    elif intent_name == "AMAZON.CancelIntent" or intent_name == "AMAZON.StopIntent":
        return handle_session_end_request()
    else:
        raise ValueError("Invalid intent")


def on_session_ended(session_ended_request, session):
    """ Called when the user ends the session.

    Is not called when the skill returns should_end_session=true
    """
    print("on_session_ended requestId=" + session_ended_request['requestId'] +
          ", sessionId=" + session['sessionId'])
    # add cleanup logic here


# --------------- Main handler ------------------

def lambda_handler(event, context):
    """ Route the incoming request based on type (LaunchRequest, IntentRequest,
    etc.) The JSON body of the request is provided in the event parameter.
    """
    print("event.session.application.applicationId=" +
          event['session']['application']['applicationId'])

    """
    Uncomment this if statement and populate with your skill's application ID to
    prevent someone else from configuring a skill that sends requests to this
    function.
    """
    # if (event['session']['application']['applicationId'] !=
    #         "amzn1.echo-sdk-ams.app.[unique-value-here]"):
    #     raise ValueError("Invalid Application ID")

    if event['session']['new']:
        on_session_started({'requestId': event['request']['requestId']},
                           event['session'])

    if event['request']['type'] == "LaunchRequest":
        return on_launch(event['request'], event['session'])
    elif event['request']['type'] == "IntentRequest":
        return on_intent(event['request'], event['session'])
    elif event['request']['type'] == "SessionEndedRequest":
        return on_session_ended(event['request'], event['session'])
