from dateutil.relativedelta import relativedelta
from datetime import date

def getBaysianrating(rating, tolaverage, tolrating):
    '''
       compute the Baysian rating of a movie
       input (select avgrating from movies, select avg(rating) from ratings, select numrating from movies)
       output the baysian rating of that movie
    '''
    N = 5 # since our database is small, we use N = 5
    if rating == None:
        return round(float(tolaverage), 1)    
    v = round(float(rating), 1)
    v = (N * float(tolaverage) + float(tolrating) * v) / (N + tolrating)
    return round(float(v), 1)

def checkage(birthday):
    '''
        :param 1: birthday in form "yyyy-mm-dd
        :return true, if the person with birthday is greater than 17 years old, otherwise, false
    '''
    birthday = str(birthday)
    year, month, day = [int(f) for f in birthday.split('-')]
    print(year, month, day)
    your_date = date(year, month, day)
    difference_in_years = relativedelta(date.today(), your_date).years
    if difference_in_years > 17:
        return 1
    return 0