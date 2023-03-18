var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(5000, function() {
    console.log((new Date()) + ' Server is listening on port 5000');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

let clients = []

wsServer.on('request', function(request) {
    let id = Math.random()

    if (!originIsAllowed(request.origin)) {
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept(null, request.origin)

    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            if (message.utf8Data.match(/id:\d+/)) {
              id = message.utf8Data.match(/\d+/)[0]
              clients = [
                ...clients.filter(client => client.id !== id),
                {
                  id,
                  connection,
                  send: async (tokenCount, username, message) => {
                    connection.sendUTF(`${tokenCount}|${username}|${message}`)
                    return await new Promise(res => {
                      const intervalTime = setInterval(() => {
                        const clientIndex = clients.findIndex(client => client.id === id)
                        if (clientIndex !== -1 && clients[clientIndex].reverse === 'next') {
                          clients[clientIndex].reverse = null
                          res(true)
                        }
                      }, 500)

                      setTimeout(() => {
                        clearInterval(intervalTime)
                        res(false)
                      }, 10000)
                    })
                  }
                }
              ]
              return
            }

            if (message.utf8Data === 'next') {
              const clientIndex = clients.findIndex(client => client.id === id)
              if (clientIndex !== -1) {
                clients[clientIndex].reverse = 'next'
              }
            }
        }
    });

    connection.on('close', function(reasonCode, description) {
      clients = clients.filter(client => client.id !== id)
    });
});

module.exports = () => clients
