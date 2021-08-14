#include <WiFi.h>
#include <Wire.h>
#include <WebSocketClient.h>
#include <mpu6050_esp32.h>
#include <math.h>
#include <TFT_eSPI.h>

TFT_eSPI tft = TFT_eSPI(); 

boolean handshake_failed = 0;
char path[] = "/";
const char* network = "MIT";
const char* password = "";
char* host = "10.31.125.69";
//char* host = "10.31.104.176";
const int port = 3000;
  
WebSocketClient websocket_client;
uint32_t long socket_last_time;
uint32_t long interval = 50; // interval for sending data to the websocket server in ms

// Use WiFiClient class to create TCP connections
WiFiClient client;
const uint8_t client_id = 1;

const uint8_t NUM_IMUS = 2;
const uint32_t left_imu_address = 0x68;
const uint32_t right_imu_address = 0x69;

MPU6050 left_imu(left_imu_address);
MPU6050 right_imu(right_imu_address);
MPU6050 imus[NUM_IMUS] = {left_imu, right_imu};

const uint8_t NUM_AVGS = 1;
const float punch_acc_threshold = 17/9.81;
float acc_x[NUM_IMUS], acc_y[NUM_IMUS], acc_z[NUM_IMUS], acc_mag[NUM_IMUS], gyro_x[NUM_IMUS], gyro_y[NUM_IMUS], gyro_z[NUM_IMUS];
float past_acc_x[NUM_IMUS][NUM_AVGS], past_acc_y[NUM_IMUS][NUM_AVGS], past_acc_z[NUM_IMUS][NUM_AVGS];
float avg_acc_x[NUM_IMUS], avg_acc_y[NUM_IMUS], avg_acc_z[NUM_IMUS];
float sum_acc_x[NUM_IMUS], sum_acc_y[NUM_IMUS], sum_acc_z[NUM_IMUS];
char left_stance[80];
char right_stance[80];
char imu_data[500];

int rp_state;
int rp_timer;

int lp_state;
int lp_timer;

bool imu_data_processed = false;

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < NUM_IMUS; i++) {
    if (imus[i].setupIMU(1)) {
      Serial.println("IMU Connected!");
    } else {
      Serial.println("IMU Not Connected :/");
      Serial.println("Restarting");
      ESP.restart();
    }  
  }

  delay(10);
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(network);
  
  WiFi.begin(network, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  delay(1000);
  
  wsconnect();

  rp_state = 0;
  lp_state = 0;
}

void loop() {
  imu_data_processed = true;
  bool left_sure = true;
  bool right_sure = true;

  /**
   * To keep the code ready for change, we still have 
   * the implemention of a running average for accel and 
   * gyro data. HOWEVER, as explained in the writeup,
   * we utilized single time stamp data instead of
   * a running average because this method performs better.
   * As a result, NUM_AVGS (a variable indicating the number
   * of data points to take into account for an average) is 
   * set to just 1.
   */
  for (int i = 0; i < NUM_IMUS; i++) {
    sum_acc_x[i] = 0;
    sum_acc_y[i] = 0;
    sum_acc_z[i] = 0;
    
    for (int j = NUM_AVGS - 1; j > 0; j--) {
      past_acc_x[i][j] = past_acc_x[i][j - 1];
      past_acc_y[i][j] = past_acc_y[i][j - 1];
      past_acc_z[i][j] = past_acc_z[i][j - 1];
      
      sum_acc_x[i] += past_acc_x[i][j];
      sum_acc_y[i] += past_acc_y[i][j];
      sum_acc_z[i] += past_acc_z[i][j]; 
    }
    
    imus[i].readAccelData(imus[i].accelCount);
    imus[i].readGyroData(imus[i].gyroCount);
    past_acc_x[i][0] = imus[i].accelCount[0] * imus[i].aRes;
    past_acc_y[i][0] = imus[i].accelCount[1] * imus[i].aRes;
    past_acc_z[i][0] = imus[i].accelCount[2] * imus[i].aRes;
    
    sum_acc_x[i] += past_acc_x[i][0];
    sum_acc_y[i] += past_acc_y[i][0];
    sum_acc_z[i] += past_acc_z[i][0];

    acc_x[i] = sum_acc_x[i]/NUM_AVGS;
    acc_y[i] = sum_acc_y[i]/NUM_AVGS;
    acc_z[i] = sum_acc_z[i]/NUM_AVGS;

    gyro_x[i] = imus[i].gyroCount[0] * imus[i].gRes;
    gyro_y[i] = imus[i].gyroCount[1] * imus[i].gRes;
    gyro_z[i] = imus[i].gyroCount[2] * imus[i].gRes;

    acc_mag[i] = sqrt(acc_x[i] * acc_x[i] + acc_y[i] * acc_y[i] + acc_z[i] * acc_z[i]);
  }

  strcpy(left_stance, "NONE");
  strcpy(right_stance, "NONE");

  //state machine for right punch
  if (rp_state==0 && acc_x[1] < -.25 && acc_z[1] < -.25){
    rp_state=1;
    rp_timer=millis();
  }
  else if (rp_state==1 && acc_x[1] > 1.25 && millis()-rp_timer<200){
    rp_state=2;
  }
  else if (millis()-rp_timer>200) {
    rp_state=0;
  }

  //state machine for left punch
  if (lp_state==0 && acc_x[0] < -.25 && acc_z[0] < -.25){ 
    lp_state=1;
    lp_timer=millis();
  }
  else if (lp_state==1 && acc_x[0] > 1.25 && millis()-lp_timer<200){
    lp_state=2;
  }
  else if (millis()-lp_timer>200) {
    lp_state=0;
  }

  //detect a left punch
  if (lp_state==2){
    sprintf(left_stance, "LP");
    lp_state=0;
  }
  
  //detect a left hook
  else if (acc_x[0] < -0.8 && acc_y[0] > 0.0 && acc_z[0] > 1.0 && acc_mag[0] > punch_acc_threshold) {
    sprintf(left_stance, "LH");
  } 
  
  //detect a left block
  else if (acc_x[0] < -0.6 && abs(acc_y[0]) < 0.4  && abs(acc_z[0]) < 0.7) {
    sprintf(left_stance, "LB"); 
  }

  //detect a right punch
  if (rp_state==2){
    sprintf(right_stance, "RP");
    rp_state=0;
  }

  //detect a right hook
  else if (acc_x[1] < -0.8 && acc_y[1] < 0.0 && acc_z[1] > 1.0 && acc_mag[1] > punch_acc_threshold) {
    sprintf(right_stance, "RH");
  } 

  //detect a right block
  else if (acc_x[1] < -0.6&& abs(acc_y[1]) < 0.4 && abs(acc_z[1]) < 0.7) {
    sprintf(right_stance, "RB"); 
  }

  //detect a left weave
  if ((acc_x[0] < -0.15 && acc_y[0] > 0.4  && abs(acc_z[0]) < 0.7) && acc_mag[0] < punch_acc_threshold &&
      (acc_x[1] < -0.15 && acc_y[1] > 0.4  && abs(acc_z[1]) < 0.7)&& acc_mag[1] < punch_acc_threshold) {
    sprintf(left_stance, "LW");
    sprintf(right_stance, "LW");

  } 

  //detect a right weave
  else if ((acc_x[0] < -0.15 && acc_y[0] < -0.4  && abs(acc_z[0]) < 0.7) && acc_mag[0] < punch_acc_threshold &&
      (acc_x[1] < -0.15 && acc_y[1] < -0.4  && abs(acc_z[1]) < 0.7)&& acc_mag[1] < punch_acc_threshold) {
    sprintf(left_stance, "RW");
    sprintf(right_stance, "RW");

  } 
  
  sprintf(imu_data, "%d;%.3f,%.3f,%.3f,%.2f,%.2f,%.2f,%.3f,%.3f,%.3f,%.2f,%.2f,%.2f;%d,%d;%s,%s", millis(),
      acc_x[0], acc_y[0], acc_z[0], acc_x[1], acc_y[1], acc_z[1],
      gyro_x[0], gyro_y[0], gyro_z[0], gyro_x[1], gyro_y[1], gyro_z[1],
      left_sure, right_sure, left_stance, right_stance);
  
  imu_data_processed = true;

  //send data to websocket server
  if (client.connected()) {
    if (abs(millis() - socket_last_time) >= interval) {
      socket_last_time = millis();
      websocket_client.sendData(imu_data);
    }
  }
}

void wsconnect(){
  // Connect to the websocket server
  Serial.printf("Connecting to websocket server: %s:%d\n", host, port);
  if (client.connect(host, port)) {
    Serial.println("Connected");
  } else {
    Serial.println("Connection failed.");
    delay(1000);  
  
    if (handshake_failed) {
      handshake_failed = 0;
      ESP.restart();
    }
    handshake_failed = 1;
  }
  
  // Handshake with the server
  websocket_client.path = path;
  websocket_client.host = host;
  if (websocket_client.handshake(client)) {
    Serial.println("Handshake successful");
  } else {
    Serial.println("Handshake failed.");
    delay(4000);  
  
    if(handshake_failed){
      handshake_failed = 0;
      ESP.restart();
    }
    
    handshake_failed = 1;
  }
}
