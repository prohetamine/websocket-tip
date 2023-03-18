#include <WiFi.h>

#include <WebSocketClient.h>

const char* ssid     = "...."; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const char* password = "...."; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
char path[] = "/";
char host[] = "192.168.1.60:5000"; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

WebSocketClient webSocketClient;

// Use WiFiClient class to create TCP connections
WiFiClient client;

void setup() {
  Serial.begin(115200);
  delay(10);

  // We start by connecting to a WiFi network

  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());

  delay(5000);


  // Connect to the websocket server
  if (client.connect("192.168.1.60", 5000)) { // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    Serial.println("Connected");
  } else {
    Serial.println("Connection failed.");
    while(1) {
      // Hang on failure
    }
  }

  // Handshake with the server
  webSocketClient.path = path;
  webSocketClient.host = host;
  if (webSocketClient.handshake(client)) {
    Serial.println("Handshake successful");
  } else {
    Serial.println("Handshake failed.");
    while(1) {
      // Hang on failure
    }
  }

}


bool flagSendId = false;

void loop() {
  String data;

  if (client.connected()) {
    if (!flagSendId) {
      data = "id:715"; // Айди устройства
      webSocketClient.sendData(data);
      data = "";
      flagSendId = true;
    }

    webSocketClient.getData(data);
    if (data.length() > 0) {
      Serial.print("Tokens data: ");
      Serial.println(data); // tokenCount|username|message

      delay(100); // интервал

      data = "next";
      webSocketClient.sendData(data);
    }
  } else {
    Serial.println("Client disconnected."); // Если устройство отключилось оно не переподключится.
    while (1) {
      // Hang on disconnect.
    }
  }

  // wait to fully let the client disconnect
  delay(3000);

}
