use tauri::State;

use crate::commands::trace_desktop_command;
use crate::error::CommandError;
use crate::runtime::DesktopRuntime;

#[tauri::command]
pub async fn desktop_report_renderer_boot(
    route: String,
    runtime: String,
    stage: String,
    runtime_state: State<'_, DesktopRuntime>,
) -> Result<(), CommandError> {
    trace_desktop_command("desktop_report_renderer_boot");
    runtime_state
        .report_renderer_boot(stage, route, runtime)
        .await
        .map_err(Into::into)
}
