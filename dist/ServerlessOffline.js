"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _updateNotifier = _interopRequireDefault(require("update-notifier"));
var _chalk = _interopRequireDefault(require("chalk"));
var _semver = require("semver");
var _debugLog = _interopRequireDefault(require("./debugLog.js"));
var _serverlessLog = _interopRequireWildcard(require("./serverlessLog.js"));
var _index = require("./utils/index.js");
var _index2 = require("./config/index.js");
var _package = _interopRequireDefault(require("../package.json"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }
function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
var _cliOptions = /*#__PURE__*/_classPrivateFieldLooseKey("cliOptions");
var _http = /*#__PURE__*/_classPrivateFieldLooseKey("http");
var _options = /*#__PURE__*/_classPrivateFieldLooseKey("options");
var _schedule = /*#__PURE__*/_classPrivateFieldLooseKey("schedule");
var _webSocket = /*#__PURE__*/_classPrivateFieldLooseKey("webSocket");
var _lambda = /*#__PURE__*/_classPrivateFieldLooseKey("lambda");
var _serverless = /*#__PURE__*/_classPrivateFieldLooseKey("serverless");
class ServerlessOffline {
  constructor(serverless, cliOptions, v3Utils) {
    Object.defineProperty(this, _cliOptions, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _http, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _options, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _schedule, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _webSocket, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _lambda, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _serverless, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _cliOptions)[_cliOptions] = cliOptions;
    _classPrivateFieldLooseBase(this, _serverless)[_serverless] = serverless;
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
    (0, _serverlessLog.setLog)((...args) => serverless.cli.log(...args));
    this.commands = {
      offline: {
        // add start nested options
        commands: {
          start: {
            lifecycleEvents: ['init', 'ready', 'end'],
            options: _index2.commandOptions,
            usage: 'Simulates API Gateway to call your lambda functions offline using backward compatible initialization.'
          }
        },
        lifecycleEvents: ['start'],
        options: _index2.commandOptions,
        usage: 'Simulates API Gateway to call your lambda functions offline.'
      }
    };
    this.hooks = {
      'offline:start:init': this.start.bind(this),
      'offline:start:ready': this.ready.bind(this),
      'offline:start': this._startWithExplicitEnd.bind(this),
      'offline:start:end': this.end.bind(this)
    };
  }
  _printBlankLine() {
    if (process.env.NODE_ENV !== 'test') {
      if (this.log) {
        this.log.notice();
      } else {
        console.log();
      }
    }
  }

  // Entry point for the plugin (sls offline) when running 'sls offline start'
  async start() {
    // Put here so available everywhere, not just in handlers
    process.env.IS_OFFLINE = true;

    // check if update is available
    (0, _updateNotifier.default)({
      pkg: _package.default
    }).notify();
    this._verifyServerlessVersionCompatibility();
    this._mergeOptions();
    const {
      httpEvents,
      lambdas,
      scheduleEvents,
      webSocketEvents
    } = this._getEvents();

    // if (lambdas.length > 0) {
    await this._createLambda(lambdas);
    // }

    const eventModules = [];
    if (httpEvents.length > 0) {
      eventModules.push(this._createHttp(httpEvents));
    }
    if (!_classPrivateFieldLooseBase(this, _options)[_options].disableScheduledEvents && scheduleEvents.length > 0) {
      eventModules.push(this._createSchedule(scheduleEvents));
    }
    if (webSocketEvents.length > 0) {
      eventModules.push(this._createWebSocket(webSocketEvents));
    }
    await Promise.all(eventModules);
  }
  async ready() {
    if (process.env.NODE_ENV !== 'test') {
      await this._listenForTermination();
    }
  }
  async end(skipExit) {
    // TEMP FIXME
    if (process.env.NODE_ENV === 'test' && skipExit === undefined) {
      return;
    }
    if (this.log) {
      this.log.info('Halting offline server');
    } else {
      (0, _serverlessLog.default)('Halting offline server');
    }
    const eventModules = [];
    if (_classPrivateFieldLooseBase(this, _lambda)[_lambda]) {
      eventModules.push(_classPrivateFieldLooseBase(this, _lambda)[_lambda].cleanup());
      eventModules.push(_classPrivateFieldLooseBase(this, _lambda)[_lambda].stop(_index2.SERVER_SHUTDOWN_TIMEOUT));
    }
    if (_classPrivateFieldLooseBase(this, _http)[_http]) {
      eventModules.push(_classPrivateFieldLooseBase(this, _http)[_http].stop(_index2.SERVER_SHUTDOWN_TIMEOUT));
    }

    // if (this.#schedule) {
    //   eventModules.push(this.#schedule.stop())
    // }

    if (_classPrivateFieldLooseBase(this, _webSocket)[_webSocket]) {
      eventModules.push(_classPrivateFieldLooseBase(this, _webSocket)[_webSocket].stop(_index2.SERVER_SHUTDOWN_TIMEOUT));
    }
    await Promise.all(eventModules);
    if (!skipExit) {
      process.exit(0);
    }
  }

  /**
   * Entry point for the plugin (sls offline) when running 'sls offline'
   * The call to this.end() would terminate the process before 'offline:start:end' could be consumed
   * by downstream plugins. When running sls offline that can be expected, but docs say that
   * 'sls offline start' will provide the init and end hooks for other plugins to consume
   * */
  async _startWithExplicitEnd() {
    await this.start();
    await this.ready();
    this.end();
  }
  async _listenForTermination() {
    const command = await new Promise(resolve => {
      process
      // SIGINT will be usually sent when user presses ctrl+c
      .on('SIGINT', () => resolve('SIGINT'))
      // SIGTERM is a default termination signal in many cases,
      // for example when "killing" a subprocess spawned in node
      // with child_process methods
      .on('SIGTERM', () => resolve('SIGTERM'));
    });
    if (this.log) {
      this.log.info(`Got ${command} signal. Offline Halting...`);
    } else {
      (0, _serverlessLog.default)(`Got ${command} signal. Offline Halting...`);
    }
  }
  async _createLambda(lambdas, skipStart) {
    const {
      default: Lambda
    } = await Promise.resolve().then(() => _interopRequireWildcard(require('./lambda/index.js')));
    _classPrivateFieldLooseBase(this, _lambda)[_lambda] = new Lambda(_classPrivateFieldLooseBase(this, _serverless)[_serverless], _classPrivateFieldLooseBase(this, _options)[_options], this.v3Utils);
    _classPrivateFieldLooseBase(this, _lambda)[_lambda].create(lambdas);
    if (!skipStart) {
      await _classPrivateFieldLooseBase(this, _lambda)[_lambda].start();
    }
  }
  async _createHttp(events, skipStart) {
    const {
      default: Http
    } = await Promise.resolve().then(() => _interopRequireWildcard(require('./events/http/index.js')));
    _classPrivateFieldLooseBase(this, _http)[_http] = new Http(_classPrivateFieldLooseBase(this, _serverless)[_serverless], _classPrivateFieldLooseBase(this, _options)[_options], _classPrivateFieldLooseBase(this, _lambda)[_lambda], this.v3Utils);
    await _classPrivateFieldLooseBase(this, _http)[_http].registerPlugins();
    _classPrivateFieldLooseBase(this, _http)[_http].create(events);

    // HTTP Proxy defined in Resource
    _classPrivateFieldLooseBase(this, _http)[_http].createResourceRoutes();

    // Not found handling
    // we have to create the 404 routes last, otherwise we could have
    // collisions with catch all routes, e.g. any (proxy+}
    _classPrivateFieldLooseBase(this, _http)[_http].create404Route();
    if (!skipStart) {
      await _classPrivateFieldLooseBase(this, _http)[_http].start();
    }
  }
  async _createSchedule(events) {
    const {
      default: Schedule
    } = await Promise.resolve().then(() => _interopRequireWildcard(require('./events/schedule/index.js')));
    _classPrivateFieldLooseBase(this, _schedule)[_schedule] = new Schedule(_classPrivateFieldLooseBase(this, _lambda)[_lambda], _classPrivateFieldLooseBase(this, _serverless)[_serverless].service.provider.region, this.v3Utils);
    _classPrivateFieldLooseBase(this, _schedule)[_schedule].create(events);
  }
  async _createWebSocket(events) {
    const {
      default: WebSocket
    } = await Promise.resolve().then(() => _interopRequireWildcard(require('./events/websocket/index.js')));
    _classPrivateFieldLooseBase(this, _webSocket)[_webSocket] = new WebSocket(_classPrivateFieldLooseBase(this, _serverless)[_serverless], _classPrivateFieldLooseBase(this, _options)[_options], _classPrivateFieldLooseBase(this, _lambda)[_lambda], this.v3Utils);
    _classPrivateFieldLooseBase(this, _webSocket)[_webSocket].create(events);
    return _classPrivateFieldLooseBase(this, _webSocket)[_webSocket].start();
  }
  _mergeOptions() {
    const {
      service: {
        custom = {},
        provider
      }
    } = _classPrivateFieldLooseBase(this, _serverless)[_serverless];
    const customOptions = custom[_index2.CUSTOM_OPTION];

    // merge options
    // order of Precedence: command line options, custom options, defaults.
    _classPrivateFieldLooseBase(this, _options)[_options] = {
      ..._index2.defaultOptions,
      ...customOptions,
      ..._classPrivateFieldLooseBase(this, _cliOptions)[_cliOptions]
    };

    // Parse CORS options
    _classPrivateFieldLooseBase(this, _options)[_options].corsAllowHeaders = _classPrivateFieldLooseBase(this, _options)[_options].corsAllowHeaders.replace(/\s/g, '').split(',');
    _classPrivateFieldLooseBase(this, _options)[_options].corsAllowOrigin = _classPrivateFieldLooseBase(this, _options)[_options].corsAllowOrigin.replace(/\s/g, '').split(',');
    _classPrivateFieldLooseBase(this, _options)[_options].corsExposedHeaders = _classPrivateFieldLooseBase(this, _options)[_options].corsExposedHeaders.replace(/\s/g, '').split(',');
    if (_classPrivateFieldLooseBase(this, _options)[_options].corsDisallowCredentials) {
      _classPrivateFieldLooseBase(this, _options)[_options].corsAllowCredentials = false;
    }
    _classPrivateFieldLooseBase(this, _options)[_options].corsConfig = {
      credentials: _classPrivateFieldLooseBase(this, _options)[_options].corsAllowCredentials,
      exposedHeaders: _classPrivateFieldLooseBase(this, _options)[_options].corsExposedHeaders,
      headers: _classPrivateFieldLooseBase(this, _options)[_options].corsAllowHeaders,
      origin: _classPrivateFieldLooseBase(this, _options)[_options].corsAllowOrigin
    };
    if (this.log) {
      this.log.notice();
      this.log.notice(`Starting Offline at stage ${provider.stage} ${_chalk.default.gray(`(${provider.region})`)}`);
      this.log.notice();
      this.log.debug('options:', _classPrivateFieldLooseBase(this, _options)[_options]);
    } else {
      (0, _serverlessLog.default)(`Starting Offline: ${provider.stage} ${provider.region}.`);
      (0, _debugLog.default)('options:', _classPrivateFieldLooseBase(this, _options)[_options]);
    }
  }
  _getEvents() {
    const {
      service
    } = _classPrivateFieldLooseBase(this, _serverless)[_serverless];
    const httpEvents = [];
    const lambdas = [];
    const scheduleEvents = [];
    const webSocketEvents = [];
    const functionKeys = service.getAllFunctions();
    let hasPrivateHttpEvent = false;
    functionKeys.forEach(functionKey => {
      const functionDefinition = service.getFunction(functionKey);
      lambdas.push({
        functionKey,
        functionDefinition
      });
      const events = service.getAllEventsInFunction(functionKey) || [];
      events.forEach(event => {
        const {
          http,
          httpApi,
          schedule,
          websocket
        } = event;
        if ((http || httpApi) && functionDefinition.handler) {
          const httpEvent = {
            functionKey,
            handler: functionDefinition.handler,
            http: http || httpApi
          };
          if (httpApi) {
            // Ensure definitions for 'httpApi' events are objects so that they can be marked
            // with an 'isHttpApi' property (they are handled differently to 'http' events)
            if (typeof httpEvent.http === 'string') {
              httpEvent.http = {
                routeKey: httpEvent.http === '*' ? '$default' : httpEvent.http
              };
            } else if (typeof httpEvent.http === 'object') {
              if (!httpEvent.http.method) {
                if (this.log) {
                  this.log.warning(`Event definition is missing a method for function "${functionKey}"`);
                } else {
                  (0, _serverlessLog.logWarning)(`Event definition is missing a method for function "${functionKey}"`);
                }
                httpEvent.http.method = '';
              }
              const resolvedMethod = httpEvent.http.method === '*' ? 'ANY' : httpEvent.http.method.toUpperCase();
              httpEvent.http.routeKey = `${resolvedMethod} ${httpEvent.http.path}`;
              // Clear these properties to avoid confusion (they will be derived from the routeKey
              // when needed later)
              delete httpEvent.http.method;
              delete httpEvent.http.path;
            } else {
              if (this.log) {
                this.log.warning(`Event definition must be a string or object but received ${typeof httpEvent.http} for function "${functionKey}"`);
              } else {
                (0, _serverlessLog.logWarning)(`Event definition must be a string or object but received ${typeof httpEvent.http} for function "${functionKey}"`);
              }
              httpEvent.http.routeKey = '';
            }
            httpEvent.http.isHttpApi = true;
            if (functionDefinition.httpApi && functionDefinition.httpApi.payload) {
              httpEvent.http.payload = functionDefinition.httpApi.payload;
            } else {
              httpEvent.http.payload = service.provider.httpApi && service.provider.httpApi.payload ? service.provider.httpApi.payload : '2.0';
            }
          }
          if (http && http.private) {
            hasPrivateHttpEvent = true;
          }
          httpEvents.push(httpEvent);
        }
        if (schedule) {
          scheduleEvents.push({
            functionKey,
            schedule
          });
        }
        if (websocket) {
          webSocketEvents.push({
            functionKey,
            websocket
          });
        }
      });
    });

    // for simple API Key authentication model
    if (hasPrivateHttpEvent) {
      if (this.log) {
        this.log.notice(`Key with token: ${_classPrivateFieldLooseBase(this, _options)[_options].apiKey}`);
      } else {
        (0, _serverlessLog.default)(`Key with token: ${_classPrivateFieldLooseBase(this, _options)[_options].apiKey}`);
      }
      if (_classPrivateFieldLooseBase(this, _options)[_options].noAuth) {
        if (this.log) {
          this.log.notice('Authorizers are turned off. You do not need to use x-api-key header.');
        } else {
          (0, _serverlessLog.default)('Authorizers are turned off. You do not need to use x-api-key header.');
        }
      } else if (this.log) {
        this.log.notice('Remember to use x-api-key on the request headers');
      } else {
        (0, _serverlessLog.default)('Remember to use x-api-key on the request headers');
      }
    }
    return {
      httpEvents,
      lambdas,
      scheduleEvents,
      webSocketEvents
    };
  }

  // TEMP FIXME quick fix to expose gateway server for testing, look for better solution
  getApiGatewayServer() {
    return _classPrivateFieldLooseBase(this, _http)[_http].getServer();
  }

  // TODO: missing tests
  _verifyServerlessVersionCompatibility() {
    const currentVersion = _classPrivateFieldLooseBase(this, _serverless)[_serverless].version;
    const requiredVersionRange = _package.default.peerDependencies.serverless;
    if ((0, _semver.parse)(currentVersion).prerelease.length) {
      // Do not validate, if run against serverless pre-release
      return;
    }
    const versionIsSatisfied = (0, _index.satisfiesVersionRange)(currentVersion, requiredVersionRange);
    if (!versionIsSatisfied) {
      if (this.log) {
        this.log.warning(`serverless-offline requires serverless version ${requiredVersionRange} but found version ${currentVersion}.
         Be aware that functionality might be limited or contains bugs.
         To avoid any issues update serverless to a later version.
        `);
      } else {
        (0, _serverlessLog.logWarning)(`serverless-offline requires serverless version ${requiredVersionRange} but found version ${currentVersion}.
         Be aware that functionality might be limited or contains bugs.
         To avoid any issues update serverless to a later version.
        `);
      }
    }
  }
}
exports.default = ServerlessOffline;