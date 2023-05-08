"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _hapi = require("@hapi/hapi");
var _index = require("./routes/index.js");
var _serverlessLog = _interopRequireDefault(require("../serverlessLog.js"));
var _debugLog = _interopRequireDefault(require("../debugLog.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
var _lambda = /*#__PURE__*/_classPrivateFieldLooseKey("lambda");
var _options = /*#__PURE__*/_classPrivateFieldLooseKey("options");
var _server = /*#__PURE__*/_classPrivateFieldLooseKey("server");
class HttpServer {
  constructor(options, lambda, v3Utils) {
    Object.defineProperty(this, _lambda, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _options, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _server, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _lambda)[_lambda] = lambda;
    _classPrivateFieldLooseBase(this, _options)[_options] = options;
    const {
      host,
      lambdaPort
    } = options;
    const serverOptions = {
      host,
      port: lambdaPort
    };
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
    _classPrivateFieldLooseBase(this, _server)[_server] = new _hapi.Server(serverOptions);
  }
  async start() {
    // add routes
    const _invocationsRoute = (0, _index.invocationsRoute)(_classPrivateFieldLooseBase(this, _lambda)[_lambda], _classPrivateFieldLooseBase(this, _options)[_options], this.v3Utils);
    const _invokeAsyncRoute = (0, _index.invokeAsyncRoute)(_classPrivateFieldLooseBase(this, _lambda)[_lambda], _classPrivateFieldLooseBase(this, _options)[_options]);
    _classPrivateFieldLooseBase(this, _server)[_server].route([_invokeAsyncRoute, _invocationsRoute]);
    const {
      host,
      httpsProtocol,
      lambdaPort
    } = _classPrivateFieldLooseBase(this, _options)[_options];
    try {
      await _classPrivateFieldLooseBase(this, _server)[_server].start();
    } catch (err) {
      if (this.log) {
        this.log.error(`Unexpected error while starting serverless-offline lambda server on port ${lambdaPort}:`, err);
      } else {
        console.error(`Unexpected error while starting serverless-offline lambda server on port ${lambdaPort}:`, err);
      }
      process.exit(1);
    }
    if (this.log) {
      this.log.notice(`Offline [http for lambda] listening on http${httpsProtocol ? 's' : ''}://${host}:${lambdaPort}`);
    } else {
      (0, _serverlessLog.default)(`Offline [http for lambda] listening on http${httpsProtocol ? 's' : ''}://${host}:${lambdaPort}`);
    }
    // Print all the invocation routes to debug
    const basePath = `http${httpsProtocol ? 's' : ''}://${host}:${lambdaPort}`;
    const funcNamePairs = _classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNamePairs();
    if (this.log) {
      this.log.notice([`Function names exposed for local invocation by aws-sdk:`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${funcNamePairs[functionName]}: ${functionName}`)].join('\n'));
      this.log.debug([`Lambda Invocation Routes (for AWS SDK or AWS CLI):`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${_invocationsRoute.method} ${basePath}${_invocationsRoute.path.replace('{functionName}', functionName)}`)].join('\n'));
      this.log.debug([`Lambda Async Invocation Routes (for AWS SDK or AWS CLI):`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${_invokeAsyncRoute.method} ${basePath}${_invokeAsyncRoute.path.replace('{functionName}', functionName)}`)].join('\n'));
    } else {
      (0, _serverlessLog.default)([`Function names exposed for local invocation by aws-sdk:`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${funcNamePairs[functionName]}: ${functionName}`)].join('\n'));
      (0, _debugLog.default)([`Lambda Invocation Routes (for AWS SDK or AWS CLI):`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${_invocationsRoute.method} ${basePath}${_invocationsRoute.path.replace('{functionName}', functionName)}`)].join('\n'));
      (0, _debugLog.default)([`Lambda Async Invocation Routes (for AWS SDK or AWS CLI):`, ..._classPrivateFieldLooseBase(this, _lambda)[_lambda].listFunctionNames().map(functionName => `           * ${_invokeAsyncRoute.method} ${basePath}${_invokeAsyncRoute.path.replace('{functionName}', functionName)}`)].join('\n'));
    }
  }

  // stops the server
  stop(timeout) {
    return _classPrivateFieldLooseBase(this, _server)[_server].stop({
      timeout
    });
  }
}
exports.default = HttpServer;