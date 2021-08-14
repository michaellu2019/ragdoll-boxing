import csv
import matplotlib.pyplot as plt
from engine import running_avg

time = []

arrays = [time] + [[] for _ in range(12)] # 3 Acceleration and 3 Gyro data for 2 IMUs
colors = ['r', 'g', 'b', 'c', 'm', 'y'] * 2

with open('data_/left_punch.txt') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')

    for array in arrays:
        array.append([])

    for row_ in csv_reader:
        row = [float(val) for val in row_]

        for i in range(len(arrays)):
            if row[0] != -1:
                arrays[i][-1].append(row[i])
            else:
                arrays[i].append([])

avg = []
for i in range(1, len(arrays)):
    avg.append([running_avg(array, 10) for array in arrays[i]])


titles = ['IMU1 Acceleration', 'IMU1 Gyro', 'IMU2 Acceleration', 'IMU2 Gyro']
fig, axs = plt.subplots(2, 2)
for k in range(4):
    axs[k//2, k%2].set_title(titles[k])
    for i in range(len(time)):
        for j in range(3):
            axs[k//2, k%2].plot(time[i], avg[3*k+j][i], colors[j])

plt.show()