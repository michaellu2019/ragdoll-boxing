import csv
import json


actions = ['right_punch', 'right_hook','right_weave', \
    'right_block', 'left_block', 'left_punch', 'left_hook', 'left_weave']

id_to_action = {'RP': 'right_punch', 'RH': 'right_hook', 'RW': 'right_weave', \
    'RB': 'right_block', 'LB': 'left_block', 'LP': 'left_punch', 'LH': 'left_hook', 'LW': 'left_weave'}

benchmark_file = "benchmark.json"

def add_benchmarks(filename, action_type):
    new_benchmark = {}
    arrays = [[] for i in range(13)]
    all_mags = []

    with open(filename) as csv_file:
        csv_reader = csv.reader(csv_file, delimiter=',')

        done = False
        for row_ in csv_reader:
            row = [float(val) for val in row_]

            # Calculate the acceleration magnitude for both IMUs
            mags = []
            for j in range(2):
                mag = round(sum([row[i+1]**2 for i in range(j*6, j*6+3)])**0.5, 3)
                mags.append(mag)
            
            all_mags.append(mags)

            for i in range(len(arrays)):
                if row[0] != -1:
                    arrays[i].append(row[i])
                else:
                    done = True
                    break
            if done:
                break
    
    for i in range(1,len(arrays)):
        arrays[i] = running_avg(arrays[i], 10)

    new_benchmark['time'] = arrays[0]
    new_benchmark['data'] = arrays[1:]
    new_benchmark['acc_mags'] = list(zip(*all_mags))
    max_elts = []

    for data in new_benchmark['data']:
        abs_data = map(abs, data)
        max_elts.append(max(abs_data))

    new_benchmark['max'] = max_elts
    
    with open(benchmark_file, "r+") as file:
        data = json.load(file)
        data[action_type] = new_benchmark
        file.seek(0)
        json.dump(data, file)

def find_total_correlation(raw_data, action_type):
    '''
    Expects raw_data in the form of array of n element where each element is
    an array of 13 values- 1 for time, 3 each for acceleration and gyro data
    for both the IMUs
    '''
    data = [running_avg(array, 10) for array in zip(*raw_data)]
    
    data = list(zip(*raw_data))
    with open(benchmark_file, "r") as file:
        benchmark = json.load(file)[action_type]
    
    num_points = min(len(benchmark['time']), len(data[0]))
    

    num_features = 3
    correlations = []
    for j in range(4):
        total_correlation = 0
        for i in range(num_features):
            total_correlation += correlation(benchmark['data'][j*num_features+i][-num_points:], data[j*num_features+i+1][-num_points:])
        correlations.append(total_correlation/num_features)
    
    return correlations

def running_avg(array, n):
    filter = [0]*n
    avg = []
    for i, val in enumerate(array):
        filter[i%n] = val
        avg.append(round(sum(filter)/n, 3))
    return avg

def offset_and_normalize(inp):
    mean_x = sum(inp)/len(inp)
    zero_x = [y-mean_x for y in inp]

    mag_x = sum([y**2 for y in zero_x])**0.5 + 0.00000001

    return [y/mag_x for y in zero_x]

def correlation(x,y):
    normalized_x = offset_and_normalize(x)
    normalized_y = offset_and_normalize(y)

    return sum(normalized_x[i]*normalized_y[i] for i in range(len(x)))


if __name__ == '__main__':
    for action in actions:
        add_benchmarks(f'data_/{action}.txt', action)
    pass