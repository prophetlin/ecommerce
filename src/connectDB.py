import psycopg2
import pandas as pd
import sys
DB_HOST = 'database-1.cvbfpjmrwtct.us-east-2.rds.amazonaws.com'
DB_NAME = 'movieflix2'
DB_USER = 'postgres'
DB_PASS = '2XoPt1Iv5EMHp53b4t5T'
DB_PORT = '5432'

if len(sys.argv) > 1 and sys.argv[1] == "haha":
    DB_HOST = 'localhost'
    DB_NAME = 'movie3'
    DB_USER = 'postgres'
    DB_PASS = '19990115'
    DB_PORT = '5434'

conn = psycopg2.connect(
    database = DB_NAME, 
    user=DB_USER, 
    password=DB_PASS, 
    host=DB_HOST,
    port=DB_PORT
)

print('connect to remote db success')

cur = conn.cursor()
cur.execute("select id, title, overview from movies")
mydict = {}
for tup in cur.fetchall():
    mvid, title, overview = tup[0], tup[1], tup[2]
    title += '. '
    title += overview
    mydict[mvid] = title

cur.execute("SELECT id, word FROM Keywords")
keywordArr = cur.fetchall()
cur.execute("SELECT id, name FROM Genres")
genreArr = cur.fetchall()
cur.execute("SELECT id, title FROM Movies")
titleArr = cur.fetchall()