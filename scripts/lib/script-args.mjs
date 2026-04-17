export function getArgValue(argv, name) {
  const prefix = `${name}=`;
  const matched = argv.find((value) => value.startsWith(prefix));
  return matched ? matched.slice(prefix.length) : null;
}

export function getPlatformArg(argv, options = {}) {
  const platform = getArgValue(argv, "--platform");
  if (platform) {
    return platform;
  }

  if (options.allowLegacyFlags === true) {
    const args = new Set(argv);
    if (args.has("--win")) {
      return "win";
    }

    if (args.has("--mac")) {
      return "mac";
    }
  }

  return null;
}
