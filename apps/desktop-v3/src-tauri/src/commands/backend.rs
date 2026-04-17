use tauri::State;

use crate::commands::trace_desktop_command;
use crate::error::CommandError;
use crate::runtime::DesktopRuntime;
use crate::runtime::models::BackendProbe;

#[tauri::command]
pub async fn desktop_get_backend_liveness(
    runtime: State<'_, DesktopRuntime>,
) -> Result<BackendProbe, CommandError> {
    trace_desktop_command("desktop_get_backend_liveness");
    runtime.get_backend_liveness().await.map_err(Into::into)
}

#[tauri::command]
pub async fn desktop_get_backend_readiness(
    runtime: State<'_, DesktopRuntime>,
) -> Result<BackendProbe, CommandError> {
    trace_desktop_command("desktop_get_backend_readiness");
    runtime.get_backend_readiness().await.map_err(Into::into)
}
