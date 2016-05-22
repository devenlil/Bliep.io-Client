(function(window, $) {

// A Diep.io Gameserver: ws://45.32.131.10:80

  var initialized = false,
      websocket   = null,
      servers     = [];

  window.initGame = function() {
    // Check if client already initialized
    if (initialized) return false;
    initialized = true;
    console.log('Bliep.io Client Initializing...');

    loadServers();
    return true;
  };

  window.setServer = function(ip, port) {
    if (port.length > 5) return false;
    servers = [("ws://" + ip + ":" + port)];
    return true;
  };

  window.play = function(nick) {
    if (nick.length > 15) return false;
    if (!websocket) connectTo(randServer());
    if (websocket.readyState != 1) return false;
    return true;
  };

  function loadServers(callback) {
    $.getJSON("game/servers.json", function(json) {
      servers = json;
      if (typeof callback == "function") callback();
    });
  }

  function randServer() {
    var index = Math.floor(Math.random() * servers.length);
    return servers[index];
  }

  function connectTo(url) {
    websocket = new WebSocket(url);
    websocket.binaryType = "arraybuffer";
    websocket.onopen = function() {

    };
    websocket.onerror = function() {

    };
    websocket.onclose = function() {

    };
    websocket.onmessage = handleMessage;
  }

  function handleMessage(msg) {
    console.log('Message received:');
    console.log(msg);
  }

})(window, jQuery);
