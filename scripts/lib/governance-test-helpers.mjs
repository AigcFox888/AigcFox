export async function importFreshModule(moduleUrl, label) {
  return import(`${moduleUrl}?case=${encodeURIComponent(`${label}-${Date.now()}-${Math.random()}`)}`);
}
