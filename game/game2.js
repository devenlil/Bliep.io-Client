(function(window, $) {

  /* Private Variables */

  var verbose      = true,
      menuBg       = null,
      canvas       = null,
      ctx          = null,
      region       = null, // unused atm
      servers      = null,
      websocket    = null,
      hearbeat     = null,
      playing      = false,
      connecting   = false,
      connected    = false,
      loop         = null,
      worldSize    = null, // unused atm (but actually initializes)
      myPlayer     = {},
      players      = [],
      foods        = [],
      projectiles  = [],
      lprojectiles = []; // locally moving projectiles

  const maxuint32 = 4294967295; // max value a uint32 holds. DO NOT CHANGE!!!!!

  var move = {
    'up': false,
    'left': false,
    'down': false,
    'right': false
  };

  /* Old colors
  var friendColor   = "#00B4E0",
      enemyColor    = "#F04F54",
      yellowColor   = "#FFE66B",
      blueColor     = "#758EFA",
      redColor      = "#FA7575",
      stuffFill     = "#999999",
      stuffOutline  = "#545454",
      outlineWidth  = 4;*/

  var friendColor   = "#00B4E0",
      friendOutline = "#0085A6",
      enemyColor    = "#F04F54",
      enemyOutline  = "#B33B3F",
      yellowColor   = "#FFE66B",
      yellowOutline = "#BDAA4D",
      blueColor     = "#758EFA",
      blueOutline   = "#596BBD",
      redColor      = "#FA7575",
      redOutline    = "#BD5959",
      stuffFill     = "#999999",
      stuffOutline  = "#707070",
      outlineWidth  = 4;

  /* Game Constants */

  const SQUARE_SIZE    = 40,
        TRIANGLE_SIZE  = 40,
        PENTAGON_SIZE  = 43;

  const SQUARE_FOOD    = 0,
        TRIANGLE_FOOD  = 1,
        PENTAGON_FOOD  = 2;

  /* Game Functions */

  function render() {
    // Rendering Code
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isConnected()) {
      if (menuBg) {

        // Image
        var offsetY = 40;
        var width = canvas.height*(menuBg.width/menuBg.height);
        var height = canvas.height+offsetY;
        if (canvas.width > width) {
          width = canvas.width;
          height = canvas.width*(menuBg.height/menuBg.width);
        }
        ctx.drawImage(menuBg, 0, -offsetY, width, height);

        // Darken
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1; //reset

        ctx.save();
        ctx.lineWidth = 10;
        ctx.font = "bold 60px Ubuntu";
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        var title = "Bliep.io",
            titleX = (canvas.width/2)-(ctx.measureText(title).width/2),
            titleY = canvas.height/4;
        ctx.strokeText(title, titleX, titleY);
        ctx.fillText(title, titleX, titleY);
        ctx.restore();
      }
      if (!menuShown) {
        showMenu();
      }
      return;
    }

    // lowest layer
    drawBackground();

    ctx.translate((canvas.width/2.0) - myPlayer.position.x, (canvas.height/2.0) - myPlayer.position.y);
    drawGrid();
    drawFoods();
    drawProjectiles();
    drawMyPlayer();
    drawPlayers();
    ctx.translate(-((canvas.width/2.0) - myPlayer.position.x), -((canvas.height/2.0) - myPlayer.position.y));
    drawInterface();
    // highest layer
  }

  function drawBackground() {
    ctx.fillStyle = '#B8B8B8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawGrid() {
      // Grid and bg color
      ctx.fillStyle = '#CCCCCC';
      ctx.fillRect(0, 0, worldSize, worldSize);

      ctx.strokeStyle = '#C2C2C2';
      ctx.lineWidth = 1;

      for (var x = 0; x < worldSize; x += 25) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, worldSize);
        ctx.stroke();
      }
      for (var y = 0; y < worldSize; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(worldSize, y);
        ctx.stroke();
      }
  }

  function drawFoods() {
    ctx.save();
    //ctx.strokeStyle = stuffOutline; // no more. now outline is just darker shade of fill
    ctx.lineWidth = outlineWidth;
    for (var i = 0; i < foods.length; i++) {
      //log("Drawing food (" + food.type + ") at (" + food.position.x + ", " + food.position.y + ")");
      var r1 = Math.random()*0.25, r2 = Math.random()*0.25;
      if (foods[i].xPlus && Math.abs((foods[i].position.x+r1) - foods[i].position.originalX) > 20) {
        foods[i].xPlus = false;
      } else if (!foods[i].xPlus && Math.abs((foods[i].position.x-r1) - foods[i].position.originalX) > 20) {
        foods[i].xPlus = true;
      }
      if (foods[i].yPlus && Math.abs((foods[i].position.y+r2) - foods[i].position.originalY) > 20) {
        foods[i].yPlus = false;
      } else if (!foods[i].yPlus && Math.abs((foods[i].position.y-r2) - foods[i].position.originalY) > 20) {
        foods[i].yPlus = true;
      }
      if (foods[i].xPlus) {
        foods[i].position.x += r1;
      } else {
        foods[i].position.x -= r1;
      }
      if (foods[i].yPlus) {
        foods[i].position.y += r2;
      } else {
        foods[i].position.y -= r2;
      }

      var foodFill;
      var foodOutline;
      ctx.beginPath();
      switch (foods[i].type) {
        case SQUARE_FOOD:
          foodFill = yellowColor;
          foodOutline = yellowOutline;
          ctx.rect(foods[i].position.x, foods[i].position.y, SQUARE_SIZE, SQUARE_SIZE);
          break;
        case TRIANGLE_FOOD:
          foodFill = redColor;
          foodOutline = redOutline;
          ctx.beginPath();
          ctx.moveTo(foods[i].position.x, foods[i].position.y);
          ctx.lineTo(foods[i].position.x + (TRIANGLE_SIZE/2.0), foods[i].position.y);
          ctx.lineTo(foods[i].position.x, foods[i].position.y - (0.9*TRIANGLE_SIZE));
          ctx.lineTo(foods[i].position.x - (TRIANGLE_SIZE/2.0), foods[i].position.y);
          break;
        case PENTAGON_FOOD:
          foodFill = blueColor;
          foodOutline = blueOutline;
          ctx.beginPath();
          ctx.moveTo(foods[i].position.x, foods[i].position.y);
          ctx.lineTo(foods[i].position.x + PENTAGON_SIZE, foods[i].position.y);
          ctx.lineTo(foods[i].position.x + PENTAGON_SIZE + 18, foods[i].position.y - PENTAGON_SIZE);
          ctx.lineTo(foods[i].position.x + (PENTAGON_SIZE/2.0), foods[i].position.y - (1.75*PENTAGON_SIZE));
          ctx.lineTo(foods[i].position.x - 18, foods[i].position.y - PENTAGON_SIZE);
          break;
        default:
          log("Unknown Food Type Received!");
          continue;
      }
      ctx.closePath();
      ctx.fillStyle = foodFill;
      ctx.strokeStyle = foodOutline;
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMyPlayer() {
    var position = {
      'x': myPlayer.position.x,
      'y': myPlayer.position.y
    };

    drawTank(myPlayer.tank, calcTankSizes(myPlayer), position,
      myPlayer.aim, true);
  }

  function drawPlayers() {
    players.forEach(function(player) {
      // Check if player's position has initialized (happens after packet 25)
      if (typeof player.position == "undefined") {
        return;
      }
      drawTank(player.tank, calcTankSizes(player), player.position,
        player.aim, false);
      drawPlayerTankInfo(player);
    });
  }

  function drawProjectiles() {
    /* Server Projectiles (no longer used)
     * Bullet coordinates are sent from server
     */
    projectiles.forEach(function(projectile) {
      switch(projectile.type) {
        case 1:
          drawBullet(projectile.position, projectile.isMine);
          break;
      }
    }.bind(this));

    /* Local projectiles
     * Bullet coordinates are calculated locally.
     */
    lprojectiles.forEach(function(projectile, index) {
      if (projectile.life <= 0) {
        this.slice(index, 1);
        return;
      }

      switch(projectile.type) {
        case 1:
          drawBullet(projectile.position, ((projectile.ownerId == 0) ? true : false),
            projectile.life);
          var elapsed = Date.now() - projectile.lastUpdated;
          projectile.position.x += (projectile.velocity.x * elapsed);
          projectile.position.y += (projectile.velocity.y * elapsed);
          projectile.life       -= elapsed;
          projectile.lastUpdated = Date.now();
      }
    }.bind(lprojectiles));
  }

  function drawBullet(position, isMine, life) {
    ctx.save();

    var bulletRadius = 12; // [TODO] what about different sizes of bullets??
    if (typeof life == "number" && life < 150 && life >= 0) {
      ctx.globalAlpha = life/150;
      bulletRadius += ((150-life)*0.5)/bulletRadius;
    }
    ctx.beginPath();
    ctx.arc(position.x, position.y, bulletRadius, 0, 2*Math.PI);
    ctx.closePath();
    /*ctx.fillStyle = (isMine) ? friendColor : enemyColor;
    ctx.strokeStyle = stuffOutline;*/
    if (isMine) {
      ctx.fillStyle = friendColor;
      ctx.strokeStyle = friendOutline;
    } else {
      ctx.fillStyle = enemyColor;
      ctx.strokeStyle = enemyOutline;
    }
    ctx.lineWidth = outlineWidth;
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawTank(type, sizes, position, aimAngle, isMine) {
    if (typeof position == 'undefined' ||
        typeof aimAngle == 'undefined') {
      return;
    }
    if (typeof isMine != 'boolean') {
      isMine = false;
    }

    ctx.save();

    ctx.translate(position.x, position.y);
    ctx.rotate(aimAngle);
    ctx.translate(-(position.x), -(position.y));
    ctx.fillStyle = stuffFill;
    ctx.strokeStyle = stuffOutline;
    ctx.lineWidth = outlineWidth;
    roundRect(ctx, position.x+(0.5*sizes.radius), position.y-(0.4*sizes.radius),
      36.0+sizes.gunOffset, 22, 0.5, true, true);

    // Body
    ctx.beginPath();
    ctx.arc(position.x, position.y, sizes.radius, 0, 2*Math.PI);
    ctx.closePath();
    if (isMine) {
      ctx.fillStyle = friendColor;
      ctx.strokeStyle = friendOutline;
    } else {
      ctx.fillStyle = enemyColor;
      ctx.strokeStyle = enemyOutline;
    }
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function drawPlayerTankInfo(player) {
    var r = calcTankSizes(player).radius;
    var x,
        y = (player.position.y - r);

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#545454';

    // Score
    if (player.score > 0) {
      ctx.lineWidth = 3;
      ctx.font = "bold 12px Ubuntu";
      x = player.position.x - (ctx.measureText(player.score).width / 2);
      y -= 8;
      ctx.strokeText(player.score, x, y);
      ctx.fillText(player.score, x, y);

      y -= 8;
    }

    // Name
    ctx.lineWidth = 4;
    ctx.font = "bold 19px Ubuntu";
    x = player.position.x - (ctx.measureText(player.name).width / 2);
    y -= 5;
    ctx.strokeText(player.name, x, y);
    ctx.fillText(player.name, x, y);

    ctx.restore();
  }

  function drawInterface() {
    ctx.globalAlpha = 0.9;

    var x,y;
    // Name
    var nick = myPlayer.name;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#292929';
    ctx.lineWidth = 8;
    ctx.font = "bold 40px Ubuntu";
    x = (canvas.width / 2) - (ctx.measureText(nick).width / 2);
    y = canvas.height - 75;
    ctx.strokeText(nick, x, y);
    ctx.fillText(nick, x, y);

    // Score box
    ctx.beginPath();
    ctx.moveTo((canvas.width/2)-(310/2), canvas.height-65);
    ctx.lineTo((canvas.width/2)+(310/2), canvas.height-65);
    ctx.quadraticCurveTo((canvas.width/2)+(330/2), canvas.height-(65-(18/2)),
      (canvas.width/2)+(310/2), canvas.height-(65-18));
    ctx.lineTo((canvas.width/2)-(310/2), canvas.height-(65-18));
    ctx.quadraticCurveTo((canvas.width/2)-(330/2), canvas.height-(65-(18/2)),
      (canvas.width/2)-(310/2), canvas.height-65);
    ctx.fillStyle = '#292929';
    ctx.fill();
    // Score Progress Bar [max = 326, min = 26]
    // Player score range [min = 0, max = 150000]
    var scoreProgress = (myPlayer.score > 150000) ? 150000 : myPlayer.score;
    var lengthScale = (326 - 26) / (150000 - 0);
    var length = (scoreProgress * lengthScale) + 26;
    ctx.beginPath();
    ctx.moveTo((canvas.width/2)-(306/2), canvas.height-63);
    ctx.lineTo((canvas.width/2)-(306/2)+(length-20), canvas.height-63);
    ctx.quadraticCurveTo((canvas.width/2)-(326/2)+length, canvas.height-(63-(14/2)),
      (canvas.width/2)-(306/2)+(length-20), canvas.height-(63-14));
    ctx.lineTo((canvas.width/2)-(306/2), canvas.height-(63-14));
    ctx.quadraticCurveTo((canvas.width/2)-(326/2), canvas.height-(63-(14/2)),
      (canvas.width/2)-(306/2), canvas.height-63);
    ctx.fillStyle = '#0ffcb1';
    ctx.fill();
    // Score box text
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px Ubuntu";
    ctx.lineWidth = 2;
    var scoreTxt = "Score: " + myPlayer.score.toLocaleString(),
        scoreX = (canvas.width/2)-(ctx.measureText(scoreTxt).width/2),
        scoreY = canvas.height-(59-(14/2));
    ctx.strokeText(scoreTxt, scoreX, scoreY);
    ctx.fillText(scoreTxt, scoreX, scoreY);

    // Level box
    ctx.beginPath();
    ctx.moveTo((canvas.width/2)-(320/2), canvas.height-45);
    ctx.lineTo((canvas.width/2)+(320/2), canvas.height-45);
    ctx.quadraticCurveTo((canvas.width/2)+(340/2), canvas.height-(45-(18/2)),
      (canvas.width/2)+(320/2), canvas.height-(45-18));
    ctx.lineTo((canvas.width/2)-(320/2), canvas.height-(45-18));
    ctx.quadraticCurveTo((canvas.width/2)-(340/2), canvas.height-(45-(18/2)),
      (canvas.width/2)-(320/2), canvas.height-45);
    ctx.fillStyle = '#292929';
    ctx.fill();
    // Level box fill
    var length = ((myPlayer.score*300)/50000)+26; // max = 326, min = 26
    // [TODO] adjust length based on player score and top player's score
    ctx.beginPath();
    ctx.moveTo((canvas.width/2)-(316/2), canvas.height-43);
    ctx.lineTo((canvas.width/2)-(316/2)+(length-20), canvas.height-43);
    ctx.quadraticCurveTo((canvas.width/2)-(336/2)+length, canvas.height-(43-(14/2)),
      (canvas.width/2)-(316/2)+(length-20), canvas.height-(43-14));
    ctx.lineTo((canvas.width/2)-(316/2), canvas.height-(43-14));
    ctx.quadraticCurveTo((canvas.width/2)-(336/2), canvas.height-(43-(14/2)),
      (canvas.width/2)-(316/2), canvas.height-43);
    ctx.fillStyle = '#fce156';
    ctx.fill();
    // Level box text
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px Ubuntu";
    ctx.lineWidth = 2;
    var levelTxt = "Level: " + myPlayer.score.toLocaleString(),
        levelX = (canvas.width/2)-(ctx.measureText(scoreTxt).width/2),
        levelY = canvas.height-(39-(14/2));
    ctx.strokeText(levelTxt, levelX, levelY);
    ctx.fillText(levelTxt, levelX, levelY);

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function update() {

    render();

    loop = requestAnimFrame(update);
  }

  function calcTankSizes(player) {
    // [TODO] calculate the level from the player's score
    var level = 1;

    var gunOffset = 0;
    if (player.lastBullet != 0) {
      var timeSinceLastBullet = Date.now() - player.lastBullet;
      var animLength = 250;
      if (timeSinceLastBullet >= animLength) {
        // Animation done
        player.lastBullet = 0;
      } else if (timeSinceLastBullet < animLength/2) {
        // Gun Shrinking
        gunOffset = -timeSinceLastBullet/50;
      } else {
        // Gun Expanding
        gunOffset = (-(animLength/2)/50)+((timeSinceLastBullet-(animLength/2))/50);
      }
    }

    var obj = {
      'radius': (27 + (level/5.0)),
      'gunOffset': (level/5.0) + gunOffset,
      'level': 1
    };
    return obj;
  }

  function aimTowards(x, y) {
    //goTowards(event.clientX-(canvas.width/2), (canvas.height/2)-event.clientY);
    var angle = Math.atan(y/x);
    if (x < 0) {
      angle += Math.PI;
    } else if (y < 0) {
      angle += (2*Math.PI);
    }
    myPlayer.aim = angle;
    angle = angle * (180.0 / Math.PI); // to degrees

    var buffer = new ArrayBuffer(3);
    var data = new DataView(buffer);
    data.setUint8(0, 50); // packet id
    data.setUint16(1, angle); // mouse angle
    sendSafe(buffer);
  }

  // Draws rounded rectangle on canvas
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == 'undefined') {
      stroke = true;
    }
    if (typeof radius === 'undefined') {
      radius = 5;
    }
    if (typeof radius === 'number') {
      radius = {tl: radius, tr: radius, br: radius, bl: radius};
    } else {
      var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
      for (var side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }
    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
    if (fill) {
      ctx.fill();
    }
    if (stroke) {
      ctx.stroke();
    }
  }

  /* Network Functions */

  function connect(callback) {
    if (isConnected()) // double check
      return true;
    connecting = true;
    var server = findServer(findRegion());
    websocket = new WebSocket('ws://' + server);
    websocket.binaryType = 'arraybuffer';
    websocket.onopen = function() {
      log("Opened Socket Connection");
      connecting = false;
      connected = true;
      heartbeat = setInterval(function() {
        var buffer = new ArrayBuffer(1);
        var data = new DataView(buffer);
        data.setUint8(0, 0);
        sendSafe(buffer);
      }, 1000);
      if (typeof callback == 'function') callback();
    };
    websocket.onclose = function(event) {
      log("Closed Socket Connection (" + event.code + ")");
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      reset();
    };
    websocket.onerror = function() {
      log("Socket Error", true);
      reset();
    };
    websocket.onmessage = handleMessage;
  }

  function sendSafe(data) {
    if (!data) return false;
    if (isConnected()) {
      websocket.send(data);
      return true;
    }
    return false;
  }

  function isConnected() {
    if (websocket && websocket.readyState == WebSocket.OPEN)
      return true;
    return false;
  }

  function handleMessage(message) {
    if (!(message.data instanceof ArrayBuffer)) {
      log('Message from server is not an arraybuffer.');
      return;
    }

    message = new DataView(message.data);
    var packetId = message.getUint8(0);

    log("Packet from Server: " + packetId);

    switch(packetId) {
      case 0: // Handshake Request
        worldSize = message.getUint16(1);
        var buffer = new ArrayBuffer(2);
        var data = new DataView(buffer);
        data.setUint8(0, 1); // packet id
        data.setUint8(1, 1); // protocol version
        sendSafe(buffer);
        break;
      case 20: // Init Player
        var byteOffset = 1;
        var playerCount = message.getUint8(byteOffset++);
        for (var i = 0; i < playerCount; i++) {
          var playerId = message.getUint32(byteOffset);
          byteOffset += 4;

          var nick = "";
          for (; message.getUint16(byteOffset) != 0; byteOffset += 2) {
            nick += String.fromCharCode(message.getUint16(byteOffset));
          }
          byteOffset += 2; // skip end of nick byte

          var score = message.getUint32(byteOffset);
          byteOffset += 4;

          var tank = message.getUint8(byteOffset++);

          if (playerId == 0) {
            myPlayer.name = nick;
            myPlayer.score = score;
            myPlayer.tank = tank;
            myPlayer.position = {};
            myPlayer.aim = 0;
            myPlayer.lastBullet = 0;
            if (!loop) {
              hideMenu();
              update();
              if (!playing) {
                playing = true;
              }
            }
          } else {
            // Check if existing player in known players array
            var pi = players.findIndex(player => player.id === playerId);
            if (pi != -1) {
              log("Player Already Initialized. Replacing...");
              players.splice(pi, 1);
            }
            log("Initializing player: " + playerId);
            players.push({
              'id': playerId,
              'name': nick,
              'score': score,
              'tank': tank,
              'lastBullet': 0
            });
          }
        }
        break;
      case 21: // Forget Player(s)
        var byteOffset = 1;
        var playerCount = message.getUint8(byteOffset++);
        for (var i = 0; i < playerCount; i++) {
          var playerId = message.getUint32(byteOffset);
          byteOffset += 4;

          log("Forgetting player: " + playerId);

          var pi = players.findIndex(player => player.id === playerId);
          if (pi != -1) {
            players.splice(pi, 1);
          } else {
            log("Server requested forget player for uninitialized player id.");
          }
        }
        break;
      case 25: // Update Player(s) [score & position]
        var byteOffset = 1;
        var playerCount = message.getUint8(byteOffset++);
        var newProjectiles = [];
        for (var i = 0; i < playerCount; i++) {
          var playerId = message.getUint32(byteOffset);
          var player = (playerId == 0) ? myPlayer : { 'id': -1, 'score': -1, 'position': {}, 'aim' : 0 };

          player.score = message.getUint32(byteOffset+4);
          player.position.x = message.getInt32(byteOffset+8);
          player.position.y = message.getInt32(byteOffset+12);
          byteOffset += 16;

          var isMine = true;
          if (player !== myPlayer) {
            isMine = false;
            // Get aim if network player & convert to radians
            player.aim = message.getUint16(byteOffset) * (Math.PI / 180.0);
            byteOffset += 2;

            // Find player in memory & update score, position, and rotation
            var pi = players.findIndex(player => player.id === playerId);
            if (pi == -1) {
              log("Warning! Uninitialized Player's Data Received (" + playerId + ")");
              continue;
            }
            players[pi].score = player.score;
            players[pi].position = player.position;
            players[pi].aim = player.aim;
          }

          // projectiles
          var bulletCount = message.getUint8(byteOffset++);
          for (var o = 0; o < bulletCount; o++) {
            newProjectiles.push({
              'type': message.getUint8(byteOffset++),
              'position': {
                'x': message.getInt32(byteOffset),
                'y': message.getInt32(byteOffset+4)
              },
              'isMine': isMine
            });
            byteOffset += 8;
          }
          //byteOffset += (bulletCount * 9);
        }
        projectiles = newProjectiles;
        break;
      case 30: // Add Food(s)
        var byteOffset = 1;
        var foodCount = message.getUint16(byteOffset);
        byteOffset += 2;
        for (var i = 0; i < foodCount; i++) {
          var food = { 'type': -1, 'position': {} };
          food.type = message.getUint8(byteOffset++);
          food.position.x = food.position.originalX = message.getInt32(byteOffset);
          food.position.y = food.position.originalY = message.getInt32(byteOffset+4);
          food.xPlus = Boolean(Math.floor(Math.random() * 2));
          food.yPlus = Boolean(Math.floor(Math.random() * 2));
          byteOffset += 8;
          var fi = foods.indexOf(food);
          if (fi != -1) {
            log("Food Already Initialized. Skipping...");
          } else {
            foods.push(food);
          }
        }
        break;
      case 35: // Spawn Bullet
        var byteOffset = 1;

        var serverTime1    = message.getUint16(byteOffset);
        byteOffset        += 2;
        var serverTime2    = message.getUint32(byteOffset);
        byteOffset        += 4;
        var packetReceived = Date.now(); // current time
        var serverSentTime = (serverTime1*maxuint32)+serverTime2;

        var bulletCount = message.getUint8(byteOffset++);
        for (var i = 0; i < bulletCount; i++) {
          // Read all data sent and store in variables
          var ownerId      = message.getUint8(byteOffset++);
          var bulletType   = message.getUint8(byteOffset++);
          var bulletSpeed  = message.getFloat32(byteOffset);
          byteOffset      += 4;
          var bulletAngle  = message.getUint16(byteOffset) * (Math.PI / 180.0);
          byteOffset      += 2;
          var bulletStartX = message.getInt32(byteOffset);
          byteOffset      += 4;
          var bulletStartY = message.getInt32(byteOffset);
          byteOffset      += 4;
          var bulletLife   = message.getUint16(byteOffset);
          byteOffset      += 2;

          var velocity = {
            'x': Math.cos(bulletAngle) * bulletSpeed,
            'y': Math.sin(bulletAngle) * bulletSpeed
          };
          var elapsed = (Date.now() - packetReceived) + (Date.now() - serverSentTime);
          var position = {
            'x': bulletStartX + (elapsed * velocity.x),
            'y': bulletStartY + (elapsed * velocity.y)
          };
          lprojectiles.push({
            'ownerId': ownerId,
            'type': bulletType,
            'velocity': velocity,
            'position': position,
            'life': (bulletLife - elapsed),
            'lastUpdated': Date.now()
          });
          if (ownerId == 0) {
            myPlayer.lastBullet = Date.now();
          } else {
            var pi = players.findIndex(player => player.id === ownerId);
            if (pi == -1) {
              log("Warning! Uninitialized Player's Bullet Received (" + playerId + ")");
              continue;
            }
            players[pi].lastBullet = Date.now();
          }
        }
        break;
      default: // Unhandled Packet
        log(" - The packet was unhandled.", this.verbose, false);
        break;
    }
  }

  function findServer(region) {
    var index = Math.floor(Math.random() * servers.length);
    return servers[index];
  }

  function findRegion() {
    // [TODO] find a region
    return 'US';
  }

  function loadServers(callback) {
    $.getJSON("game/servers.json", function(json) {
      servers = json;
      if (typeof callback == 'function') callback();
    });
  }

  function reset() {
    if (isConnected()) {
      log("Cannot reset client while connected to server.");
      return;
    }
    cancelRequestAnimFrame(loop);
    hearbeat    = null,
    playing     = false,
    connecting  = false,
    connected   = false,
    loop        = null,
    worldSize   = null, // unused atm (but actually initializes)
    myPlayer    = {},
    players     = [],
    foods       = [];
    render();
  }

  function log(msg, override, prefix) {
    if (typeof override != 'boolean')
      override = verbose;
    if (typeof prefix != 'boolean')
      prefix = true;
    if (override) {
      if (prefix) {
        console.log('[BliepClient] ' + msg);
      } else {
        console.log(msg);
      }
    }
  }

  /* Global Functions */

  window.initGame = function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    region = findRegion();
    loadServers();
    canvas.onmousemove = function(e) {
      aimTowards(e.clientX - (canvas.width/2.0), e.clientY - (canvas.height/2.0));
    };
    canvas.onmousedown = function(event) {
      var mouseBtn = event.which || event.button;
      if (mouseBtn == 1) { // left click
        onShootKeys(1);
      }
    };
    canvas.onmouseup = function(event) {
      var mouseBtn = event.which || event.button;
      if (mouseBtn == 1) { // left click
        onShootKeys(0);
      }
    };
  };

  window.resizeGame = function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
  };

  window.setGameMenuBg = function(image) {
    if (image instanceof Image) {
      menuBg = image;
      render();
      return true;
    } else {
      return false;
    }
  };

  window.play = function(name) {
    if (playing || connecting) return;

    if (typeof name != 'string') name = "";

    // Clean & Trim Player Name (also done on serverside!)
    name = name.trim();
    name = name.substr(0, 15); // max 15 chars

    // Build Packet
    var buffer = new ArrayBuffer(3 + (2 * name.length));
    var data = new DataView(buffer);
    var byteOffset = 0;
    data.setUint8(byteOffset++, 10);
    for (var i = 0; i < name.length; i++) {
      data.setUint16(byteOffset, name.charCodeAt(i));
      byteOffset += 2;
    }
    data.setUint16(byteOffset, 0);
    byteOffset += 2;

    // Send Play Packet
    if (!isConnected()) {
      connect(function() {
        sendSafe(buffer);
      });
    } else {
      sendSafe(buffer);
    }
  };

  window.onMoveKeys = function(upMode, event) {
    if (!playing) {
      return;
    }
    switch(event.keyCode) {
      case 87: // w key
        move.up = !upMode;
        break;
      case 65: // a key
        move.left = !upMode;
        break;
      case 83: // s key
        move.down = !upMode;
        break;
      case 68: // d key
        move.right = !upMode;
        break;
    }

    // send packet
    var buffer = new ArrayBuffer(5);
    var data = new DataView(buffer);
    data.setUint8(0, 51);
    data.setUint8(1, (move.up ? 1 : 0));
    data.setUint8(2, (move.left ? 1 : 0));
    data.setUint8(3, (move.down ? 1 : 0));
    data.setUint8(4, (move.right ? 1 : 0));
    sendSafe(buffer);

    /* Local Move */
    var angle = -1;
      if (move.up && !move.down) {
        if (move.left != move.right) {
          if (move.left) {
            angle = 135;
          } else if (move.right) {
            angle = 45;
          }
        } else {
          angle = 90;
        }
      } else if (!move.up && move.down) {
        if (move.left != move.right) {
          if (move.left) {
            angle = 225;
          } else if (move.right) {
            angle = 315;
          }
        } else {
          angle = 270;
        }
      } else if (move.left && !move.right) {
        angle = 180;
      } else if (!move.left && move.right) {
        angle = 0;
      }
      if (angle != -1) {
        angle = angle * Math.PI/180;
        var velocityX = Math.cos(angle)*5.0;
        var velocityY = -Math.sin(angle)*5.0;

        if (myPlayer.position.x + velocityX > worldSize) {
          myPlayer.position.x = worldSize;
        } else if (myPlayer.position.x + velocityX < 0) {
          myPlayer.position.x = 0;
        } else {
          myPlayer.position.x += velocityX;
        }
        if (myPlayer.position.y + velocityY > worldSize) {
          myPlayer.position.y = worldSize;
        } else if (myPlayer.position.y + velocityY < 0) {
          myPlayer.position.y = 0;
        } else {
          myPlayer.position.y += velocityY;
        }
      }
  };

  window.onShootKeys = function(key) {
    // key: 0 = released, 1 = clicked
    if (key != 0 && key != 1) {
      return;
    }
    // send packet
    var buffer = new ArrayBuffer(2);
    var data = new DataView(buffer);
    data.setUint8(0, 52);
    data.setUint8(1, key);
    sendSafe(buffer);
  };

  window.requestAnimFrame = (function() {
    return window.requestAnimationFrame     ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function(callback) {
          return window.setTimeout(callback, 1000 / 60);
        };
  })();

  window.cancelRequestAnimFrame = (function() {
    return window.cancelAnimationFrame            ||
        window.webkitCancelRequestAnimationFrame  ||
        window.mozCancelRequestAnimationFrame     ||
        window.oCancelRequestAnimationFrame       ||
        window.msCancelRequestAnimationFrame      ||
        clearTimeout
  })();

})(window, jQuery);
