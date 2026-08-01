const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withIAP(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.in-app-payments'] =
      mod.modResults['com.apple.developer.in-app-payments'] || [];
    return mod;
  });
};
