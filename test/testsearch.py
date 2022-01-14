# 
# To test change to root directory and run python -m unittest test/testsearch.py
# if you have python3 installed run python3 -m unittest test/testsearch.py
#

from server import app
import unittest
import json

testapp = app.test_client()
class TestUserSearch(unittest.TestCase):
    def test_search_title(self):
        response = testapp.get('/api/search', query_string='q=toy&category=Title')
        self.assertEqual(200, response.status_code)
        field = response.get_json()
        self.assertEqual(True, len(field['movies']) > 0)
        self.assertEqual('Title', field['category'])
    
    def test_search_genre_1(self):
        response = testapp.get('/api/search', query_string='q=nosuch&category=Genre')
        self.assertEqual(200, response.status_code)
        field = response.get_json()
        self.assertEqual(0, len(field['movies']))
    
    def test_search_genre_2(self):
        response = testapp.get('/api/search', query_string='q=science%20fiction&category=Genre')
        self.assertEqual(200, response.status_code)
        field = response.get_json()
        self.assertNotEqual(0, len(field['movies']))
    