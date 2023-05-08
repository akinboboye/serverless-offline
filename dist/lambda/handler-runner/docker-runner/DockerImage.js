"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _execa = _interopRequireDefault(require("execa"));
var _pMemoize = _interopRequireDefault(require("p-memoize"));
var _debugLog = _interopRequireDefault(require("../../../debugLog.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _classPrivateFieldLooseBase(receiver, privateKey) { if (!Object.prototype.hasOwnProperty.call(receiver, privateKey)) { throw new TypeError("attempted to use private field on non-instance"); } return receiver; }
var id = 0;
function _classPrivateFieldLooseKey(name) { return "__private_" + id++ + "_" + name; }
var _imageNameTag = /*#__PURE__*/_classPrivateFieldLooseKey("imageNameTag");
class DockerImage {
  constructor(imageNameTag, v3Utils) {
    Object.defineProperty(this, _imageNameTag, {
      writable: true,
      value: null
    });
    _classPrivateFieldLooseBase(this, _imageNameTag)[_imageNameTag] = imageNameTag;
    if (v3Utils) {
      this.log = v3Utils.log;
      this.progress = v3Utils.progress;
      this.writeText = v3Utils.writeText;
      this.v3Utils = v3Utils;
    }
  }
  static async _pullImage(imageNameTag) {
    if (this.log) {
      this.log.debug(`Downloading base Docker image... (${imageNameTag})`);
    } else {
      (0, _debugLog.default)(`Downloading base Docker image... (${imageNameTag})`);
    }
    try {
      await (0, _execa.default)('docker', ['pull', '--disable-content-trust=false', imageNameTag]);
    } catch (err) {
      if (this.log) {
        this.log.error(err.stderr);
      } else {
        console.error(err.stderr);
      }
      throw err;
    }
  }
  async pull() {
    return DockerImage._memoizedPull(_classPrivateFieldLooseBase(this, _imageNameTag)[_imageNameTag], this.v3Utils);
  }
}
exports.default = DockerImage;
DockerImage._memoizedPull = (0, _pMemoize.default)(DockerImage._pullImage);