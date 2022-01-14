# 
# To test change to root directory and run python -m unittest test/testuserpurchase.py
# if you have python3 installed run python3 -m unittest test/testuserpurchase.py
#
from server import app
import unittest
import json
import sys
sys.path.append('./src')
from User import getUserID, modifyCart, getCart, makePurchase
testapp = app.test_client()
class TestUserPurchases(unittest.TestCase):
    def test_purchase_movie(self):
        # Given
        payload = json.dumps({
            "email": "Dean@gmail.com",
            "password": "qG3Jd4dX_1",
        })
        response = testapp.post('/api/auth/login', json=json.loads(payload))
        field = response.get_json()
        token = field['token']
        userid = getUserID(token)
        movieid = 2
        isrent = False
        tp =  1
        result = modifyCart(userid, movieid, isrent, tp)
        self.assertEqual(1, result)
        modifyCart(userid, movieid, isrent, 0)
    
    def test_fail_add_dupe_movie(self):
        # This will fail if it doesnt commit
        # Given
        payload = json.dumps({
            "email": "Dean@gmail.com",
            "password": "qG3Jd4dX_1",
        })
        response = testapp.post('/api/auth/login', json=json.loads(payload))
        field = response.get_json()
        token = field['token']
        userid = getUserID(token)
        movieid = 2
        isrent = False
        tp =  1

        modifyCart(userid, movieid, isrent, tp)
        result = modifyCart(userid, movieid, isrent, tp)
        self.assertEqual(-1, result)
        modifyCart(userid, movieid, isrent, 0)
    
    # test NC-17 movies
    def test_fail_movie_age(self):
        # Given
        payload = json.dumps({
            "email": "Dean@gmail.com",
            "password": "qG3Jd4dX_1",
        })
        response = testapp.post('/api/auth/login', json=json.loads(payload))
        field = response.get_json()
        token = field['token']
        userid = getUserID(token)
        movieid = 3272
        isrent = False
        tp =  1

        modifyCart(userid, movieid, isrent, tp)
        result = modifyCart(userid, movieid, isrent, tp)
        self.assertEqual(-2, result)
        modifyCart(userid, movieid, isrent, 0)