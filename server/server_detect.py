import asyncio
import websockets
import functools
import os
import datetime
import matplotlib.pyplot as plt
import random
import json
import csv
import time

from engine import id_to_action
from imu import IMU


clients = []
web_client = None

async def register(websocket):
    '''
    Register the client
    '''
    clients.append(websocket)
    print("Added client.")

async def unregister(websocket):
    '''
    UnRegister the client
    '''
    clients.remove(websocket)
    print("Removed client.")

async def data(websocket, path):
    '''
    Handles the communication with the client- web interface and ESPs
    '''
    await register(websocket)
    global web_client

    imu = IMU()
    if clients:
        while websocket.open:
            try:
                data = await websocket.recv()

                if data == "web-client": # The web client connected
                    web_client = websocket
                elif 'PUNCH_MADE' in data: # Successful punch
                    next_move = data[-2:]
                    score = imu.get_score()
                    imu.set_next_move(next_move)
                    await websocket.send('CSCORE,'+str(score))
                elif 'PUNCH_MISS' in data: # Missed punch
                    next_move = data[-2:]
                    imu.set_next_move(next_move)
                else: #ESP data
                    imu.add_new_data(data)
                    imu.pop_first()
                    imu.do_correlation()

                    if web_client is not None:
                        detection = data.split(';')[3].split(',')
                        dummy = ['0']*6
                        to_send = ','.join(['IMU'+str(clients.index(websocket))] + dummy + detection)
                        await web_client.send(to_send)
            except Exception as error:
                print(error)

if __name__ == "__main__":
    port = 3000
    print("Running websocket on port " + str(port) + ".")
    start_server = websockets.serve(data, port=port, ping_interval=None)

    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()