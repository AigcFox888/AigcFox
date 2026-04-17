const linuxTempDir = "/tmp";

function isWslHost(env: NodeJS.ProcessEnv) {
  return typeof env.WSL_DISTRO_NAME === "string" && env.WSL_DISTRO_NAME.trim().length > 0;
}

function isWindowsStyleTempPath(value: string) {
  return (
    /^[A-Za-z]:\\/u.test(value) ||
    value.startsWith("/mnt/c/") ||
    value.includes("AppData/Local/Temp")
  );
}

export function normalizeVitestTempEnv(env: NodeJS.ProcessEnv = process.env) {
  if (process.platform !== "linux" || !isWslHost(env)) {
    return;
  }

  const candidates = [env.TMPDIR, env.TMP, env.TEMP]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  if (!candidates.some((value) => isWindowsStyleTempPath(value))) {
    return;
  }

  env.TMPDIR = linuxTempDir;
  env.TMP = linuxTempDir;
  env.TEMP = linuxTempDir;
}
