var assert = require('assert');
var path = require('path');
var fs = require('fs');
var handlebars = require('handlebars');
var ServerConnector = require('../lib/connectors/server.js');

var SERVER_TEMPLATE_LOCATION = path.resolve(__dirname, '../lib/injector/templates/server.js');

suite('ServerConnector', function() {
  test('run in server and get result', function(done) {
    var Npm = {require: require};
    var port = getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({port: port});
    
    eval(serverCode);
    setTimeout(function() {
      var sc = new ServerConnector(port);
      sc.run(function() {
        emit('response', 100)
      });

      sc.on('response', function(num) {
        assert.equal(num, 100);
        sc.close();
        done();
      });
    }, 20);
  });

  test('run fibered code', function(done) {
    var Npm = {require: require};
    var Meteor = {setTimeout: setTimeout};
    var port = getRandomPort();
    var template = handlebars.compile(fs.readFileSync(SERVER_TEMPLATE_LOCATION, 'utf8'));
    var serverCode = template({port: port});
    
    eval(serverCode);
    setTimeout(function() {
      var sc = new ServerConnector(port);
      sc.run(function() {
        var Future = Npm.require('fibers/future');
        var f = new Future();
        var a = 10;
        Meteor.setTimeout(function() {
          a = 100;
          f.return();
        }, 3);
        f.wait();

        emit('result', a);
      });

      sc.on('result', function(num) {
        assert.equal(num, 100);
        sc.close();
        done();
      });
    }, 20);
  });
});

function getRandomPort() {
  return Math.ceil(Math.random() * 1000) + 10000;
}