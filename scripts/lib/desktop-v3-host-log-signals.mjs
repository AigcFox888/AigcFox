export function stripAnsi(value) {
  return value.replace(/\u001B\[[0-9;]*[A-Za-z]/g, "");
}

export function detectDesktopV3DevStartupFailure(output) {
  const normalized = stripAnsi(output);
  const portInUseMatch = normalized.match(/Error:\s*Port\s+(\d+)\s+is already in use/u);

  if (portInUseMatch) {
    return `desktop-v3 tauri dev could not start because Vite port ${portInUseMatch[1]} is already in use.`;
  }

  if (
    /The "beforeDevCommand" terminated with a non-zero status code\./u.test(normalized)
    && !normalized.includes("Local:   http://127.0.0.1:31420/")
    && !normalized.includes("Running DevCommand (`cargo  run --no-default-features --color always --`)")
  ) {
    return "desktop-v3 tauri dev failed before the Rust host booted; see tauri-dev.log for the beforeDevCommand failure.";
  }

  return null;
}

function collectMatches(value, expression, mapMatch) {
  return Array.from(value.matchAll(expression), (match) => mapMatch(match));
}

export function detectDesktopV3HostMarkers(output) {
  const normalized = stripAnsi(output);
  const pageLoads = collectMatches(
    normalized,
    /desktop-v3\.main-window\.page-load event=(started|finished) url=(\S+)/gu,
    (match) => ({
      event: match[1],
      url: match[2],
    }),
  );
  const navigations = collectMatches(
    normalized,
    /desktop-v3\.main-window\.navigation allowed=(true|false) url=(\S+)/gu,
    (match) => ({
      allowed: match[1] === "true",
      url: match[2],
    }),
  );
  const rendererBoots = collectMatches(
    normalized,
    /desktop-v3\.renderer\.boot stage=(\S+) route=(\S+) runtime=(\S+)/gu,
    (match) => ({
      stage: match[1],
      route: match[2],
      runtime: match[3],
    }),
  );
  const commandInvocations = collectMatches(
    normalized,
    /desktop-v3\.command\.invoke name=(\S+)/gu,
    (match) => match[1],
  );
  const devRequests = collectMatches(
    normalized,
    /desktop-v3\.dev\.request method=(\S+) url=(\S+)/gu,
    (match) => ({
      method: match[1],
      url: match[2],
    }),
  );

  return {
    cargoRunning: /Running.*aigcfox-desktop-v3/u.test(normalized),
    commandInvocations,
    devRequests,
    documentBootSeen: rendererBoots.some((entry) => entry.stage === "document"),
    mainWindowNavigations: navigations,
    pageLoads,
    rendererBoots,
    rendererBootSeen: rendererBoots.some((entry) => entry.stage === "app"),
    mainWindowPageLoadStarted: pageLoads.some((entry) => entry.event === "started"),
    mainWindowPageLoadFinished: pageLoads.some((entry) => entry.event === "finished"),
    viteReady: normalized.includes("Local:   http://127.0.0.1:31420/"),
    windowWarnings: normalized
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /libEGL warning|MESA: error|GLib-CRITICAL/u.test(line)),
  };
}
