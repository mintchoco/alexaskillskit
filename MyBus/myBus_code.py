#-*- coding: utf-8 -*-

from __future__ import print_function
import boto3
from urllib2 import Request, urlopen
from urllib import urlencode, quote_plus
from xml.etree.ElementTree import parse, fromstring, tostring


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

def get_welcome_response(session):
    """ If we wanted to initialize the session to have some attributes we could
    add those here
    """

    session_attributes = {}
    card_title = "Welcome"
    
    """Get favorite station from DB"""
    dynamo_db = boto3.resource('dynamodb')
    table = dynamo_db.Table('favoriteBusInfo')
 
    response = table.get_item( 
        Key = {'alexaUserId': session['user']['userId']
        }
    )
    
    print("get_welcome_response DB response > "+ str(response))
    
    if response.get('Item', {}).get('stationNumber'):
        station_number = response.get('Item', {}).get('stationNumber')
        my_buses = response.get('Item', {}).get('myBuses', "").replace('None',' ').replace(',',' ').split()
        
        table = dynamo_db.Table('stationInfo')        
        
        response = table.get_item( 
            Key = {'stationNumber': station_number
            }
        )
        
        stationNm = response.get('Item', {}).get('stationNm',"")
        
        print("station Name " + stationNm)
        
        session_attributes = {'myStation':station_number, 'myBuses': my_buses}
        
        out_text =  "Welcome to the my bus. " \
                    "Your favorite bus station is " + stationNm + ". "
                
        if len(my_buses) > 0 :
            out_text += " And " + ", ".join(my_buses) + ", are added your station. "
        else:
            out_text += "You can get information to say, 'next my bus'. " \
                        "If you want to change your station, " \
                        "Please tell me your favorite station id."
       
        speech_output = out_text
        reprompt_text = out_text
    else:
        session_attributes = {'myStation':"", 'myBuses': []}
        speech_output = "Welcome to the my bus. " \
                        "Your favorite bus station is not registered, " \
                        "Please tell me your favorite station id"

        reprompt_text = "Welcome to the my bus. " \
                        "Your favorite bus station is not registered, " \
                        "Please tell me your favorite station id"
                        
    should_end_session = False
	
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def handle_session_end_request():
    card_title = "Session Ended"
    speech_output = "End My Bus. " \
                    "Have a nice day! "
    # Setting this to true ends the session and exits the skill.
    should_end_session = True
	
    return build_response({}, build_speechlet_response(
        card_title, speech_output, None, should_end_session))


def save_favorite_station(intent, session):
    """ Save the station to DB and prepares the speech to reply to the
    user.
    """
    card_title = intent['name']
    session_attributes = session.get('attributes', {})
    should_end_session = False

    if intent.get('slots', {}) and "BUS_STATION_SEOUL" in intent.get('slots', {}):
        favorite_station = intent['slots']['BUS_STATION_SEOUL']['value']
        
        if get_station_info(favorite_station, "").get('stId'):
            session_attributes = {'myStation':favorite_station,'targetStation':favorite_station}
            dynamo_db = boto3.resource('dynamodb')
            table = dynamo_db.Table('favoriteBusInfo')
            response = table.put_item( 
                Item = {
                    'alexaUserId': session['user']['userId'],
                    'stationNumber' : favorite_station
                }
            )

            table_2 = dynamo_db.Table('stationInfo')
            response_2 = table_2.get_item( 
                Key = {'stationNumber': favorite_station
                }
            )
            
            stationNm = response_2.get('Item', {}).get('stationNm',"")

            out_text = " Your favorite station is successfully changed to " + favorite_station + ",  " + stationNm + '. '  \
                        " You can get information to say, 'next my bus'. " \
                        " If you want to get arrival information of specific buses,  " \
                        " Just add your favorite buses on your station. You can add , or remove favorite buses by saying " \
                        " Add bus number , or Remove bus number."
            speech_output = out_text
            reprompt_text = out_text
        else:
            speech_output = "Station id is not valid, please try again after check the station number "
            reprompt_text = "Station id is not valid, please try again after check the station number "
    else:
        speech_output = "I'm not sure what your favorite station is. " \
                        "Please try again."
        reprompt_text = "I'm not sure what your favorite station is. " \
                        "Please try again."
			
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def add_favorite_bus(intent, session):
    """ Save the bus to DB and prepares the speech to reply to the
    user.
    """

    card_title = intent['name']
    session_attributes = session['attributes']
    should_end_session = False

    my_station = session['attributes']['myStation']
    my_buses = session['attributes'].get('myBuses', [])

    if intent.get('slots', {}) and "BUS_NUMBER_SEOUL" in intent.get('slots', {}):
        favorite_bus = intent['slots']['BUS_NUMBER_SEOUL']['value']
        
        if favorite_bus in my_buses:
            speech_output = favorite_bus + " is already in your favorite stations."
            reprompt_text = favorite_bus + " is already in your favorite stations."
        elif get_businfo(my_station, favorite_bus).get('rtNm'):
            my_buses.append(favorite_bus)
            
            dynamo_db = boto3.resource('dynamodb')
            table = dynamo_db.Table('favoriteBusInfo')

            response = table.update_item( 
                Key = {
                    'alexaUserId': session['user']['userId']
                },

                UpdateExpression = "set myBuses = :x",
                ExpressionAttributeValues = {
                    ":x": str(",".join(my_buses))
                }
                
            )                     
            print("add_favorite_bus > DB " + str(response))
            session_attributes['myBuses'] = my_buses
            speech_output = favorite_bus + " is successfully added in your favorite stations."
            reprompt_text = favorite_bus + " is successfully added in your favorite stations."  

        else:
            speech_output = favorite_bus + " does not stop your station, please try again after check the bus number"
            reprompt_text = favorite_bus + " does not stop your station, please try again after check the bus number"
    else:
        speech_output = "I'm not sure what your favorite bus is. " \
                        "Please try again."
        reprompt_text = "I'm not sure what your favorite bus is. " \
                        "Please try again."
    
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def remove_favorite_bus(intent, session):
    """ Remove the bus to DB and prepares the speech to reply to the
    user.
    """

    card_title = intent['name']
    session_attributes = session['attributes']
    should_end_session = False

    my_station = session['attributes']['myStation']
    my_buses = session['attributes'].get('myBuses', [])

    if intent.get('slots', {}) and "BUS_NUMBER_SEOUL" in intent.get('slots', {}):
        favorite_bus = intent['slots']['BUS_NUMBER_SEOUL']['value']
        
        if favorite_bus in my_buses:
            my_buses.remove(favorite_bus)
            buses = str(",".join(my_buses))
            
            if buses == "":
                buses = "None"
            
            dynamo_db = boto3.resource('dynamodb')
            table = dynamo_db.Table('favoriteBusInfo')

            response = table.update_item( 
                Key = {
                    'alexaUserId': session['user']['userId']
                },

                UpdateExpression = "set myBuses = :x",
                ExpressionAttributeValues = {
                    ":x": buses
                }
            )
            
            print("remove_favorite_bus > DB " + str(response))
            
            session_attributes['myBuses'] = my_buses
            
            speech_output = favorite_bus + " is successfully removed in your favorite stations."
            reprompt_text = favorite_bus + " is successfully removed in your favorite stations."    

        else:
            speech_output = favorite_bus + " is not in your favorite stations, please try again "
            reprompt_text = favorite_bus + " is not in your favorite stations, please try again "
    else:
        speech_output = "I'm not sure what your favorite bus is. " \
                        "Please try again."
        reprompt_text = "I'm not sure what your favorite bus is. " \
                        "Please try again."
    
    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))
        

def SearchMyBus(intent, session):

    card_title = intent['name']
    session_attributes = session['attributes']
    should_end_session = False
    
    if session.get('attributes', {}) and "myStation" in session.get('attributes', {}) and "myBuses" in session.get('attributes', []) and len(session['attributes']['myBuses'])>0:
        my_station = session['attributes']['myStation']
        my_buses = session['attributes']['myBuses']
        responseText = ""
        
        for my_bus in my_buses:
            data = get_businfo(my_station, my_bus)
            
            if data.get('rtNm'):
                responseText += str(data['rtNm']) + " will be arrived " + translate_kor(str(data['arrmsg1'])) + " and next is " + translate_kor(str(data['arrmsg2']))
            else:
                responseText = "Bus number, " +  my_bus + " is Invalid. "
        
        speech_output = responseText
        reprompt_text = responseText      
    elif session.get('attributes', {}) and "myStation" in session.get('attributes', {}):
        my_station = session['attributes']['myStation']
        responseText = ""
		
        for data in get_businfo_by_station(my_station):
            # responseText += str(data['rtNm']) + " will be arrived " + translate_kor(str(data['arrmsg1'])) + " and next is " + translate_kor(str(data['arrmsg2'])) + "."
            responseText += str(data['rtNm']) + " will be arrived " + translate_kor(str(data['arrmsg1'])) + ". "
        
        if responseText == "":
            responseText = "Invalid station number. " \
                        "Please try again. "
        
        speech_output = responseText
        reprompt_text = responseText
    else:
        speech_output = "Your favorite station was not selected. " \
                        "Please tell me like my favorite station is one two three."
        reprompt_text = "Your favorite station was not selected. " \
                        "Please tell me like my favorite station is one two three."


    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def search_my_businfo_by_station(intent, session):
    
    card_title = intent['name']
    session_attributes = session['attributes']
    should_end_session = False
    station_number = ""
    responseText = ""
    
    if intent.get('slots', {}) and "BUS_STATION_SEOUL" in intent.get('slots', {}):
        station_number = intent['slots']['BUS_STATION_SEOUL']['value']

    elif session.get('attributes', {}) and "targetStation" in session.get('attributes', {}):
        station_number = session['attributes']['targetStation']
    else:
        responseText = "I'm not sure what are you saying. " \
                        "Please try again. "

    if station_number != "":

        if get_station_info(favorite_station, "").get('stId'):
            dynamo_db = boto3.resource('dynamodb')    
            table_2 = dynamo_db.Table('stationInfo')
        
            response_2 = table_2.get_item( 
                Key = {'stationNumber': station_number
                }
            )
            
            stationNm = response_2.get('Item', {}).get('stationNm',"")

            responseText = " Selected station, " + favorite_station + ",  " + stationNm + '. '  \

            speech_output = responseText
            reprompt_text = responseText

            
            for data in get_businfo_by_station(station_number):
                responseText += str(data['rtNm']) + " will be arrived " + translate_kor(str(data['arrmsg1'])) + " and next is " + translate_kor(str(data['arrmsg2'])) + ", "

        else:
            responseText = "Station id is not valid, please try again after check the station number "
            
    speech_output = responseText
    reprompt_text = responseText

    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def search_my_businfo_by_station_and_bus(intent, session):
    
    card_title = intent['name']
    session_attributes = session['attributes']
    should_end_session = False
	
    if session.get('attributes', {}) and "targetStation" in session.get('attributes', {}):
        my_station = session['attributes']['targetStation']

    if intent.get('slots', {}) and "BUS_NUM_SEOUL" in intent.get('slots', {}):
        bus_number = intent['slots']['BUS_NUM_SEOUL']['value']
        data = get_businfo(my_station, bus_number)
        session_attributes['myBus'] = bus_number
        
        if data.get('rtNm'):
            responseText = str(data['rtNm']) + " will be arrived " + translate_kor(str(data['arrmsg1'])) + " and next is " + translate_kor(str(data['arrmsg2']))
        else:
            responseText = "Invalid bus number. " \
                        "Please try again. "
        
        speech_output = responseText
        reprompt_text = responseText
    else:
        speech_output = "I'm not sure what are you saying. " \
                        "Please try again. "
        reprompt_text = "I'm not sure what are you saying. " \
                        "Please try again. "

    return build_response(session_attributes, build_speechlet_response(
        card_title, speech_output, reprompt_text, should_end_session))


def get_businfo(station,bus_number):
"""Get arrival information by bus number"""
    station_info = get_station_info(station,bus_number)
    bus_info = {}
    print("get_businfo > station " + station + " bus number " + bus_number)
    
    if station_info.get('busRouteId') is None:
        print('routeId is wrong')
    else:
        route_id = station_info['busRouteId']    
        stId = station_info['stId']
        staOrd = station_info['staOrd']
        url = 'http://ws.bus.go.kr/api/rest/arrive/getArrInfoByRoute'

        queryParams = '?' + 'ServiceKey=' + 'IvoFb7NGWppnsOtwvvpVRGg3yWFS1whuMZf8DtNLwMvUeLFiWB%2FrFuV7jsqOuH6nSHbnvNdvSNd35WVDC4Glsg%3D%3D'+'&stId=' +stId+'&busRouteId='+ route_id + '&ord=' + staOrd
        request = Request(url + queryParams)
        request.get_method = lambda: 'GET'
        response_body = urlopen(request).read()
        print('get_businfo' + response_body)
        
        root = fromstring(response_body)
        msg_body = root.find('msgBody')
        item_list = msg_body.findall('itemList')
        
        for data in item_list:
            if data.find('rtNm').text == bus_number:
                bus_info['arrmsg1'] = data.find('arrmsg1').text
                bus_info['arrmsg2'] = data.find('arrmsg2').text
                bus_info['rtNm'] = data.find('rtNm').text
                
                bus_info['stNm'] = data.find('stNm').text
                bus_info['arsId'] = data.find('arsId').text
                bus_info['busRouteId'] = data.find('busRouteId').text
                bus_info['routeType'] = data.find('routeType').text

    return bus_info


def get_businfo_by_station(station_number):
"""Get arrival inforamtion on station"""
    url = 'http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid'
    queryParams = '?' + 'ServiceKey=' + 'IvoFb7NGWppnsOtwvvpVRGg3yWFS1whuMZf8DtNLwMvUeLFiWB%2FrFuV7jsqOuH6nSHbnvNdvSNd35WVDC4Glsg%3D%3D&arsId=' + station_number
    print("get_businfo_by_station > " + station_number)
    request = Request(url + queryParams)
    request.get_method = lambda: 'GET'
    response_body = urlopen(request).read()
    print('get_businfo_by_station' + response_body)
        
    root = fromstring(response_body)
    msg_body = root.find('msgBody')
    item_list = msg_body.findall('itemList')
    arData = []
    
    for data in item_list:
        arData.append({'rtNm' : data.find('rtNm').text, 'arrmsg1' : data.find('arrmsg1').text, 'arrmsg2':data.find('arrmsg2').text})

    print('get_businfo_by_station' + str(len(arData)))
        
    return arData


def get_routeId(bus_number):
"""Get routeId by bus number for serching the arrival information"""
    url = 'http://ws.bus.go.kr/api/rest/busRouteInfo/getBusRouteList'
    queryParams = '?' + 'ServiceKey=' + 'IvoFb7NGWppnsOtwvvpVRGg3yWFS1whuMZf8DtNLwMvUeLFiWB%2FrFuV7jsqOuH6nSHbnvNdvSNd35WVDC4Glsg%3D%3D'+'&strSrch=' + bus_number

    request = Request(url + queryParams)
    request.get_method = lambda: 'GET'
    response_body = urlopen(request).read()
    print('get_routeId(' + bus_number + ') >>> ' + response_body)
    
    root = fromstring(response_body)
    msg_body = root.find('msgBody')
    item_list = msg_body.find('itemList')
    bus_route_name = item_list.find('busRouteNm')
    bus_route_id = None
    
    if bus_route_name is None:
        print("bus doesn`t exist")
    elif bus_number == bus_route_name.text:
        print("same bus number !!")
        bus_route_id = item_list.find('busRouteId').text
        print("route id " + bus_route_id)
    else:
        print("difference bus number")
    
    return bus_route_id


def get_station_info(station_number, bus_number):
"""Get station information by station number, If the bus number exist, check with the response for checking the bus is valid"""
    url = 'http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid'
    queryParams = '?' + 'ServiceKey=' + 'IvoFb7NGWppnsOtwvvpVRGg3yWFS1whuMZf8DtNLwMvUeLFiWB%2FrFuV7jsqOuH6nSHbnvNdvSNd35WVDC4Glsg%3D%3D'+'&arsId=' + station_number

    request = Request(url + queryParams)
    request.get_method = lambda: 'GET'
    response_body = urlopen(request).read()
    
    print('get_station_info(' + station_number + ', ' + bus_number + ') >>> ' + response_body)
    
    root = fromstring(response_body)
    msg_body = root.find('msgBody')
    item_list = msg_body.findall('itemList')
    
    station_info = {}
    for data in item_list:
        
        station_info['stId'] = data.find('stId').text
        station_info['stNm'] = data.find('stNm').text
        station_info['arsId'] = data.find('arsId').text
        station_info['gpsX'] = data.find('gpsX').text
        station_info['gpsY'] =data.find('gpsY').text
        if data.find('rtNm').text == bus_number:
            station_info['staOrd'] = data.find('staOrd').text
            station_info['busRouteId'] = data.find('busRouteId').text
    
    return station_info


def translate_kor(inStr):
    inStr = inStr.replace('분', 'Min')
    inStr = inStr.replace('초', 'Sec')
    inStr = inStr.replace('후[', ', before ')
    inStr = inStr.replace('번째 전', ' station')
    
    print("check str " + str(inStr.find('곧 도착')))
    if inStr.find('곧 도착') > -1:
        inStr = inStr.replace('곧 도착', 'Less than 1Min')
    elif inStr.find('운행종료') > -1:
        inStr = inStr.replace('운행종료', 'Next morning')
    else:
        inStr = 'After ' + inStr
    
    return inStr
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
    return get_welcome_response(session)


def on_intent(intent_request, session):
    """ Called when the user specifies an intent for this skill """

    print("on_intent requestId=" + intent_request['requestId'] +
          ", sessionId=" + session['sessionId'])

    intent = intent_request['intent']
    intent_name = intent_request['intent']['name']

    # Dispatch to your skill's intent handlers
    if intent_name == "SaveFavoriteStation":
        return save_favorite_station(intent, session)
    elif intent_name == "AddFavoriteBus":
        return add_favorite_bus(intent, session)
    elif intent_name == "RemoveFavoriteBus":
        return remove_favorite_bus(intent, session)
    elif intent_name == "SearchMyBus":
        return SearchMyBus(intent, session)
    elif intent_name == "SerachBusByBusNumber":
        return search_my_businfo_by_station_and_bus(intent, session)
    elif intent_name == "searchBusByStation":
        return search_my_businfo_by_station(intent, session)
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