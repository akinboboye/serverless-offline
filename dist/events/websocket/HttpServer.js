"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _hapi = require("@hapi/hapi");
var _index = require("./http-routes/index.js");
var _serverlessLog = _interopRequireDefault(require("../../serverlessLog.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
var _options = /*#__PURE__*/_classPrivateFieldLooseKey("options");
var _server = /*#__PURE__*/_classPrivateFieldLooseKey("server");
var _webSocketClients = /*#__PURE__*/_classPrivateFieldLooseKey("webSocketClients");
class HttpServer {
  constructor(options, webSocketClients, v3Utils) {
    Object.defineProperty(this, _options, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _server, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _webSocketClients, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _options)[_options] = options;
    _classPrivateFieldLooseBase(this, _webSocketClients)[_webSocketClients] = webSocketClients;
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
    const {
      host,
      websocketPort
    } = options;
    const serverOptions = {
      host,
      port: websocketPort,
      router: {
        // allows for paths with trailing slashes to be the same as without
        // e.g. : /my-path is the same as /my-path/
        stripTrailingSlash: true
      }
    };
    _classPrivateFieldLooseBase(this, _server)[_server] = new _hapi.Server(serverOptions);
  }
  async start() {
    // add routes
    const routes = [...(0, _index.connectionsRoutes)(_classPrivateFieldLooseBase(this, _webSocketClients)[_webSocketClients], this.v3Utils), (0, _index.catchAllRoute)(this.v3Utils)];
    _classPrivateFieldLooseBase(this, _server)[_server].route(routes);
    const {
      host,
      httpsProtocol,
      websocketPort
    } = _classPrivateFieldLooseBase(this, _options)[_options];
    try {
      await _classPrivateFieldLooseBase(this, _server)[_server].start();
    } catch (err) {
      if (this.log) {
        this.log.error(`Unexpected error while starting serverless-offline websocket server on port ${websocketPort}:`, err);
      } else {
        console.error(`Unexpected error while starting serverless-offline websocket server on port ${websocketPort}:`, err);
      }
      process.exit(1);
    }
    if (this.log) {
      this.log.notice(`Offline [http for websocket] listening on http${httpsProtocol ? 's' : ''}://${host}:${websocketPort}`);
    } else {
      (0, _serverlessLog.default)(`Offline [http for websocket] listening on http${httpsProtocol ? 's' : ''}://${host}:${websocketPort}`);
    }
  }

  // stops the server
  stop(timeout) {
    return _classPrivateFieldLooseBase(this, _server)[_server].stop({
      timeout
    });
  }
  get server() {
    return _classPrivateFieldLooseBase(this, _server)[_server].listener;
  }
}
exports.default = HttpServer;