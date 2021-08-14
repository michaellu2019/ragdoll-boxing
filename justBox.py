# -*- coding: utf-8 -*-
"""
Created on Mon May  3 12:32:57 2021

@author: anjal
"""

import datetime
import sqlite3


example_db = '/var/jail/home/team13/final_project/scores.db'


def request_handler(request):
    if (request['method'] == 'POST'):
        # this is a post request
        if('user' in request['form']):
            user = str(request['form']['user'])
        if('score' in request['form']):
            score = int(request['form']['score'])
        
        conn = sqlite3.connect(example_db)  # connect to that database (will create if it doesn't already exist)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS scores (user text, score int, timing timestamp );''') # run a CREATE TABLE command
        c.execute('''INSERT into scores VALUES (?,?,?);''', (user,score,datetime.datetime.now()))
        conn.commit()
        conn.close()

        return "POST SCORE: Success"
    else:
        # this is a get request

        if 'user' in request['values']:
            user = request['values']['user']
            conn = sqlite3.connect(example_db)  # connect to that database (will create if it doesn't already exist)
            c = conn.cursor()
            score_for_user = c.execute('''SELECT score FROM scores WHERE user = ? ORDER BY score DESC;''',(user,)).fetchall()[0][0]
            conn.commit()
            conn.close()
            
            return "GET SCORE: " + str(score_for_user)
        else:   
            conn = sqlite3.connect(example_db)  # connect to that database (will create if it doesn't already exist)
            c = conn.cursor()
            scores_for_user = c.execute('''SELECT * FROM scores ORDER BY score DESC;''').fetchall()
            conn.commit()
            conn.close()

            output = ""
            for score in scores_for_user:
                output += score[0] + "-" + str(score[1]) + ","

            return "GET LEADERBOARD: " + output
      
                     
       
        
