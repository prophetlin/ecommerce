from flask import Flask, request, jsonify, g
from flask_cors import CORS
from urllib import parse
import os
import json
import re
import time
import datetime
import sys

# path to src modules
sys.path.append('./src')
from User import user_json, user_login, user_logout, user_register, is_admin, getUserID, isValidToken, \
                 getUserEmail, modifyCart, rateMovie, getCart, getPurchaseHistory, makePurchase
from Search import search_title, search_genre, search_keyword, overview_search
from RecommenderSystem import RecommenderSystem
from transactions import purchase_json, rent_json
from User import user_json, getSurvey, updateSurvey, user_data
from Movie import MovieJson, createMovie, check_complete_movie, edit_movie, retrieve_options, key_match, \
                  grabAllgenres, grabAllkeywords, promote_movie, title_to_id, retrieve_titles
from connectDB import conn
from Chatbot import bot
from multiprocessing.pool import ThreadPool
import threading
app = Flask(__name__, static_folder='./client/build', static_url_path='/')
CORS(app)

@app.before_request
def before_request():
    g.cur = conn.cursor()

@app.teardown_request
def teardown_request(exception):
    if hasattr(g, 'cur'):
        g.cur.close()

ENV = 'dev'
if ENV == 'dev':
    app.debug = True
else:
    app.debug = False

# init recommender system
recommendsys = RecommenderSystem()

def retrain():
    r = RecommenderSystem()
    print("start retrain")
    global recommendsys
    recommendsys = r
    print('finish retrain')

## helper functions
# takes data (dict) and returns 200 json response
def jsonResponse(data):
    return app.response_class(response=json.dumps(data, default=str), status=200, mimetype='application/json')

# takes message (str) and returns 400 json error response
def jsonError(message):
    err = {'message': message}
    return app.response_class(response=json.dumps(err), status=400, mimetype='application/json')

# takes flask request obj and returns authorization token else if none found it returns none
def getToken(req):
    auth = req.headers.get('Authorization')
    #print('auth', auth)
    if not auth: return None
    return auth.split(' ')[1]


@app.errorhandler(404)
def not_found(e):
    return app.send_static_file('index.html')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api', methods=['GET'])
def hello_world():
    return jsonify({'success': 'ok'})

@app.route('/api/search', methods=['GET'])
def search():
    query = request.query_string.decode()
    h = parse.parse_qs(query)
    print(h)
    term = h['category'][0]
    txt = ' '.join(h['q'][0].split())
    #print(txt)
    res = {}
    if term == "Genre":
        res=search_genre(txt)
    if term == "Keyword":
        res=search_keyword(txt)
    if term == "Title":
        res=search_title(txt)
    if term == 'Overview':
        res=overview_search(txt)
    
    result = jsonResponse(res)
    return result

# recommend the toprated movie
@app.route('/api/user/rec', methods=['GET'])
def recommend():
    tok = getToken(request)
    print(tok)
    #if not tok: return jsonError('No user token.')
    userID = -1
    if tok:
        userID = getUserID(tok)
    res = []
    if userID != -1:
        res.append(recommendsys.recommend_by_rating(userID))
    print(userID)
    res.append(recommendsys.toprated())
    res.append(recommendsys.promoted())
    ret = {}
    ret['recs'] = res
    result = jsonResponse(ret)
    return result

# display the user profile
@app.route('/api/user/profile')
def profile():
    tok = getToken(request)
    print(tok)
    if not tok: return jsonError('No user token.')

    userID = getUserID(tok)
    if userID > -1:
        result = jsonResponse(user_data(userID))
    else:
        result = jsonError('User token invalid.')

    return result

# show the movie
@app.route('/api/movie/<int:movieID>')
def movie(movieID):
    print(request.url)
    print(movieID)

    # Check if movieID is integer
    if not isinstance(movieID, int):
        return jsonError('Bad response')

    # check if user is admin
    mov = None
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        mov = MovieJson(movieID, userID)
    else:
        mov = MovieJson(movieID, -1)

    # If not able to find movie, then the page should show that its a bad response
    if mov == None:
        return jsonError('Bad response')

    result = jsonResponse(mov)
    return result

# admin view for movies
@app.route('/api/user/admin/movie')
def adminMovie():
    query = request.query_string.decode()
    #get title
    h = parse.parse_qs(query)
    
    title = h.get('title')
    if title: title = title[0]
    else:
        # opt = retrieve_options()
        # return jsonResponse(opt['titles'])
        return jsonResponse(retrieve_titles())

    # check user is admin
    mov = None
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        movieID = title_to_id(title)
        if is_admin(userID) and movieID:
            mov = MovieJson(movieID, userID)

    # If not able to find movie, then the page should show that its a bad response
    if mov == None:
        return jsonError('Bad response')

    result = jsonResponse(mov)
    return result

# create a movie
@app.route('/api/user/admin/create', methods=['POST'])
def creation():
    # verify admin status
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        if not is_admin(userID):
            return jsonError('Admin only.')
    else:
        return jsonError('Admin only.')

    # grab input from form
    inp = request.get_json()

    # Check whether all necessary information is gathered
    # NOTE: overview and homepage are not set to be necessary
    inp_check = check_complete_movie(inp)
    if not (inp_check[0]):
        return jsonError(inp_check[1])

    # Fill in default values for missing features
    if not 'overview' in inp:
        overview = ''
    else:
        overview = inp['overview']

    result = createMovie(   language = inp['language'],
                            title = inp['title'], runtime = inp['runtime'], age = inp['age_rating'],
                            release_date = inp['release_date'], overview = overview,
                            rent_price = inp['rentprice'], purchase_price = inp['purchaseprice'],
                            url = inp['url'], genres = inp['genres'], keywords = inp['keywords'])

    # Check has to be done with None to ensure if movieID is 0, the movie is still returned correctly
    if result is None:
        return jsonError('Invalid data entered')
    if result == -1:
        return jsonError("Movie already exists")
    return jsonResponse({'movieID':result})

# edit a movie, must be admin
@app.route('/api/user/admin/edit', methods = ['POST'])
def edit():
    # verify admin status
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        if not is_admin(userID):
            return jsonError('Admin only.')
    else:
        return jsonError('Admin only.')

    # grab input from form
    inp = request.get_json()

    # NOTE: overview and homepage are not set to be necessary
    inp_check = check_complete_movie(inp)
    if not (inp_check[0]):
        return jsonError(inp_check[1])

    # Fill in default values for missing features
    if not 'overview' in inp:
        overview = ''
    else:
        overview = inp['overview']

    result = edit_movie(id=inp['id'], language=inp['language'],
                        title=inp['title'], runtime=inp['runtime'], age=inp['age_rating'],
                        release_date=inp['release_date'], overview=overview,
                        rent_price=inp['rentprice'], purchase_price=inp['purchaseprice'],
                        url=inp['url'], genres=inp['genres'], keywords=inp['keywords'])

    # Check has to be done with None to ensure if movieID is 0, the movie is still returned correctly
    if result is None:
        return jsonError('Invalid data entered')
    if result == -1:
        return jsonError("Movie already exists")
    return jsonResponse({'movieID': result})

# Overloading as edit and create options currently have the same functionality
@app.route('/api/options', methods=['GET'])
@app.route('/api/user/admin/edit/options', methods=['GET'])
@app.route('/api/user/admin/create/options', methods=['GET'])
def create_option():
    # Overloading to grab any matching keywords
    key = request.args.get('keyword')
    if key:
        return jsonResponse(key_match(key))

    return jsonResponse(retrieve_options())

# user register
@app.route('/api/auth/register', methods=['POST'])
def register():
    inp = request.get_json()
    #print(inp)
    if inp['email'] and inp['password'] and inp['birthDate']:
        email = inp['email']
        password = inp['password']
        birthday = inp['birthDate']
        res = user_register(email,password, birthday)
        #print(res)
    else:
        return jsonError('Missing email or password or birthday')

    if res['token'] == None:
        return jsonError(res['message'])

    return jsonResponse(res)

# user login
@app.route('/api/auth/login', methods=['POST'])
def login():
    inp = request.get_json()
    #print('login')
    if inp['email'] and inp['password']:
        email = inp['email']
        password = inp['password']
        res= user_login(email, password)
        #print(res)
    else:
        #print('bad')
        return jsonError('Missing email or password.')

    if res.get('token') == None:
        return jsonError('Wrong email or password.')

    return jsonResponse(res)

# purchase a movie
@app.route('/api/user/admin/sales/purchase', methods=['GET'])
def purchase():
    #print(request.url)
    query = request.query_string.decode()
    #print(query)
    h = parse.parse_qs(query)
    #print(h)

    # check if user is admin
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        if not is_admin(userID):
            return jsonError('Admin only.')
    else:
        return jsonError('No user token.')

    start = int(h['start'][0])
    end = int(h['end'][0])
    title = h.get('title')
    if title: title = title[0]

    # Check if both start and end are date format
    if not isinstance(start, int) or not isinstance(end, int):
        return jsonError('Bad response.')

    tstart = datetime.datetime.fromtimestamp(start)
    tend = datetime.datetime.fromtimestamp(end)
    result = jsonResponse(purchase_json(tstart, tend, title))
    return result

# rent a movie
@app.route('/api/user/admin/sales/rent', methods=['GET'])
def rent():
    #print(request.url)
    query = request.query_string.decode()
    #print(query)
    h = parse.parse_qs(query)
    #print(h)

    # check if user is admin
    tok = getToken(request)
    if tok:
        userID = getUserID(tok)
        if not is_admin(userID):
            return jsonError('Admin only.')
    else:
        return jsonError('No user token.')

    start = int(h['start'][0])
    end = int(h['end'][0])
    title = h.get('title')
    if title: title = title[0]

    # Check if both start and end are date format
    if not isinstance(start, int) or not isinstance(end, int):
        return jsonError('Bad response.')

    tstart = datetime.datetime.fromtimestamp(start)
    tend = datetime.datetime.fromtimestamp(end)
    result = jsonResponse(rent_json(tstart, tend, title))
    return result

# update cart
@app.route('/api/user/cart', methods=['GET', 'POST'])
def updatecart():
    tok = getToken(request)
    userID = -1
    if tok:
        userID = getUserID(tok)
    else:
        return jsonError('User not login')

    if userID == -1:
        return jsonError('No such user')
    
    if request.method == 'POST':
        data = request.get_json()
        movieId, isrent, tp = data['movieID'], data['rent'], data['add']
        tp = 1 if tp == True else 0
        ret = modifyCart(userID, movieId, isrent, tp)
        if ret == 1:
            res = {'Success': 'ok'}
            return jsonResponse(res)
        if ret == -1:
            return jsonError('No such user or movie')
        return jsonError('too young to watch a NC-17 movie')
    return jsonResponse(getCart(userID))

# update user rating to a particular movie
@app.route('/api/user/rate', methods=['POST'])
def updaterating():
    tok = getToken(request)
    userID = -1
    if tok:
        userID = getUserID(tok)
    else:
        return jsonError('User not login')

    if userID == -1:
        return jsonError('No such user')
    data = request.get_json()
    movieId, rating = data['movieID'], data['rating']
    rateMovie(userID, movieId, rating)
    res = {'Success': 'ok'}
    # print("create thread")
    x = threading.Thread(target=retrain)
    x.start()
    # print("finish response")
    return jsonResponse(res)

# view the purchase history, user must login
@app.route('/api/user/purchase', methods=['GET'])
def viewpurchasehistory():
    tok = getToken(request)
    userID = -1
    if tok:
        userID = getUserID(tok)
    else:
        return jsonError('User not login')

    if userID == -1:
        return jsonError('No such user')

    purc = getPurchaseHistory(userID)
    return jsonResponse(purc)

# promote movie, user must be admin
@app.route('/api/user/admin/promote', methods=['POST'])
def promoteMovie():
    tok = getToken(request)
    if tok:
        userid = getUserID(tok)
        if not is_admin(userid):
            return jsonError('Admin only.')
    else:
        return jsonError('Admin only.')

    data = request.get_json()
    movieid = data['movieID']
    promote = data['promote']
    if promote_movie(movieid, promote) == 1:
        res = {'Success': 'ok'}
        return jsonResponse(res)
    return jsonError('Failed to promote movie')

# make purchase, user must login
@app.route('/api/user/purchase', methods=['POST'])
def makepurchase():
    tok = getToken(request)
    userID = -1
    if tok:
        userID = getUserID(tok)
    else:
        return jsonError('User not login')

    data = request.get_json()
    if not (data['cardNo'] and data['expDate'] and data['cvv']):
        return jsonError('Missing payment credentials')

    if userID == -1:
        return jsonError('No such user')

    if makePurchase(userID) == 1:
        res = {'Success': 'ok'}
        return jsonResponse(res)
    return jsonError('Failed to make purchase')

# fill the preference survey or display the survey result
@app.route('/api/user/survey', methods=['GET', 'POST'])
def survey():
    print("enter here")
    tok = getToken(request)
    userID = -1
    if tok:
        userID = getUserID(tok)
    if userID == -1:
        return jsonError('User not login')
    
    if request.method == 'GET':
        res = getSurvey(userID)
        return jsonResponse(res)
    
    updateSurvey(userID, request.get_json())
    res = {'Success': 'ok'}
    return jsonResponse(res)

# chat with the bot
@app.route('/api/chatbot', methods = ['POST'])
def chat():
    print("enter chatbot")
    data = request.get_json()
    message = data['message']
    if message['from'] == 'user' and message['type'] == 'text':
        tok = getToken(request)
        # NOTE: Not sure if this is within requirements
        if tok:
            userID = getUserID(tok)
            res = bot.answer(message['content'], userID)
        else:
            res = bot.answer(message['content'])
        print("the response is", res)
        return jsonResponse(res)

    return jsonError("Unsupported input type")

if __name__ == '__main__':
    app.run(debug=True)
