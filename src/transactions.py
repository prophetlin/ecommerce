import json
import datetime
from connectDB import conn

def rent_data(start, end, title):
    '''
       :param 1: start date in yyyy-mm-dd format
       :param 2: end date in yyyy-mm-dd format
       :param 3: title, in string format
       :return dictionary describes the rental data follows the API format
    '''
    # if no title given, then title equals any
    if not title: title = '%'
    # Finds purchases made in between start and end period
    cur = conn.cursor()
    cur.execute(""" SELECT m.id, m.title, u.id, u.email, b.ptime, b.endtime
                    FROM buys b
                    INNER JOIN users u on u.id = b.userID
                    INNER JOIN movies m on m.id = b.movieID
                    WHERE (b.ptime >= %s
                    AND b.ptime <= %s
                    AND b.endtime IS NOT NULL
                    AND m.title LIKE %s)
                    ORDER BY b.ptime DESC""", [start, end, title])

    rows = cur.fetchall()
    data = list()
    cur.close()
    # Change found rows into a list of dictionaries
    for row in rows:
        dic = {"movieID": row[0], "movieTitle": row[1],
               "userID": row[2], "userEmail": row[3],
               "pdate": row[4], "endDate": row[5]}
        data.append(dic)
    return data


def rent_json(start, end, title):
    return {"result": rent_data(start, end, title)}


def purchase_data(start, end, title):
    '''
       :param 1: start date in yyyy-mm-dd format
       :param 2: end date in yyyy-mm-dd format
       :param 3: title, in string format
       :return dictionary describes the purchase data follows the API format
    '''
    # if no title given, then title equals any
    if not title: title = '%'
    # Finds purchases made in between start and end period
    cur = conn.cursor()
    cur.execute(""" SELECT m.id, m.title, u.id, u.email, b.ptime, b.endtime
                    FROM buys b
                    INNER JOIN users u on u.id = b.userID
                    INNER JOIN movies m on m.id = b.movieID
                    WHERE (b.ptime >= %s
                    AND b.ptime <= %s
                    AND b.endtime IS NULL
                    AND m.title LIKE %s)
                    ORDER BY b.ptime DESC""", [start, end, title])

    rows = cur.fetchall()
    data = list()
    cur.close()
    # Change found rows into a list of dictionaries
    for row in rows:
        dic = {"movieID": row[0], "movieTitle": row[1],
               "userID": row[2], "userEmail": row[3],
               "pdate": row[4]}
        data.append(dic)
    return data


def purchase_json(start, end, title):
    return {"result": purchase_data(start, end, title)}


if __name__ == '__main__':
    print('Purchases:')
    