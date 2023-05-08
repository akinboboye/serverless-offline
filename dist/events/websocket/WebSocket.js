"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _HttpServer = _interopRequireDefault(require("./HttpServer.js"));
var _WebSocketEventDefinition = _interopRequireDefault(require("./WebSocketEventDefinition.js"));
var _WebSocketClients = _interopRequireDefault(require("./WebSocketClients.js"));
var _WebSocketServer = _interopRequireDefault(require("./WebSocketServer.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
var _httpServer = /*#__PURE__*/_classPrivateFieldLooseKey("httpServer");
var _webSocketServer = /*#__PURE__*/_classPrivateFieldLooseKey("webSocketServer");
class WebSocket {
  constructor(serverless, options, lambda, v3Utils) {
    Object.defineProperty(this, _httpServer, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _webSocketServer, {
      writable: true,
      value: null
    });
    const webSocketClients = new _WebSocketClients.default(serverless, options, lambda, v3Utils);
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
    _classPrivateFieldLooseBase(this, _httpServer)[_httpServer] = new _HttpServer.default(options, webSocketClients, this.v3Utils);

    // share server
    _classPrivateFieldLooseBase(this, _webSocketServer)[_webSocketServer] = new _WebSocketServer.default(options, webSocketClients, _classPrivateFieldLooseBase(this, _httpServer)[_httpServer].server, v3Utils);
  }
  start() {
    return Promise.all([_classPrivateFieldLooseBase(this, _httpServer)[_httpServer].start(), _classPrivateFieldLooseBase(this, _webSocketServer)[_webSocketServer].start()]);
  }

  // stops the server
  stop(timeout) {
    return Promise.all([_classPrivateFieldLooseBase(this, _httpServer)[_httpServer].stop(timeout), _classPrivateFieldLooseBase(this, _webSocketServer)[_webSocketServer].stop()]);
  }
  _create(functionKey, rawWebSocketEventDefinition) {
    const webSocketEvent = new _WebSocketEventDefinition.default(rawWebSocketEventDefinition);
    _classPrivateFieldLooseBase(this, _webSocketServer)[_webSocketServer].addRoute(functionKey, webSocketEvent);
  }
  create(events) {
    events.forEach(({
      functionKey,
      websocket
    }) => {
      this._create(functionKey, websocket);
    });
  }
}
exports.default = WebSocket;