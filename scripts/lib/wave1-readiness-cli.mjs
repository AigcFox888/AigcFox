export async function runWave1ReadinessCli(options) {
  const {
    argv,
    buildHelpText,
    consoleLogImpl = console.log,
    runImpl,
    successMessage,
  } = options;

  if (argv.includes("--help")) {
    consoleLogImpl(buildHelpText());
    return { help: true };
  }

  const summary = await runImpl();
  consoleLogImpl(successMessage(summary));
  return summary;
}
