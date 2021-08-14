import asyncio
import websockets
import time
from threading import Thread
import aioconsole

from imu import IMU


clients = set()
start_time = None
imu = IMU()
record_time = 1.5 # in seconds
action = 'right_punch' # Action which is to be recorded

async def get_input():
    '''
    Repeatedly asks the user to press enter to start another set of recording
    when previous has finished
    '''
    global start_time
    while True:
        if start_time is None:
            inp = await aioconsole.ainput("Press Enter ")
            start_time = time.time()
            print("start time: ", start_time)


async def register(websocket):
    '''
    Register the client
    '''
    clients.add(websocket)
    print("Added client.")

async def unregister(websocket):
    '''
    UnRegister the client
    '''
    clients.remove(websocket)
    print("Removed client.")

async def data(websocket, path):
    '''
    Handles the communication with the client
    '''
    await register(websocket)
    global start_time
    
    if clients:
        while websocket.open:
            try:
                data = await websocket.recv()
                if start_time is not None:
                    print("Adding data")
                    imu.add_new_data(data)

                    # Add data for the next `record_time` seconds
                    if time.time() > start_time + record_time:
                        imu.save_data(f'data_/{action}.txt')
                        imu.reset()
                        start_time = None
            except Exception as error:
                print(error)
        unregister(websocket)

def server(port):
    '''
    Runs the server on the given port
    '''
    print("Running websocket on port " + str(port) + ".")
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    start_server = websockets.serve(data, port=port, ping_interval=None)
    loop.run_until_complete(start_server)
    loop.run_forever()

if __name__ == "__main__":
    port = 3000
    # Runs server() on a different thread
    server_thread = Thread(target=server, args=(port,))
    server_thread.start()

    # Run get_input() infinitely
    asyncio.get_event_loop().run_until_complete(get_input())
    asyncio.get_event_loop().run_forever()