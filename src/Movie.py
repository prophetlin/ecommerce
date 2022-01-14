from connectDB import mydict, conn, keywordArr, genreArr, titleArr
from iso639 import languages
import json
from User import is_admin
from helper import getBaysianrating
from datetime import date
import psycopg2

def updateTfIdf(id, title, overview):
    '''
        make sure you call this function after you insert or update a movie in the database!
        calling this function is essential for the smart search
        input (movieid, movietitle, overview)
        precondition: id is valid, title and overview are not null
    '''
    assert(title != None)
    title += '. '
    if overview:
        title += overview
    mydict[id] = title

def title_to_id(title):
    '''
        finds movie id by its title      
    '''
    cur = conn.cursor()
    cur.execute('SELECT id FROM movies WHERE title = %s', [title])
    mid = cur.fetchone()
    if mid: mid = mid[0]
    cur.close()
    return mid


def isduplicate(id, title, release_date):
    cur = conn.cursor()
    cur.execute("select count(*) from movies where id <> %s and title = %s and release_date = %s", [id, title, release_date])
    ret = cur.fetchone()[0]
    cur.close()
    print("check ", id, title, release_date, "result= ", ret)
    if ret != 0:
        return True
    return False

def findMovie(id):
    '''
        param 1: id integer
        :return movie description dictionary in required API format
    '''
    # Connect to Database
    cur = conn.cursor()
    cur.execute("""  SELECT m.original_language, m.title, m.runtime, m.adult, m.release_date, 
                                m.overview, m.imdbid, m.rentprice, m.purchaseprice, m.url, m.avgrating, m.numrating
                        FROM movies m
                        WHERE m.id = {}""".format(id))

    # Currently only grabs first result from database
    mov = cur.fetchone()
    cur.execute("select avg(rating) from ratings")
    R = cur.fetchone()[0]
    cur.close()
    if mov == None:
        return None
    return {'language': mov[0], 'title': mov[1], 'runtime': mov[2], 'adult': mov[3], 
            'release_date': mov[4], 'overview': mov[5], 'imdbid': mov[6], 
            'rentprice': mov[7], 'purchaseprice': mov[8], 'url': mov[9], 'rating': getBaysianrating(mov[10], R, mov[11]), "numRating": mov[11]}

def countRatings(id):
    '''
        :param 1: movieid, integer
        :return the total number of ratings the movie receive, integer >= 0
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT count(userID)
                    FROM ratings
                    WHERE movieID = {}""".format(id))

    ret = cur.fetchone()[0]
    cur.close()
    return ret

def countPurchase(id):
    '''
        :param 1: movieid, integer
        :return total number of purchase/rent of that movie, integer >= 0
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT count(userID)
                    FROM buys
                    WHERE movieID = {}""".format(id))
    ret = cur.fetchone()[0]
    cur.close()
    return ret

def grabkeyword(movieID):
    '''
        :param 1: movie id
        :return list of keywords corresponding to movieID
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT k.word 
                    FROM moviekeyword mk
                    INNER JOIN keywords k on mk.keyword = k.id
                    WHERE mk.movieid = {}""".format(movieID))
    rows = cur.fetchall()
    l = []
    for row in rows:
        l.append(row[0])
    cur.close()
    return l

def grabgenre(movieID):
    '''
        :param 1: movie id
        :return list of genres corresponding to movieID
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT g.name
                    FROM movies m
                    INNER JOIN moviegenre mg on mg.movieid = m.id
                    INNER JOIN genres g on mg.genre = g.id
                    WHERE m.id = {}""".format(movieID))
    rows = cur.fetchall()
    l = []
    for row in rows:
        l.append(row[0])
    cur.close()
    return l

def grabAllgenres():
    '''
        :return list of all available genres, list of string
    '''
    cur = conn.cursor()
    cur.execute("SELECT name FROM genres")
    rows = cur.fetchall()
    l=[]
    for row in rows:
        l.append(row[0])
    cur.close()
    return l

def grabAllkeywords():
    '''
        :return list of all available keywords, list of string
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT word FROM keywords""")
    rows = cur.fetchall()
    l=[]
    for row in rows:
        l.append(row[0])
    cur.close()
    return l

def grabUserRating(userID, movieID):
    '''
        :param 1: user id
        :param 2: movie id
        :return user rating, return -1 if not rating        
    '''
    query = '''
            SELECT rating FROM ratings WHERE userid = %s AND movieid = %s
        '''
    cur = conn.cursor()
    cur.execute(query, [userID, movieID])
    rating = cur.fetchone()
    cur.close()
    if rating == None:
        return -1
    return rating[0]

def MovieJson(id, userID):
    '''
        :return the movie object in json format
    '''
    mov = findMovie(id)
    if mov == None:
        return None
    #ratings = countRatings(id)
    mov["genres"] = grabgenre(id)
    mov["keywords"] = grabkeyword(id)
    cur = conn.cursor()
    if userID > -1:
        mov['userRating'] = grabUserRating(userID, id)
        print(mov['userRating'])
        # here we are checking is the user has some active purchase history on this movie
        cur.execute("select count(*) from buys where userid = %s and movieid = %s and endtime is null", [userID, id])
        if cur.fetchone()[0] > 0:
            mov['purchased'] = True
        else:
            mov['purchased'] = False
        
        cur.execute("select count(*) from buys where userid = %s and movieid = %s and endtime >= %s", [userID, id, date.today()])
        if cur.fetchone()[0] > 0:
            mov['rented'] = True
        else:
            mov['rented'] = False
        
        # we are checking if the user has added this movie to cart already
        cur.execute("select count(*) from carts where userid = %s and movieid = %s and isrent = %s", [userID, id, False])
        if cur.fetchone()[0] > 0:
            mov['inCartPurchase'] = True
        else:
            mov['inCartPurchase'] = False

        cur.execute("select count(*) from carts where userid = %s and movieid = %s and isrent = %s", [userID, id, True])
        if cur.fetchone()[0] > 0:
            mov['inCartRent'] = True
        else:
            mov['inCartRent'] = False

    if is_admin(userID):
        mov["numpurchase"] = countPurchase(id)
        cur.execute("select ispromoted from movies where id = {}".format(id))
        mov['ispromoted'] =  cur.fetchone()[0]

    mov['id'] = id
    cur.close()
    return mov

# Checks if language is in an acceptable format
def langcheck(lang):
    try:
        languages.get(alpha2=lang)
        return lang
    except:
        pass

    try:
        language = languages.get(name=lang)
        if language is not None:
            return language.part1
    except:
        pass

    return None


def createMovie(language, title, runtime, age, release_date, overview, rent_price, purchase_price, url, genres, keywords, homepage = 'missing'):
    '''
        create a movie with given information
        language = ISO639-1
        title, age, release_date, overview, url: str
        runtime, rentprice, purchaseprice: double
        genres, keywords: list        
    ''' 
    # Check if language is valid
    lang = langcheck(language)
    if lang is None:
        print("Invalid Language")
        return None

    cur = conn.cursor()
    cur.execute("SELECT max(id)+1 FROM movies")
    id = cur.fetchone()[0]
    if isduplicate(id, title, release_date):
        cur.close()
        return -1
    # Insert movie into movies table
    ## Safe way of inserting user submitted arguments
    query = """ INSERT INTO movies (id, title, adult, original_language, overview, release_date, runtime, rentprice, purchaseprice, url, ispromoted)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, false)"""
    try:
        cur.execute(query, [id, title, age, lang, 
                    overview, release_date, runtime, rent_price, purchase_price, url])
        titleArr.append((id, title))
        updateTfIdf(id, title, overview) # add this to update the tfidf dictionary
        cur.execute("COMMIT")
    except psycopg2.IntegrityError:
        conn.rollback()
        cur.close()
        return None


    # Insert list of genres into moviegenre
    for genre in genres:
        cur.execute(""" SELECT id from genres
                        WHERE LOWER(name) = LOWER(%s) """, [genre])
        gid = cur.fetchone()
        
        if gid is not None:
            cur.execute(""" INSERT INTO moviegenre (movieid, genre)
                            VALUES(%s, %s)""", [id, gid[0]])
            cur.execute("COMMIT")

            # Testing code to print output on insert
            print("Genre inserted: {}, '{}'".format(gid[0], genre))

    # Insert list of keywords into moviekeywords
    for k in keywords:
        cur.execute(""" SELECT * from keywords
                        WHERE LOWER(word) = LOWER(%s) """, [k])
        kid = cur.fetchone()

        if kid is not None:
            cur.execute(""" INSERT INTO moviekeyword (movieid, keyword)
                            VALUES(%s, %s)""", [id, kid[0]])
            cur.execute("COMMIT")

            # Testing code to print output on insert
            print("Keyword inserted: {}, '{}'".format(kid[0], k))
    cur.close()
    return id

def check_complete_movie(input):
    '''
        :param 1: input in dictionary format
        :return if the input is a complete movie information
    '''
    if not 'language' in input: 
        return (False, 'missing language')
    if not 'title' in input: 
        return (False, 'missing title')
    if not 'runtime' in input:
        return (False, 'missing runtime')
    if not 'age_rating' in input:
        return (False, 'missing age rating')
    if not 'release_date' in input:
        return (False, 'missing release date')
    if not 'rentprice' in input:
        return (False, 'missing rent price')
    if not 'purchaseprice' in input:
        return (False, 'missing purchase price')
    if not 'url' in input:
        return (False, 'missing url')
    if not 'genres' in input:
        return (False, 'missing genre')
    if not 'keywords' in input:
        return (False, 'missing keyword')
    # if not 'imdbid' in input:
    #     return (False, 'missing imdbid')

    return (True, 'Success')

def promote_movie(movieid, promote):
    query = '''
            UPDATE movies SET ispromoted = %s WHERE id = %s
        '''
    cur = conn.cursor()
    try:
        cur.execute(query, [promote, movieid])
        cur.execute("COMMIT")
    except psycopg2.IntegrityError:
        conn.rollback()
        cur.close()
        return -1  
    cur.close() 
    return 1

def edit_movie(id, language, title, runtime, age, release_date, overview, rent_price, purchase_price, url, genres, keywords):
    '''
        edit the movie with the given information
    '''
    # Check if language is valid
    lang = langcheck(language)
    if lang is None:
        print("Invalid Language")
        return None
    # Check if movie exists
    cur = conn.cursor()
    cur.execute(""" SELECT * FROM movies
                    WHERE id = %s""", [id])
    if cur.fetchone() is None:
        print("Movie with id {} does not exist".format(id))
        cur.close()
        return None
    
    if isduplicate(id, title, release_date):
        cur.close()
        return -1

    # Change movie entry
    try:
        cur.execute(""" UPDATE movies
                    SET title = %s, adult = %s, original_language = %s, overview = %s, release_date = %s, runtime = %s, 
                    rentprice = %s, purchaseprice = %s, url = %s
                    WHERE id = %s""", [title, age, language, overview, 
                    release_date, runtime, rent_price, purchase_price, url, id])
        updateTfIdf(id, title, overview)
    except psycopg2.IntegrityError:
        conn.rollback()
        cur.close()
        return None

    # Add genres to the table
    for genre in genres:
        cur.execute(""" SELECT id FROM genres
                        WHERE LOWER(name) = LOWER(%s)""", [genre])
        gid = cur.fetchone()
        if not gid is None:
            cur.execute(""" SELECT * FROM moviegenre
                            WHERE movieid = %s
                            AND genre = %s""", [id, gid[0]])
            if cur.fetchone() is None:
                cur.execute(""" INSERT INTO moviegenre (movieid, genre)
                                VALUES(%s, %s)""", [id, gid[0]])
                cur.execute("COMMIT")
                print("inserted moviegenre({},{})".format(id, gid[0]))

    # Remove missing genres from the table
    cur.execute(""" SELECT g.name, g.id FROM moviegenre m
                    INNER JOIN genres g ON m.genre = g.id
                    WHERE m.movieid = %s""", [id])
    
    for genre in cur.fetchall():
        # genre[0] is genre name, genre[1] is genre id
        if not genre[0] in genres:
            cur.execute(""" DELETE FROM moviegenre
                            WHERE movieid = %s
                            AND genre = %s""", [id, genre[1]])
            cur.execute("COMMIT")
            print("deleted moviegenre (%s, %s)", [id, genre[1]])

    # Add keywords to the table
    for k in keywords:
        cur.execute(""" SELECT id FROM keywords
                        WHERE LOWER(word) = LOWER(%s)""", [k])
        
        kid = cur.fetchone()
        if not kid is None:
            cur.execute(""" SELECT * FROM moviekeyword
                            WHERE movieid = %s
                            AND keyword = %s""", [id, kid[0]])
            if cur.fetchone() is None:
                cur.execute(""" INSERT INTO moviekeyword(movieid, keyword)
                                VALUES(%s, %s)""", [id, kid[0]])
                cur.execute("COMMIT")
                print("inserted moviekeyword({},{})".format(id, kid[0]))

    # Remove missing keywords from the table
    cur.execute(""" SELECT k.word, k.id FROM keywords k
                    INNER JOIN moviekeyword m ON m.keyword = k.id
                    WHERE m.movieid = %s""", [id])

    for k in cur.fetchall():
        if not k[0] in keywords:
            cur.execute(""" DELETE FROM moviekeyword
                            WHERE movieid = %s
                            AND keyword = %s""", [id, k[1]])
            cur.execute("COMMIT")

            print("deleted moviekeyword ({}, {})".format(id, k[1]))
    cur.close()
    return id

def retrieve_options():
    # retrieve genres
    cur = conn.cursor()
    genres = [gname for gid, gname in genreArr]
    # retrieve keywords
    keywords = [kword for kid, kword in keywordArr]
    # cur.execute("select id, title from movies")
    # titleArr = cur.fetchall()
    # retrieve movie titles
    titles = [title for mid, title in titleArr]
    cur.close()
    age = ['R', 'PG-13', 'PG', 'G', 'NC-17']

    return {'genres':genres, 'keywords':keywords, 'ageRatings':age, 'titles':titles}

def retrieve_titles():
    cur = conn.cursor()
    cur.execute("SELECT title FROM Movies")
    arr = cur.fetchall()
    cur.close();
    return [title for title, in arr]

def key_match(key):
    '''
        find all keywords that match key
    '''
    cur = conn.cursor()
    cur.execute(""" SELECT word FROM keywords
                    WHERE word LIKE '%{}%'""".format(key))
    keywords = []
    for k in cur.fetchall():
        keywords.append(k[0])
    cur.close()
    return keywords

if __name__ == '__main__':
    # print(MovieJson(84152, False))
    '''
    print(langcheck('English'))
    print(MovieJson(createMovie(language = 'en', title = 'test0', runtime = 90,
                age = True, release_date = '2015-01-01', overview = "A test Movie",
                rent_price = 3, purchase_price = 6, genres = ['Comedy', 'Family', 'Fantasy'],
                keywords = ['jealousy', 'boy', 'toy', 'friends', 'rivalry', 'new home'],
                url="www.picture.com"), True))
    
    print(MovieJson(edit_movie(id=0, imdbid='tt00', language='en', title='newtitle', runtime=60,
                               age=True, release_date='2017-01-01', overview="A test Movie Edited",
                               rent_price=3, purchase_price=6, genres=['Family', 'Fantasy', 'Action'],
                               keywords=['jealousy', 'boy', 'toy',
                                         'friends', 'rivalry', 'robbery'],
                               url="www.anewpicture.com"), True))
    retrieve_options()
    print(key_match('toy'))
    '''
    print("movie")