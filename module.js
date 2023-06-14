/**
 * This is a test
 **/


module.exports = function(RED) {

  var aio = require('asterisk.io'),
    agi = null;

  function AsteriskControllerNode(config) {
    console.log("AsteriskControllerNode", config);
    RED.nodes.createNode(this, config);

    var callbacks = {};

    this.registerHandler = function(code, callback) {
      console.log(code,callback);

      callbacks[code] = callback;
    };

    console.log("start service");

    agi = aio.agi(14000); // port and host
    // if host is missing then
    // '0.0.0.0' is used as host
    agi.on('error', function(err) {
      throw err;
    });

    agi.on('listening', function() {
      console.log('listening on port 14000');
    });

    agi.on('close', function() {
      console.log('close');
    });

    agi.on('connection', function(agiHandler) {
      console.log('connection', agiHandler);
      agiHandler.on('hangup', function() {
        // hangup handler
      });

      agiHandler.on('error', function(err) {
        throw err;
      });

      agiHandler.on('close', function() {
        // closing handler
      });

      // answer the channel
      agiHandler.command('Answer', function(code, result, data) {

        agiHandler.command('GET DATA "beep"', function(code, result, data, song) {
          console.log(code, result, data, song);
          if (code == 200 && result && result in callbacks) {
            callbacks[result](result,agiHandler);

            agiHandler.command('SAY DIGITS "' + result + '" "0"', function(code, result, data) {
              console.log(code, result, data);
              agiHandler.command('HangUp', function() {
                // hangup the channel, this will raise hangup and close event
              });
            });
          } else {
            console.log("No match found");
            agiHandler.command('HangUp', function() {
              // hangup the channel, this will raise hangup and close event
            });
          }
        });
      });
    });

    this.on('close', function() {
      agi.close();
    });

    console.log("service started");


  }
  RED.nodes.registerType("asterisk-controller", AsteriskControllerNode);


  function AsteriskInputNode(config) {
    console.log("AsteriskInputNode", config);
    RED.nodes.createNode(this, config);
    var node = this;
    var ctrl = RED.nodes.getNode(config.controller);

    this.on("input", function(msg) {
      if (msg != null) {
        console.log(msg);
      };
    });

    ctrl.registerHandler(config.code,function(code, handler) {
      console.log("getting called");
      node.send({"topic": 'incoming', "payload": {"caller": handler.agi_callerid, "code":code}});
    });

  }
  RED.nodes.registerType("asterisk-in", AsteriskInputNode);




}
