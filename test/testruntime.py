import unittest
import time
import psycopg2
DB_HOST = 'database-1.cvbfpjmrwtct.us-east-2.rds.amazonaws.com'
DB_NAME = 'movieflix2'
DB_USER = 'postgres'
DB_PASS = '2XoPt1Iv5EMHp53b4t5T'
DB_PORT = '5432'
class TestUserLogin(unittest.TestCase):
    def test_performance(self):
        conn = psycopg2.connect(database = DB_NAME, user=DB_USER, password=DB_PASS, host=DB_HOST,port=DB_PORT)
        print('connect to remote db success')
        start = time.time()
        cur = conn.cursor()
        query = '''
            select avg(rating), count(*) from ratings
        '''
        cur.execute(query)
        tup = cur.fetchone()
        R, N = tup[0], tup[1]
        query = '''
            select m.id, m.numrating, m.avgrating
            from movies as m
        '''        
        cur.execute(query)
        li = cur.fetchall()
        N = min(N, 5)
        for v in li:
            if v[2] == None:
                print(v[0], v[1], R)
            else:
                print(v[0], v[1], N * R / (N + v[1]) + v[1] * v[2] / (N + v[1]))
        end = time.time()
        print(end - start)
        assert(end - start <= 10.0)