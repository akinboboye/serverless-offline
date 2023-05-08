"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = authJWTSettingsExtractor;
var _serverlessLog = _interopRequireDefault(require("../../serverlessLog.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function authJWTSettingsExtractor(endpoint, provider, ignoreJWTSignature, {
  log
}) {
  const buildFailureResult = warningMessage => {
    if (log) {
      log.warning(warningMessage);
    } else {
      (0, _serverlessLog.default)(`WARNING: ${warningMessage}`);
    }
    return {
      unsupportedAuth: true
    };
  };
  const buildSuccessResult = authorizerName => ({
    authorizerName
  });
  const {
    authorizer
  } = endpoint;
  if (!authorizer) {
    return buildSuccessResult(null);
  }
  if (!provider.httpApi || !provider.httpApi.authorizers) {
    return buildSuccessResult(null);
  }

  // TODO: add code that will actually validate a JWT.
  if (!ignoreJWTSignature) {
    return buildSuccessResult(null);
  }
  if (!authorizer.name) {
    return buildFailureResult('Serverless Offline supports only JWT authorizers referenced by name');
  }
  const httpApiAuthorizer = provider.httpApi.authorizers[authorizer.name];
  if (!httpApiAuthorizer) {
    return buildFailureResult(`JWT authorizer ${authorizer.name} not found`);
  }
  if (!httpApiAuthorizer.identitySource) {
    return buildFailureResult(`JWT authorizer ${authorizer.name} missing identity source`);
  }
  if (!httpApiAuthorizer.issuerUrl) {
    return buildFailureResult(`JWT authorizer ${authorizer.name} missing issuer url`);
  }
  if (!httpApiAuthorizer.audience || httpApiAuthorizer.audience.length === 0) {
    return buildFailureResult(`JWT authorizer ${authorizer.name} missing audience`);
  }
  const result = {
    authorizerName: authorizer.name,
    ...authorizer,
    ...httpApiAuthorizer
  };
  return result;
}