export const macosSigningReservedEnvVarNames = [
  "AIGCFOX_MAC_SIGNING_ENABLED",
  "AIGCFOX_MAC_SIGNING_IDENTITY",
  "AIGCFOX_MAC_SIGNING_TEAM_ID",
  "AIGCFOX_MAC_ENTITLEMENTS_PATH",
  "AIGCFOX_MAC_ENTITLEMENTS_INHERIT_PATH"
];

export const macosNotarizationReservedEnvVarNames = [
  "AIGCFOX_MAC_NOTARY_ENABLED",
  "AIGCFOX_MAC_NOTARY_KEYCHAIN_PROFILE"
];

export const macosReservedEnvVarNames = [
  ...macosSigningReservedEnvVarNames,
  ...macosNotarizationReservedEnvVarNames
];

export const macosTriggerEnvVarNames = [
  "AIGCFOX_MAC_SIGNING_ENABLED",
  "AIGCFOX_MAC_NOTARY_ENABLED"
];

export function getEnvValue(name, env = process.env) {
  return typeof env[name] === "string" ? env[name].trim() : "";
}

export function isTruthyEnv(name, env = process.env) {
  const normalized = getEnvValue(name, env).toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function uniqueNonEmptyStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.length > 0))];
}
