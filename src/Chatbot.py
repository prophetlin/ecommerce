# 20 lines of code from https://github.com/parulnith/Building-a-Simple-Chatbot-in-Python-using-NLTK/blob/master/chatbot.py
# to handle basic conversational fucntions such as greetings, and helper messages
import io
import re
import random
import string # to process standard python strings
import warnings
import regex
import sys
from queue import Queue
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from connectDB import conn
from nltk import corpus
import warnings
warnings.filterwarnings('ignore')
import nltk
from nltk.stem import WordNetLemmatizer

sys.path.append('./src')
from Search import overview_search, regFuzzPattern, search_keyword, search_genre
from RecommenderSystem import RecommenderSystem
from Movie import MovieJson
from connectDB import genreArr, keywordArr, titleArr

nltk.download('popular', quiet=True) # for downloading packages
# uncomment the following only the first time
nltk.download('punkt', quiet=True) # first-time use only
nltk.download('wordnet', quiet=True) # first-time use only
nltk.download('stopwords', quiet=True) # first-time use only

class Chatbot(object):
    def __init__(self):
        #Reading in the corpus
        with open('train.txt','r', encoding='utf8', errors ='ignore') as fin:
            raw = fin.read().lower()
        self.sent_tokens = nltk.sent_tokenize(raw)# converts to list of sentences 
        self.word_tokens = nltk.word_tokenize(raw)
        self.greetings = ("hello", "hi", "greetings", "sup", "what's up","hey",)
        self.responses = ["hi", "hey", "*nods*", "hi there", "hello", "I am glad! You are talking to me"]
        self.lemmer = WordNetLemmatizer()
        self.remove_punct_dict = dict((ord(punct), None) for punct in string.punctuation)
        cur = conn.cursor()

        cur.execute(""" SELECT word FROM keywords""")
        self.keywords = []
        for keyword in cur.fetchall():
            self.keywords.append(keyword[0].lower())

        cur.execute(""" SELECT name FROM genres""")
        self.genres = []
        for genre in cur.fetchall():
            self.genres.append(genre[0].lower())

        cur.close()
        

    def greeting(self, sentence):
        '''
            function to check if user input is a greeting. Return greeting if it is.
            :param 1: user input
            :returns string of robot's reply
        '''
        #If user's input is a greeting, return a greeting response
        for word in sentence.split():
            if word.lower() in self.greetings:
                return random.choice(self.responses)
    
    def LemTokens(self, tokens):
        return [self.lemmer.lemmatize(token) for token in tokens]

    def answer(self, txt, id = -1):
        '''
            function to return output of chatbot
            :param 1: user input
            :param 2: user id
            :returns a dict of chatbot's response in the form {'From', 'Type', 'Content'}
        '''
        print("enter the chatbot", id)
        ret = {}
        ret['From'] = 'bot'
        user_response = txt
        user_response = user_response.lower()
        if(user_response!='bye'):
            if(user_response=='thanks' or user_response=='thank you'):
                ret['Type'] = 'text'
                ret['Content'] = "You are welcome."
            else:
                if(self.greeting(user_response)!=None):
                    ret['Type'] = 'text'
                    ret['Content'] = self.greeting(user_response)
                else:
                    (text_type, word_list) = self.parse_text(user_response, id = id)
                    if text_type == 'genre':
                        ret['Type'] = 'search link'
                        g_term = "|".join(word_list)
                        ret['Content'] = """search?q={}&category=Genre""".format(g_term)
                    elif text_type == 'keyword':
                        ret['Type'] = 'search link'
                        k_term = "|".join(word_list)
                        ret['Content'] = """search?q={}&category=Keyword""".format(k_term)
                    elif text_type == 'movie':
                        ret['Type'] = 'movie'
                        movie_id = word_list[0]
                        ret['Content'] = MovieJson(movie_id, id)
                    elif text_type == 'N/A':
                        ret['Type'] = 'text'
                        ret['Content'] = self.response(txt)
                    else:
                        ret['Type'] = 'text'
                        ret['Content'] = word_list
        
        else:
            ret['Type'] = 'text'
            ret['Content'] = "Bye! take care!"            
        return ret
    
    def LemNormalize(self, text):
        return self.LemTokens(nltk.word_tokenize(text.lower().translate(self.remove_punct_dict)))

    # Generating response
    def response(self, user_response):
        '''
            generate generic response to user query
            :param 1: user query
            :returns string for robot reply
        '''
        robo_response=''
        self.sent_tokens.append(user_response)
        TfidfVec = TfidfVectorizer(tokenizer=self.LemNormalize, stop_words='english')
        tfidf = TfidfVec.fit_transform(self.sent_tokens)
        vals = cosine_similarity(tfidf[-1], tfidf)
        idx=vals.argsort()[0][-2]
        flat = vals.flatten()
        flat.sort()
        req_tfidf = flat[-2]
        try:
            self.sent_tokens.remove(user_response)
        except ValueError:
            print("error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            print(self.sent_tokens)

        if(req_tfidf==0):
            robo_response = robo_response + "I am sorry! I don't understand you"
            return robo_response
        else:
            robo_response = robo_response + self.sent_tokens[idx]
            return robo_response

    # Self written response function
    def parse_text(self, text, id = -1):
        '''
            function to read user input and select the output desired
            :param 1: user input
            :param 2: user id
            :returns a list of [type, [movieID]]
        '''
        # Remove all puncuation but dashes from user text
        query = re.sub("""[^\w'-]""", ' ', text.lower())
        words = query.split()
        stop_words = set(corpus.stopwords.words('English'))
        custom_stop = {'search', 'profile', 'purchase', 'register', 'movie', 'help'}
        stop_words |= custom_stop
        
        # Find fully matching titles
        for mov_id, mov in titleArr:
            pattern = r'\b{}\b'.format(regFuzzPattern(mov.lower(), 0))
            match = regex.search(pattern, text, regex.BESTMATCH)
            if match:
                return ('movie', [mov_id])

        total = 0
        gens = []
        keys = []

        prev_words = []
        k_count = 0
        g_count = 0
        for word in words:
            if word not in stop_words:
                # Total currently increments at every split string. This would mean that there might be a lot of checks for a word with a hyphen
                total += 1

                # For words with dash in it, will have to check
                if '-' in word:
                    # Check the whole word as a keyword
                    token = word.replace('-', ' ')
                    res = self.word_check(token)
                    if res == 'g':
                        gens.append(token)
                        g_count += 1
                    if res == 'k':
                        keys.append(token)
                        k_count += 1

                    # Check words separately after splitting with hyphen
                    tokens = word.split('-')
                    for w in tokens:
                        if w not in stop_words:
                            res = self.word_check(w)
                            if res == 'g':
                                gens.append(w)
                                g_count += 1
                            if res == 'k':
                                keys.append(w)
                                k_count += 1
                else:
                    res = self.word_check(self.lemmer.lemmatize(word))
                    print("{} = {}".format(self.lemmer.lemmatize(word), res))
                    if res == 'g':
                        gens.append(word)
                        g_count += 1
                    if res == 'k':
                        keys.append(word)
                        k_count += 1

                # Check concatenations with previous words to check for multi word keywords
                if prev_words:
                    word_to_check = word
                    for w in prev_words:
                        word_to_check = "{} {}".format(w, word_to_check)
                        res = self.word_check(word_to_check)
                        # print("{} = {}".format(word_to_check, res))
                        if res == 'g':
                            gens.append(word_to_check)
                            g_count += 1
                        if res == 'k':
                            keys.append(word_to_check)
                            k_count += 1
                
                prev_words.insert(0, word)

            else:
                prev_words.clear()

            print("total: {}, g_count: {}, k_count: {}".format(total, g_count, k_count))

        if total == 0 or (g_count == 0 and k_count == 0):
            return ('N/A', [])
        g_ratio = g_count/total
        k_ratio = k_count/total
        print("total: {}, g/t: {}, k/t: {}".format(total, g_ratio, k_ratio))

        # Cases where either genres or keywords are dominant and so search result is returned
        if g_ratio > 0.5:
            return ('genre', gens)
        if k_ratio > 0.5:
            return ('keyword', keys)

        # Cases to compare genres and keywords but not if search query is too long
        if g_count / (g_count + k_count) > 0.75 and g_ratio > 0.05:
            return ('genre', gens)
        if k_count / (g_count + k_count) > 0.8 and k_ratio > 0.15:
            return ('keyword', keys)

        # Final case: Where insufficient genres and keywords are found, hence it will be a search
        g_search = search_genre(" ".join(gens))['movies']
        k_search = search_keyword(" ".join(keys))['movies']

        gens = set()
        for gen in g_search:
            gens.add(gen['id'])

        keys = set()
        for key in k_search:
            keys.add(key['id'])

        matches = gens.intersection(keys)
        mov_rec = -1
        # If there are results from both keys and genres
        if matches:
            # If user is not logged in
            if id == -1:
                return ('movie', [list(matches)[0]])

            # Use recommender if user is logged in
            recommender = RecommenderSystem()
            print("print matches", matches)
            mov_rec = recommender.recommend_by_rating(id=id, movies=list(matches))
            print(mov_rec)
        else:

            # Check if gens and keys are empty
            if not gens.union(keys):
                return ('N/A', [])

            # If user is not logged in
            if id == -1:
                print("here we are--------------", g_search[0])
                return ('movie', [list(gens.union(keys))[0]])
            print("this is the case")
            # Use recommender if user is logged in
            recommender = RecommenderSystem()
            mov_rec = recommender.recommend_by_rating(id = id, movies = list(gens.union(keys)))
        if mov_rec == -1:
            return ('text', "no movie you have never seen met this criteria, search for something else")
        return ('movie', [mov_rec])

    def word_match(self, text, word_list):
        matches = []
        for word in word_list:
            match = regex.search(regFuzzPattern(word, 0), text, regex.BESTMATCH)
            if match:
                print("found: {}".format(word))
                matches.append(word)

        return matches

               
    def word_check(self, word):
        '''
            check if word is a genre, a keyword or neither
            :param 1: word to check
            :return a character, 'g' if genre, 'k' if keyword, '' if neither
        '''
        if word in self.genres:
            return 'g'
        if word in self.keywords:
            return 'k'
        return ''


# Create instance of chatbot to ensure only one copy of chatbot has to be initialised
bot = Chatbot()

if __name__ == '__main__':
    if 'car wash' in bot.keywords:
        print('True')
    print('input id: ')
    inp = input()
    if inp == '0':
        id = -1
    else:
        id = int(inp)

    while(inp != 'exit'):
        print("Parse Text: ")
        inp = input()
        print(bot.answer(inp, id))
    print(set(corpus.stopwords.words('English')))
    print(bot.answer("I want to see an action movie"))
    # print("finish training")
    # print(bot.answer("what is a chatbot?"))
    # print(bot.answer("who is Alan Turing?"))

