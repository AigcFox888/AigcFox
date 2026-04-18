use tauri::State;

use crate::commands::trace_desktop_command;
use crate::error::CommandError;
use crate::runtime::DesktopRuntime;
use crate::runtime::models::{ThemeMode, ThemePreference};

#[tauri::command]
pub async fn desktop_get_theme_preference(
    runtime: State<'_, DesktopRuntime>,
) -> Result<ThemePreference, CommandError> {
    trace_desktop_command("desktop_get_theme_preference");
    runtime.get_theme_preference().map_err(Into::into)
}

#[tauri::command]
pub async fn desktop_set_theme_preference(
    mode: ThemeMode,
    runtime: State<'_, DesktopRuntime>,
) -> Result<ThemePreference, CommandError> {
    trace_desktop_command("desktop_set_theme_preference");
    runtime.set_theme_preference(mode).map_err(Into::into)
}
