from connectDB import mydict, conn, keywordArr, genreArr
import json
import os
import numpy as np
import pandas as pd
import regex
from collections import defaultdict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from helper import getBaysianrating

def errorLimit(string):
    '''
        returns the maximum levenshtein distance error when matching str
    '''
    diffPercent = 0.25  #max % diff of two strings to still be considered a match
    return int(len(string) * diffPercent)

def regFuzzPattern(pattern, e=0):
    '''
        returns regex fuzzy match pattern
    '''
    return r'({}){{e<={}}}'.format(pattern, e)

def id_to_dict(movieIDArr):
    ''' 
        :movieidarray, an integer list of all the interested movie id
        :return list of movie info jsons
    '''
    query = '''
        select m.id, m.title, m.url, m.avgrating, m.numrating, m.release_date
        from movies as m 
        where m.id = ANY(%s)
    '''
    cur = conn.cursor()
    cur.execute(query, [movieIDArr])
    movieArr = cur.fetchall()
    cur.execute("select avg(rating) from ratings")
    R = cur.fetchone()[0]
    # convert details to movie json objs
    movieJsonDict = {}
    for mv in movieArr:
        v = {}
        v['id'] = mv[0]
        v['title'] = mv[1]
        v['url'] = mv[2]
        v['rating'] = getBaysianrating(mv[3], R, mv[4])
        v['releaseDate'] = mv[5]
        movieJsonDict[mv[0]]=v
    cur.close()
    return movieJsonDict



def search_title(text):
    '''
        :param 1: text, describe the searched title
        :return a list of moveis that has similar title in dictinoary format
    '''
    cur = conn.cursor()
    # get list of movie id, titles
    cur.execute("select id, lower(title) from movies")
    movieList = cur.fetchall()
    text = text.lower()
    matchDict = defaultdict(int)

    # get token words from text
    tokens = [w for w in text.split() if len(w) > 1]
    tokenStr = ''.join(tokens)
    tokenLength = len(tokenStr)


    for movieID, title in movieList:
        # match assuming user entered title or part of title correctly
        match = regex.search(regFuzzPattern(text, errorLimit(text)), title, regex.BESTMATCH)
        if match:
            matchDict[movieID] += ((len(text) - sum(match.fuzzy_counts))/len(text))
        
        # if no token words continue
        if (tokenLength == 0): continue
        # match assuming user entered token words in correct order but some are missing
        match = regex.search(regFuzzPattern(r'.*\s.*'.join(tokens), errorLimit(tokenStr)), title, regex.BESTMATCH)
        if match:
            matchDict[movieID] += ((tokenLength - sum(match.fuzzy_counts))/tokenLength)
        
        # match assuming user entered some token words in random order
        for word in tokens:
            match = regex.search(regFuzzPattern(word, errorLimit(word)), title, regex.BESTMATCH)
            if match:
                matchDict[movieID] += ((len(word) - sum(match.fuzzy_counts))/tokenLength)

    # get movie data from matchDict
    sortedIDArr = [mid for mid, count in sorted(matchDict.items(), key=lambda item: item[1], reverse=True)]
    jsonDict = id_to_dict(sortedIDArr)
    result = {}
    result['category'] = 'Title'
    result['movies'] = [jsonDict[mid] for mid in sortedIDArr]
    cur.close()
    return result
    
def search_keyword(text):
    '''
        :param 1: text, describe the searched keyword
        :return a list of moveis that has this keyword in dictinoary format
    '''
    cur = conn.cursor()
    # fetch keywords
    # split text into keywords by '|'
    foundKeywords = text.split('|')
    # find movies matching found keywords
    cur.execute('''
        SELECT m.id, m.title
        FROM Movies m 
            INNER JOIN Moviekeyword mk
            ON m.id = mk.movieid
            INNER JOIN Keywords k
            on mk.keyword = k.id
        WHERE k.word ilike ANY(%s)
        GROUP BY m.id, m.title
        HAVING COUNT(distinct k.word) = %s
    ''', 
    [foundKeywords, len(foundKeywords)])

    # retreive movie data from matched ids
    tupples = cur.fetchall()
    idArr = [mid for mid, title in tupples]
    jsonDict = id_to_dict(idArr)
    result = {}
    result['category'] = 'Keyword'
    result['movies'] = [v for k, v in jsonDict.items()]
    result['keys'] = foundKeywords
    cur.close()
    return result

def search_genre(text):
    print(text)
    '''
        :param 1: text, describe the searched genre
        :return a list of moveis that has this genre in dictinoary format
    '''
    cur = conn.cursor()
    # fetch genres
    # split text into genres by '|'
    foundGenres = text.split('|')
    # find movies matching found genres
    cur.execute('''
        SELECT m.id, m.title
        FROM Movies m 
            INNER JOIN Moviegenre mg
            ON m.id = mg.movieid
            INNER JOIN Genres g
            on mg.genre = g.id
        WHERE g.name ilike ANY(%s)
        GROUP BY m.id, m.title
        HAVING COUNT(distinct g.name) = %s
    ''', 
    [foundGenres, len(foundGenres)])

    # retreive movie data from matched ids
    tupples = cur.fetchall()
    idArr = [mid for mid, title in tupples]
    jsonDict = id_to_dict(idArr)
    result = {}
    result['category'] = 'Genre'
    result['movies'] = [v for k, v in jsonDict.items()]
    result['keys'] = foundGenres
    cur.close()
    return result
    
def overview_search(text):
    '''
        :param 1: text, the search term
        :return the list of 10 movies that best match the search query
    '''
    dataf = pd.DataFrame(mydict.items(), columns=['id', 'overview'])
    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(dataf['overview'])
    #print(X)
    query = text
    query_vec = vectorizer.transform([query])
    #print(query_vec)
    results = cosine_similarity(X,query_vec).reshape((-1,))
    res = []
    for i in results.argsort()[-10:][::-1]:
        res.append(int(dataf.iloc[i, 0]))
    #print(res)
    res.reverse()
    #print(res)
    jsonDict = id_to_dict(res)
    result = {}
    result['category'] = 'Overview'
    result['movies'] = [v for k, v in jsonDict.items()]
    return result

if __name__ == '__main__':
    print("execute search")