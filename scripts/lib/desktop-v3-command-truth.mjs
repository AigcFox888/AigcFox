function freezeObjectArray(entries) {
  return Object.freeze(entries.map((entry) => Object.freeze({ ...entry })));
}

export const desktopV3FrozenCommandModuleOrder = Object.freeze([
  "backend",
  "diagnostics",
  "preferences",
  "renderer",
]);

export const desktopV3FrozenPermissionOrder = Object.freeze([
  "desktop-preferences-read",
  "desktop-preferences-write",
  "desktop-diagnostics-read",
  "desktop-backend-probe-read",
  "desktop-renderer-boot-write",
]);

export const desktopV3FrozenCommands = freezeObjectArray([
  {
    moduleName: "backend",
    name: "desktop_get_backend_liveness",
    payloadTypeText: "undefined",
    permissionId: "desktop-backend-probe-read",
    resultTypeText: "BackendProbe",
  },
  {
    moduleName: "backend",
    name: "desktop_get_backend_readiness",
    payloadTypeText: "undefined",
    permissionId: "desktop-backend-probe-read",
    resultTypeText: "BackendProbe",
  },
  {
    moduleName: "diagnostics",
    name: "desktop_get_diagnostics_snapshot",
    payloadTypeText: "undefined",
    permissionId: "desktop-diagnostics-read",
    resultTypeText: "DiagnosticsSnapshot",
  },
  {
    moduleName: "preferences",
    name: "desktop_get_theme_preference",
    payloadTypeText: "undefined",
    permissionId: "desktop-preferences-read",
    resultTypeText: "ThemePreference",
  },
  {
    moduleName: "preferences",
    name: "desktop_set_theme_preference",
    payloadTypeText: "{ mode: ThemeMode; }",
    permissionId: "desktop-preferences-write",
    resultTypeText: "ThemePreference",
  },
  {
    moduleName: "renderer",
    name: "desktop_report_renderer_boot",
    payloadTypeText: "{ route: string; runtime: string; stage: RendererBootStage; }",
    permissionId: "desktop-renderer-boot-write",
    resultTypeText: "void",
  },
]);

export function buildDesktopV3PermissionEntriesFromFrozenCommands(
  commands = desktopV3FrozenCommands,
  permissionOrder = desktopV3FrozenPermissionOrder,
) {
  return freezeObjectArray(
    permissionOrder.map((permissionId) => ({
      commands: commands
        .filter((command) => command.permissionId === permissionId)
        .map((command) => command.name),
      identifier: permissionId,
    })),
  );
}

export function buildDesktopV3CommandPayloadEntriesFromFrozenCommands(
  commands = desktopV3FrozenCommands,
) {
  return freezeObjectArray(
    commands.map((command) => ({
      name: command.name,
      optional: false,
      typeText: command.payloadTypeText,
    })),
  );
}

export function buildDesktopV3CommandResultEntriesFromFrozenCommands(
  commands = desktopV3FrozenCommands,
) {
  return freezeObjectArray(
    commands.map((command) => ({
      name: command.name,
      optional: false,
      typeText: command.resultTypeText,
    })),
  );
}

export const desktopV3AllowedCommandModuleNames = Object.freeze([
  ...desktopV3FrozenCommandModuleOrder,
]);

export const desktopV3AllowedCommandModules = Object.freeze([
  "backend.rs",
  "diagnostics.rs",
  "mod.rs",
  "preferences.rs",
  "renderer.rs",
]);

export const desktopV3AllowedTauriCommands = Object.freeze(
  desktopV3FrozenCommands.map((command) => command.name),
);

export const desktopV3AllowedAppPermissions = Object.freeze([
  ...desktopV3FrozenPermissionOrder,
]);

export const desktopV3AllowedPermissionEntries =
  buildDesktopV3PermissionEntriesFromFrozenCommands();

export const desktopV3AllowedTsDesktopCommandPayloadEntries =
  buildDesktopV3CommandPayloadEntriesFromFrozenCommands();

export const desktopV3AllowedTsDesktopCommandResultEntries =
  buildDesktopV3CommandResultEntriesFromFrozenCommands();
