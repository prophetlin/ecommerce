from connectDB import conn
import datetime
import json
import jwt
import psycopg2
import re
from helper import checkage
secret_key = "wrong_answer"

def user_data(userID):
    '''
        :param 1: userID, not null
        :return a dictionary contains the required info from API
    '''
    cur = conn.cursor()
    cur.execute("SELECT email, id, birthday FROM users WHERE id = %s", [userID])
    row = cur.fetchone()
    query = '''
        SELECT g.name
        FROM genres as g 
            JOIN surveys as s on s.genre = g.id
        WHERE s.userid = %s
    '''
    cur.execute(query, [userID])
    tup = cur.fetchall()
    ret = []
    for curr in tup:
        ret.append(curr[0])
    cur.close()
    # Change found rows into a list of dictionaries
    data = {"id": userID, "email": row[0], "birthDate": row[2]}
    data['likedGenre'] = ret
    print(data)
    return data

def user_json(userID):
    return json.dumps(user_data(userID), indent=4, default=str)

def user_login(email, password):
    '''
        function for user login
        :param 1: email
        :param 2: password
        :return a dictionary with the authentication token of the user or none of login fails
    '''
    cur = conn.cursor()
    cur.execute("SELECT email, password, id FROM users WHERE email = %s", [email])
    tuple = cur.fetchone()
    cur.close()

    if tuple == None:
        return {'token': None,'message':'No such email'}
    (iemail,ipassword, iid) = tuple
    
    if iemail == email and ipassword == password:
        token = jwt.encode({'id': iid, 'email': email}, secret_key, algorithm='HS256')
        status = is_admin(iid)
        return {'token': token, 'message': 'login success', 'admin': status}
    else:
        return {'token': None, 'message': 'password dont email'}

    return {'token': None, 'message': 'UNKNOWN ERROR'}

def checkinfo(email, password):
    '''
        :param 1: the email address in string format
        :param 2: password for registration in string format
        :return if the email and password is valid return None, otherwise some error message        
    '''
    regex = r'^(\w|\.|\_|\-)+[@](\w|\_|\-|\.)+[.]\w{2,3}$'
    if re.search(regex, email) == None:
        return "please supply a valid email address"
    if password == None or len(password) < 8:
        return "please supply a password of length at least 8"
    regex = r'(\_|\*|\-)'
    if re.search(regex, password) == None:
        return "password must contain at least one _ or * or -"
    regex = r'[a-zA-Z]'
    if re.search(regex, password) == None:
        return "password must contain at least one lower or upper case letter"
    regex = r'[0-9]'
    if re.search(regex, password) == None:
        return "password must contain at least one digit"
    regex = r'[^a-zA-Z0-9\_\-\*]'
    if re.search(regex, password) != None:
        return "password must not contain characters other than [a-zA-Z0-9_*-]"
    return None

def user_register(email, password, birthday="1999-01-01"):
    '''
        function for user register
        :param 1: email
        :param 2: password
        :param 3: birthday of format yyyy-mm-dd
        :return a dictionary for a user with such email and password and birthday
        or error message if the user has already existed 
    '''
    cur = conn.cursor()
    cur.execute("SELECT email FROM users WHERE email = %s", [email])
    tuple = cur.fetchone()

    if tuple != None:
        cur.close()
        return {'token': None, 'message': 'email already exist'}
    
    emsg = checkinfo(email, password)
    if emsg != None:
        return {'token': None, 'message': emsg}

    cur.execute("SELECT MAX(id)+1 FROM users")
    tuple = cur.fetchone()
    next_count = tuple[0]

    print('{}, {} , {}'.format(next_count, email, password))
    print(next_count, email, password)

    cur.execute("INSERT INTO users (id, email, password, birthday) VALUES (%s, %s, %s, %s)", [next_count, email, password, birthday])
    cur.execute("COMMIT")

    cur.execute("SELECT email FROM users WHERE email = %s", [email])
    tuple = cur.fetchone()
    (iemail,) = tuple
    cur.close()
    if iemail == email:
        token = jwt.encode({'id': next_count, 'email': email}, secret_key, algorithm='HS256')
        return {'token': token, 'message': 'Register Success'}

    return {'token': None, 'message': 'UNKNOWN ERROR'}

def user_logout(token):
    '''
       logout does nothing, front-end will do the job
    '''
    return None

def is_admin(userID):
    '''
        :param 1: userid, integer
        :returns boolean, if this user is an admin
    '''
    cur = conn.cursor()    
    cur.execute("SELECT isadmin FROM users WHERE id = %s", [userID])
    tuple = cur.fetchone()
    cur.close()
    if tuple == None:
        return False
    (isadmin,) = tuple
    return isadmin    

def isValidToken(token):
    '''
        :param 1: authentication token, cannot be null!!!
        :returns boolean, if this token is a valid token
    '''
    userData = jwt.decode(token, secret_key, algorithms=['HS256'])
    cur = conn.cursor()
    cur.execute("SELECT email, password, id FROM users WHERE id = %s", [userData['id']])
    tuple = cur.fetchone()
    cur.close()
    if tuple == None:
        return False
    return True

def getUserID(token):
    '''
       :param 1: authentication token, cannot be null!!!
       :return the user id, none if the token is invalid
    '''
    userData = jwt.decode(token, secret_key, algorithms=['HS256'])
    cur = conn.cursor()
    cur.execute("SELECT email, password, id FROM users WHERE id = %s", [userData['id']])
    tuple = cur.fetchone()
    cur.close()
    if tuple == None:
        return -1
    return tuple[2]

def getUserEmail(token):
    '''
        :param 1: authentication token, cannot be null!!!
        :return the user email, none if the token is invalid
    '''
    userData = jwt.decode(token, secret_key, algorithms=['HS256'])
    cur = conn.cursor()
    cur.execute("SELECT email, password, id FROM users WHERE id = %s", [userData['id']])
    tuple = cur.fetchone()
    cur.close()
    if tuple == None:
        return -1
    return tuple[0]

def rateMovie(userid, movieid, rt):
    '''
       insert or update the userid,movieid to rt
       the trigger check_update and function update_avg() are going to handle the update on movies table
       :param 1: userid integer
       :param 2: movieid integer
       :param 3: rating to be updated/inserted float
       :returns an integer(-1, 1), -1 means update fails, 1 means success
    '''
    query = '''
        INSERT INTO ratings(userId,movieId,rating) values (%s, %s, %s)
        ON CONFLICT(userid, movieid) do UPDATE SET rating=%s
    '''
    cur = conn.cursor()
    try:
        if rt >= 0:
            cur.execute(query, [userid, movieid, rt, rt])
        else:
            cur.execute("delete from ratings WHERE userid=%s and movieid=%s",[userid, movieid])
        cur.execute("COMMIT")
    except psycopg2.IntegrityError:
        conn.rollback()
        cur.close()
        return -1
    cur.close()
    return 1

def modifyCart(userid, movieid, isrent, tp):
    '''
        modify the cart of a user
        :param 1: userid integer
        :param 2: movieid integer
        :param 3: boolean is this rent or not
        :param 4: type of operation, 0 means delete, 1 means insert
        :return statement: 1 means success, -1 means error, -2 means illeagal age rating
    '''
    cur = conn.cursor()
    cur.execute("SELECT adult FROM movies WHERE id = %s",[movieid])
    agerating = cur.fetchone()
    if agerating != None and agerating[0] != None and agerating[0] == 'NC-17':
        cur.execute("SELECT birthday FROM users WHERE id = %s", [userid])
        birthday = cur.fetchone()[0]
        if checkage(birthday) == 0:
            cur.close()
            return -2

    if tp == 1:
        query = '''
            INSERT INTO carts(userId,movieId,isrent) values (%s, %s, %s)
        '''
        try:
            cur.execute(query, [userid, movieid, isrent])
            cur.execute("COMMIT")
        except psycopg2.IntegrityError:
            conn.rollback()
            cur.close()
            return -1
    else:
        query = '''
            delete from carts where userid = %s and movieid = %s and isrent = %s
        '''
        try:
            cur.execute(query, [userid, movieid, isrent])
            cur.execute("COMMIT")
        except psycopg2.IntegrityError:
            conn.rollback()
            return -1   
    cur.close()
    return 1

# receives the userid of the currently logged in user
# returns a list of movies from the carts table
def getCart(userid):
    '''
       :param 1: userid integer
       :returns a dictionary describe the cart of the user with id = userid in 
       the required API format
    '''
    query = '''
        SELECT m.id, m.title, m.url, m.rentprice, m.purchaseprice, c.isrent
        FROM movies as m
            JOIN carts as c on m.id = c.movieId
        WHERE c.userId = %s
    '''
    cur = conn.cursor()
    cur.execute(query, [userid])
    res = cur.fetchall()
    ret = []
    for curr in res:
        v = {}
        v['movieID'], v['title'], v['url'], v['rent'] = curr[0], curr[1], curr[2], curr[5]  
        if curr[5] == True:
            v['price'] = curr[3]
        else:
            v['price'] = curr[4]
        ret.append(v)
    rett = {}
    rett['cart'] = ret
    cur.close()
    return rett

# receives the userid of the currently logged in user
# returns a list of movies that the user has bought or rented (and their remaining rent time)
def getPurchaseHistory(userid):
    '''
        get the purchase history of a user
        :param 1: userid integer
        :returns a dictionary follow the API format
    '''
    load = {}

    query = '''
        SELECT m.id, m.url, m.title, b.ptime
        FROM Buys b
            JOIN Movies m on b.movieid = m.id
        WHERE b.userid = %s and b.endtime is NULL
    '''
    cur = conn.cursor()
    cur.execute(query, [userid])
    tuples = cur.fetchall()

    purchase = []
    for curr in tuples:
        v = {}
        v['movieID'], v['url'], v['title'], v['ptime'] = curr[0], curr[1], curr[2], curr[3]
        # convert ptime to seconds since epoch time
        pdate = v['ptime']
        v['ptime'] = datetime.datetime.fromordinal(pdate.toordinal()).timestamp()
        purchase.append(v)
    load['purchase'] = purchase

    query = '''
        SELECT m.id, m.url, m.title, b.endtime
        FROM Buys b
            JOIN Movies m on b.movieid = m.id
        WHERE b.userid = %s and b.endtime is not NULL
    '''
    cur.execute(query, [userid])
    tuples = cur.fetchall()
    rent = []
    for curr in tuples:
        v = {}
        v['movieID'], v['url'], v['title'], v['endtime'] = curr[0], curr[1], curr[2], curr[3]
        # convert endtime to seconds since epoch time
        endDate = v['endtime']
        v['endtime'] = datetime.datetime.fromordinal(endDate.toordinal()).timestamp()
        rent.append(v)
    load['rent'] = rent

    cur.close()
    return load

def makePurchase(userid):
    '''
       user make a purchace, all the movies in cart are changed into purchase/rent status
       :param 1: userid integer
    '''
    cartJSON = getCart(userid)
    cart = cartJSON['cart']
    cur = conn.cursor()

    for movie in cart:
        movieid = movie['movieID']
        rent = movie['rent']
        ptime = datetime.datetime.now()
        if rent == True:
            endtime = ptime + datetime.timedelta(days=14)
        else:
            endtime = None

        query = '''
            INSERT INTO Buys(userId, movieId, ptime, endtime) values (%s, %s, %s, %s)
        '''
        cur.execute(query, [userid, movieid, ptime, endtime])
        cur.execute("COMMIT")
        modifyCart(userid, movieid, rent, 0)
        
    cur.close()
    return 1


def getSurvey(userid):
    '''
       :param 1: userid
       :returns a dictionary object of the required api format
    '''
    query = '''
        SELECT g.name 
        FROM genres as g 
            JOIN surveys as s on s.genre = g.id
        WHERE s.userid = %s 
    '''
    cur = conn.cursor()
    cur.execute(query, [userid])
    li = cur.fetchall()
    genre = []
    for curr in li:
        genre.append(curr[0])
    cur.execute("SELECT birthday FROM users WHERE id = %s", [userid])
    birthday = cur.fetchone()[0]
    ret = {}
    ret['birthday'] = birthday
    ret['likedGenre'] = genre
    cur.close()
    return ret

def updateSurvey(userid, surveyd):
    '''
       update the survey result
       :param 1: userid
       :param 2: a list of genre id
       : expected result, the table is updated
    '''
    if surveyd == None:
        return
    cur = conn.cursor()
    genre = surveyd['likedGenre']
    cur.execute("delete from surveys where userid = %s", [userid])
    cur.execute("COMMIT")
    if len(genre) == 0:
        cur.close()
        return
    print("genre", genre)
    cur.execute("SELECT id FROM genres WHERE name ilike Any(%s)", [genre])
    for curr in cur.fetchall():
        cur.execute("INSERT INTO surveys(userid, genre) values (%s, %s)", [userid, curr[0]])
        cur.execute("COMMIT")
    cur.close()
    
if __name__ == '__main__':
    print('')
