"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _os = require("os");
var _path = require("path");
var _execa = _interopRequireDefault(require("execa"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
const {
  parse,
  stringify
} = JSON;
const {
  cwd
} = process;
const {
  has
} = Reflect;
var _env = /*#__PURE__*/_classPrivateFieldLooseKey("env");
var _handlerName = /*#__PURE__*/_classPrivateFieldLooseKey("handlerName");
var _handlerPath = /*#__PURE__*/_classPrivateFieldLooseKey("handlerPath");
var _allowCache = /*#__PURE__*/_classPrivateFieldLooseKey("allowCache");
class RubyRunner {
  constructor(funOptions, env, allowCache, v3Utils) {
    Object.defineProperty(this, _env, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _handlerName, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _handlerPath, {
      writable: true,
      value: null
    });
    Object.defineProperty(this, _allowCache, {
      writable: true,
      value: false
    });
    const {
      handlerName,
      handlerPath
    } = funOptions;
    _classPrivateFieldLooseBase(this, _env)[_env] = env;
    _classPrivateFieldLooseBase(this, _handlerName)[_handlerName] = handlerName;
    _classPrivateFieldLooseBase(this, _handlerPath)[_handlerPath] = handlerPath;
    _classPrivateFieldLooseBase(this, _allowCache)[_allowCache] = allowCache;
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
  }

  // no-op
  // () => void
  cleanup() {}
  _parsePayload(value) {
    let payload;
    for (const item of value.split(_os.EOL)) {
      let json;

      // first check if it's JSON
      try {
        json = parse(item);
        // nope, it's not JSON
      } catch (err) {
        // no-op
      }

      // now let's see if we have a property __offline_payload__
      if (json && typeof json === 'object' && has(json, '__offline_payload__')) {
        payload = json.__offline_payload__;
      } else if (this.log) {
        this.log.notice(item);
      } else {
        console.log(item); // log non-JSON stdout to console (puts, p, logger.info, ...)
      }
    }

    return payload;
  }

  // invokeLocalRuby, loosely based on:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/index.js#L556
  // invoke.rb, copy/pasted entirely as is:
  // https://github.com/serverless/serverless/blob/v1.50.0/lib/plugins/aws/invokeLocal/invoke.rb
  async run(event, context) {
    const runtime = (0, _os.platform)() === 'win32' ? 'ruby.exe' : 'ruby';

    // https://docs.aws.amazon.com/lambda/latest/dg/ruby-context.html

    // https://docs.aws.amazon.com/lambda/latest/dg/ruby-context.html
    // exclude callbackWaitsForEmptyEventLoop, don't mutate context
    const {
      callbackWaitsForEmptyEventLoop,
      ..._context
    } = context;
    const input = stringify({
      context: _context,
      event,
      allowCache: _classPrivateFieldLooseBase(this, _allowCache)[_allowCache]
    });

    // console.log(input)

    const ruby = (0, _execa.default)(runtime, [(0, _path.resolve)(__dirname, 'invoke.rb'), (0, _path.relative)(cwd(), _classPrivateFieldLooseBase(this, _handlerPath)[_handlerPath]), _classPrivateFieldLooseBase(this, _handlerName)[_handlerName]], {
      env: _classPrivateFieldLooseBase(this, _env)[_env],
      input
      // shell: true,
    });

    const result = await ruby;
    const {
      stderr,
      stdout
    } = result;
    if (stderr) {
      // TODO

      if (this.log) {
        this.log.notice(stderr);
      } else {
        console.log(stderr);
      }
    }
    return this._parsePayload(stdout);
  }
}
exports.default = RubyRunner;