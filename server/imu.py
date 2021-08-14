import csv

from engine import find_total_correlation, actions, id_to_action

class IMU():
    def __init__(self):
        self.last_time = 0
        self.first_time = None
        self.IMU_SCALE = 65.5 * 1000
        self.data = []
        self.max_elts = 50
        self.min_elts = 10
        self.accel_gyro_ratio = (5,1)
        self.imu_detection = ["NONE", "NONE"]
        self.move = 'RB'
        self.correlation_values = []
    
    def set_next_move(self, move):
        self.reset_score()
        self.move = move

    def add_new_data(self, data):
        time = int(data.split(';')[0])
        imu_data = [float(d) for d in data.split(';')[1].split(',')]
        self.imu_detection = data.split(';')[3].split(',')

        if self.first_time is None:
            self.first_time = time
        
        self.data.append([time-self.first_time] + imu_data)

    def save_data(self, filename):
        print("saving data")
        with open(filename, 'a') as file:
            writer = csv.writer(file, delimiter=',', quotechar='"', quoting=csv.QUOTE_MINIMAL)
            for point in self.data:
                writer.writerow(point)
            writer.writerow([-1] + [0]*12)
        
    def do_correlation(self):
        '''
        Calculates and stores the correlation of the data for the move in `self.move`
        '''
        if len(self.data) < self.min_elts:
            self.correlation_values.append(0)
        factor_correlation = find_total_correlation(self.data, id_to_action[self.move])
        
        correlation = []
        factor = 1/sum(self.accel_gyro_ratio)
        for i in range(2):
            imu_correlation = 0
            for j in range(2):
                imu_correlation += factor_correlation[i*2+j] * self.accel_gyro_ratio[j]
            correlation.append(imu_correlation * factor)
        
        self.correlation_values.append(max(correlation))

    def get_score(self):
        if len(self.correlation_values) == 0:
            return 0
            
        return int(max(self.correlation_values)*10)

    def reset_score(self):
        self.correlation_values = []

    def pop_first(self):
        if len(self.data) > self.max_elts:
            self.data.pop(0)

    def reset(self):
        self.data = []
        self.first_time = None
