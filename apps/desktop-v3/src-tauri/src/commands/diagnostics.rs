use tauri::State;

use crate::commands::trace_desktop_command;
use crate::error::CommandError;
use crate::runtime::DesktopRuntime;
use crate::runtime::models::DiagnosticsSnapshot;

#[tauri::command]
pub async fn desktop_get_diagnostics_snapshot(
    runtime: State<'_, DesktopRuntime>,
) -> Result<DiagnosticsSnapshot, CommandError> {
    trace_desktop_command("desktop_get_diagnostics_snapshot");
    runtime.get_diagnostics_snapshot().await.map_err(Into::into)
}
