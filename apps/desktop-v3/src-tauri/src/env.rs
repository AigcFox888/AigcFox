pub const BACKEND_BASE_URL_ENV: &str = "AIGCFOX_BACKEND_BASE_URL";
pub const DEV_WINDOW_URL_ENV: &str = "AIGCFOX_DESKTOP_V3_DEV_WINDOW_URL";
pub const MAIN_WINDOW_INITIAL_ROUTE_ENV: &str = "AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE";
pub const MAIN_WINDOW_TARGET_MODE_ENV: &str = "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE";
pub const STARTUP_BACKEND_PROBE_ENV: &str = "AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE";
pub const TRACE_COMMANDS_ENV: &str = "AIGCFOX_DESKTOP_V3_TRACE_COMMANDS";

pub fn env_flag(name: &str) -> bool {
    matches!(
        std::env::var(name).ok().as_deref(),
        Some("1" | "true" | "TRUE" | "yes" | "YES")
    )
}

pub fn optional_env(name: &str) -> Option<String> {
    std::env::var(name)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}
