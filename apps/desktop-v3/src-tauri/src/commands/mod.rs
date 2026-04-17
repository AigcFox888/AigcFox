pub mod backend;
pub mod diagnostics;
pub mod preferences;
pub mod renderer;

fn should_trace_desktop_commands() -> bool {
    crate::env::env_flag("AIGCFOX_DESKTOP_V3_TRACE_COMMANDS")
}

pub fn trace_desktop_command(command_name: &str) {
    if should_trace_desktop_commands() {
        eprintln!("desktop-v3.command.invoke name={command_name}");
    }
}
