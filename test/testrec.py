# 
# To test change to root directory and run python -m unittest test/testlogin.py
#
import unittest
import json
import sys
from os import path
sys.path.append('./src')
from RecommenderSystem import RecommenderSystem

class TestUserRec(unittest.TestCase):
    def test_successful_rec(self):
        # Given
        
        r = RecommenderSystem()
        mv = r.recommend_by_rating(673, movies=[12, 452, 6122])
        self.assertNotEqual(mv, -1)
        mv = r.recommend_by_rating(673, movies=[-1, -2, -3])
        self.assertEqual(mv, -1)
        
    
        
