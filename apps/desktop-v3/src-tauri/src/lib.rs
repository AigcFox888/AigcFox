mod commands;
mod env;
mod error;
mod runtime;
mod window;

use tauri::Manager;

use crate::runtime::DesktopRuntime;

fn should_run_startup_backend_probe() -> bool {
    env::env_flag("AIGCFOX_DESKTOP_V3_STARTUP_BACKEND_PROBE")
}

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let runtime = DesktopRuntime::bootstrap(app.handle().clone())
                .map_err(|error| Box::new(error) as Box<dyn std::error::Error>)?;

            window::ensure_main_window(app)?;

            if should_run_startup_backend_probe() {
                eprintln!("desktop-v3.startup-backend-probe.scheduled");
                let startup_probe_runtime = runtime.clone();
                tauri::async_runtime::spawn(async move {
                    startup_probe_runtime.run_startup_backend_probe().await;
                });
            }

            app.manage(runtime);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::preferences::desktop_get_theme_preference,
            commands::preferences::desktop_set_theme_preference,
            commands::diagnostics::desktop_get_diagnostics_snapshot,
            commands::backend::desktop_get_backend_liveness,
            commands::backend::desktop_get_backend_readiness,
            commands::renderer::desktop_report_renderer_boot,
        ])
        .run(tauri::generate_context!())
        .expect("failed to run aigcfox desktop-v3");
}
