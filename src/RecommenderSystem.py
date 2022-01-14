from connectDB import conn
import numpy as np 
import pandas as pd 
from surprise import KNNWithMeans, KNNBasic, SVD, KNNBaseline
from surprise import Dataset
from surprise import accuracy
from surprise import Reader
import os
import json
from surprise.model_selection import train_test_split
import time
from helper import getBaysianrating, checkage

def convert_to_recommendation(mylist, category="Top Rated"):
    '''
        :param 1: list of movieid
        :param 2: category for recommendation
        :return json object, exact format of the api 
    '''
    if len(mylist) == 0:
        mylist.append(-1)
    mylist = tuple(mylist)
    cur = conn.cursor()
    cur.execute("select avg(rating) from ratings")
    R = cur.fetchone()[0]
    query = '''
        select m.id, m.title, m.url, m.avgrating, m.rentprice, m.purchaseprice, m.numrating, m.release_date
        from movies as m
        where m.id in %s
    '''
    cur.execute(query, [mylist])
    ret = []
    res = cur.fetchall()
    for curr in res:
        v = None
        if curr[3] != None:
            v = getBaysianrating(curr[3], R, curr[6])
        else:
            v = R
        ret.append([curr[0], curr[1], round(float(v), 1), curr[2], curr[4], curr[5], curr[7]])
    movielist = []
    for curr in ret:
        v = {}
        v['id'] = curr[0]
        v['title'] = curr[1]
        v['rating'] = curr[2]
        v['url'] = curr[3]
        v['rentPrice'] = curr[4]
        v['purchasePrice'] = curr[5]
        v['releaseDate'] = curr[6]
        movielist.append(v)
    res = {}
    res['category'] = category
    res['movies'] = movielist
    cur.close()
    return res

class GenreTable(object):
    '''
        This is a class for the recommendation based on Genre-correlation method
        works well for new users that has rated very little movies
    '''
    def __init__(self):
    # calculate the genre-correlation matrix
        self.genrecorr = {}
        self.genresum = {}
        self.moviegenre = {}
        cur = conn.cursor()
        cur.execute("select movieid, genre from moviegenre order by movieid")
        tup = cur.fetchall()
        cur.close()
        for i in range(0, len(tup)):
            if tup[i][0] in self.moviegenre:
                self.moviegenre[tup[i][0]].append(tup[i][1])
            else:
                self.moviegenre[tup[i][0]] = [tup[i][1]]
        # calculate the genre-correlation matrix, store in genrecorr and genresum
        pre = 0
        for i in range(1, len(tup)):
            if tup[i][0] != tup[pre][0]:
                for j in range(pre, i):
                    for k in range(j+1, i):
                        if tup[j][1] in self.genrecorr:
                            self.genrecorr[tup[j][1]][tup[k][1]] = self.genrecorr[tup[j][1]].get(tup[k][1], 0) + 1
                        else:
                            self.genrecorr[tup[j][1]] = {}
                            self.genrecorr[tup[j][1]][tup[k][1]] = 1
                        if tup[k][1] in self.genrecorr:
                            self.genrecorr[tup[k][1]][tup[j][1]] = self.genrecorr[tup[k][1]].get(tup[j][1], 0) + 1
                        else:
                            self.genrecorr[tup[k][1]] = {}
                            self.genrecorr[tup[k][1]][tup[j][1]] = 1
                        self.genresum[tup[j][1]] = self.genresum.get(tup[j][1], 0) + 1
                        self.genresum[tup[k][1]] = self.genresum.get(tup[k][1], 0) + 1
                pre = i
        
        for i in range(pre, len(tup)):
            for j in range(pre, i):
                    for k in range(j+1, i):
                        if tup[j][1] in self.genrecorr:
                            self.genrecorr[tup[j][1]][tup[k][1]] = self.genrecorr[tup[j][1]].get(tup[k][1], 0) + 1
                        else:
                            self.genrecorr[tup[j][1]] = {}
                            self.genrecorr[tup[j][1]][tup[k][1]] = 1
                        if tup[k][1] in self.genrecorr:
                            self.genrecorr[tup[k][1]][tup[j][1]] = self.genrecorr[tup[k][1]].get(tup[j][1], 0) + 1
                        else:
                            self.genrecorr[tup[k][1]] = {}
                            self.genrecorr[tup[k][1]][tup[j][1]] = 1    
                        self.genresum[tup[j][1]] = self.genresum.get(tup[j][1], 0) + 1
                        self.genresum[tup[k][1]] = self.genresum.get(tup[k][1], 0) + 1
    
    def getgenrecorr(self, g1, g2):
        '''
            get the gentre-correlation between 2 genres
            :param g1: first genre
            :param g2: second genre
            : return the correlation of the 2 genres
        '''
        if g1 == g2:
            return 1.0
        if g1 in self.genrecorr:
            if self.genresum.get(g1, 0) == 0:
                return 0.0
            return 1.0 * self.genrecorr[g1].get(g2, 0) / self.genresum.get(g1, 1)
        return 0.0
    

    def getweight(self, genre):
        '''
            :param 1 genre the user likes as a list of tuple [(genre1,),(genre2,)...]
            :return a map from movie->importance weight
        '''
        ret = {}
        for mv in self.moviegenre.items():
            for mvge in mv[1]: 
                for ge in genre:
                    ret[mv[0]] = ret.get(mv[0], 0.0) + 1.0 * self.getgenrecorr(ge[0], mvge)    
        return ret

    def recommend(self, genre, movie, avgr):
        '''
            get the recommendation points for each movie in the list
            :param genre: a list for all the genre the user likes
            :param movie: a list of all movies that are candidates
            :param avgr: average rating of all movies
            : return a list, [-recommendation point, movieid]
        '''
        ret = []
        st = set()
        for guser in genre:
            st.add(guser[0])
        
        for mv in movie:
            rp = 0
            flag = False
            for mvgenre in self.moviegenre.get(mv[0], []):
                if mvgenre in st:
                    flag = True
            # the weight calculation follows the paper
            for guser in genre:
                mg = len(self.moviegenre.get(mv[0], [])) + 2    
                for mvger in self.moviegenre.get(mv[0], []):
                    if mvger in st:
                        rp += getBaysianrating(mv[1], avgr, mv[2]) * self.getgenrecorr(guser[0], mvger)
                    else:
                        if flag:
                            rp += getBaysianrating(mv[1], avgr, mv[2]) * self.getgenrecorr(guser[0], mvger) / (mg - 1)
                        else:
                            rp += getBaysianrating(mv[1], avgr, mv[2]) * self.getgenrecorr(guser[0], mvger) / mg
            
            ret.append([-rp, mv[0]])
        return ret    

class RecommenderSystem(object):
    '''
        this is the method for recommender system,
        the method contains 3 types of recommendation: collaborative filtering,
        toprated, promoted
    '''
    algo = None
    reader = None
    def __init__(self):
        cur = conn.cursor()
        cur.execute("select * from ratings")
        tupples = cur.fetchall()
        cur.close()
        self.df = pd.DataFrame(tupples, columns=['user', 'item', 'rating'])
        self.reader = Reader(rating_scale=(0, 5))
        self.data = Dataset.load_from_df(self.df[["user", "item", "rating"]], self.reader)
        self.algo = KNNBaseline(sim_options={'name': 'msd', 'min_support': 3, 'user_based': False}, bsl_options={'method': 'als', 'reg': 1, 'n_epochs': 18, 'reg_u': 5, 'reg_i': 4})
        self.algo.fit(self.data.build_full_trainset())

    
    def recommend_by_rating(self, id, title="For You", movies=None):
        '''
             recommender algorithm based of user rating and user genre preference
             :param 1: userid"
             :param 2: title of the recommendation
             :param 3: movies list if it is None, user/rec otherwise, chatbot
             :return a list of 10 movies that has the highest recommendation points
             : or return id if movies is None
        '''
        # calculate the weights given by the survey
        cur = conn.cursor()
        # get the R value
        query = '''
            select avg(rating) from ratings
        '''
        cur.execute(query)
        R = cur.fetchone()[0]
        # get the total number of ratings by a specific user
        query = '''
            select count(*) from ratings where userid = %s
        '''
        cur.execute(query, [id])
        cnt = cur.fetchone()[0]
        # check NC-17 for legal reasons
        cur.execute("select birthday from users where id = %s", [id])
        birth = cur.fetchone()[0]
        query = '''
            select id, avgrating, numrating from movies where id not in (
                select movieid from buys where userid = %s
                union
                select movieid from ratings where userid = %s
            )
        ''' 
        if checkage(birth) == 0:
            query += "and adult <> 'NC-17'"
        cur.execute(query, [id, id])
        res = cur.fetchall()
        cur.execute("select genre from surveys where userid = %s", [id])
        genre = cur.fetchall()
        recc = GenreTable()
        ret = []
        mymp = recc.getweight(genre)
        # if the user is relatively old, it is it has rated more than 2 movies
        # or it has never filled in the survey, we use the user-movie-rating based
        # collaborative filtering algorithm 
        if cnt >= 1 or len(genre) == 0:
            for curr in res:
                # use the recommendation algorithm covered in COMP4121 with 
                # grid search for the best-fit parameters
                pred = self.algo.predict(id, curr[0])
                # some additional weights to the rating
                # this solves the user preference issue 
                ww = min(round(mymp.get(curr[0], 0)), 20)
                # print(ww)
                pw = 1.02**ww
                if cnt >= 1:
                    ret.append([-pred.est * pw, curr[0]])
                else:
                    # number of rating is not enouth, we simply use the baysian rating
                    if curr[1] == None:
                        ret.append([-float(R) * pw, curr[0]])
                    else:
                        ret.append([-getBaysianrating(curr[1], R, curr[2]) * pw, curr[0]])    
        else:
            ret = recc.recommend(genre, res, R)
        cur.close()

        # sort the movies by predicted ratings
        ret.sort()

        if movies != None:
            ss = set()
            for curr in movies:
                ss.add(curr)
            for i in range(len(ret)):
                if ret[i][1] in ss:
                    return ret[i][1]
            return -1

        recommend = []
        for i in range(0, min(10, len(ret))):
            recommend.append(ret[i][1])

        # transform to the normal form
        return convert_to_recommendation(recommend, title)


    def toprated(self):
        '''
           selection criteria, the movie must have at least 90 ratings and
           has the top 10 average ratings
        '''
        cur = conn.cursor()
        cur.execute("select avg(rating) from ratings")
        R = cur.fetchone()[0]
        cur.execute('''select id, avgrating, numrating 
                        from movies
                        where numrating > 90
                        ''')
        res = cur.fetchall()
        ret = []
        for id in res:
            ret.append([-getBaysianrating(id[1], R, id[2]), id[0]])
        ret.sort()
        rett = []
        for i in range(0, min(10, len(ret))):
            rett.append(ret[i][1])
        cur.close()
        # convert to normal form
        return convert_to_recommendation(rett)
    
    def promoted(self):
        '''
          : return the top 10 average rating movies that has been promoted
        '''
        cur = conn.cursor()
        cur.execute("select id from movies where ispromoted = 't' order by avgrating desc limit 10")
        res = cur.fetchall()
        ret = []
        for id in res:
            ret.append(id[0])
        cur.close()
        # promoted movies
        return convert_to_recommendation(ret, "Promoted")
    

        