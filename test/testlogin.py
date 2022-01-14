# 
# To test change to root directory and run python -m unittest test/testlogin.py
# if you have python3 installed run python3 -m unittest test/testlogin.py
#
from server import app
import unittest
import json
from User import checkinfo
testapp = app.test_client()
class TestUserLogin(unittest.TestCase):
    def test_successful_login(self):
        # Given
        email = "admin@gmail.com"
        password = "admin"
        payload = json.dumps({
            "email": email,
            "password": password
        })

        response = testapp.post('/api/auth/login', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(200, response.status_code)
        self.assertNotEqual(None, field['token'])
    
    def test_fail_login(self):
        # Given
        email = "admin@gmail.com"
        password = "wrong_12345"
        payload = json.dumps({
            "email": email,
            "password": password
        })
        
        response = testapp.post('/api/auth/login', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_fail_register(self):
        email = "admin@gmail.com"
        password = "admin"
        birthDate = "2000-02-10"
        payload = json.dumps({
            "email": email,
            "password": password,
            "birthDate": birthDate
        })
        response = testapp.post('/api/auth/register', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_fail_register_password_1(self):
        email = "newuser@gmail.com"
        password = "admin_1"
        birthDate = "2000-02-10"
        payload = json.dumps({
            "email": email,
            "password": password,
            "birthDate": birthDate
        })
        response = testapp.post('/api/auth/register', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_fail_register_password_2(self):
        email = "newuser@gmail.com"
        password = "admin("
        birthDate = "2000-02-10"
        payload = json.dumps({
            "email": email,
            "password": password,
            "birthDate": birthDate
        })
        response = testapp.post('/api/auth/register', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_fail_register_password_3(self):
        email = "newuser@gmail.com"
        password = "1234567asdfg"
        birthDate = "2000-02-10"
        payload = json.dumps({
            "email": email,
            "password": password,
            "birthDate": birthDate
        })
        response = testapp.post('/api/auth/register', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_fail_register_password_4(self):
        email = "newuser@gmail.com"
        password = "______asdfg"
        birthDate = "2000-02-10"
        payload = json.dumps({
            "email": email,
            "password": password,
            "birthDate": birthDate
        })
        response = testapp.post('/api/auth/register', json=json.loads(payload))
        field = response.get_json()
        self.assertEqual(400, response.status_code)
    
    def test_email_valid(self):
        self.assertEqual(None, checkinfo("helloworld@gmail.com", "12345_abs"))
        self.assertEqual(None, checkinfo("helloworld@student.unsw.edu.au", "12345_abs"))
        self.assertEqual(None, checkinfo("helloworld@student.unsw.edu.au", "12345*abs"))
        self.assertEqual(None, checkinfo("helloworld@student.unsw.edu.au", "aa11*abs"))
        self.assertEqual(None, checkinfo("helloworld@student.unsw.edu.au", "1*12_a-A"))
    
    def test_password_invalid(self):
        self.assertIsNotNone(checkinfo("@student", "1*12_a-A"))
        self.assertIsNotNone(checkinfo("helloworld@student.unsw.edu.au", "bad password123_"))
        self.assertIsNotNone(checkinfo("haha@student.unsw.edu.au", "short1_"))
        
