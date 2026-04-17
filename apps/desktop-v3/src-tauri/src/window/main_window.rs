use std::error::Error;

use tauri::{App, Manager, WebviewWindowBuilder};

use crate::window::initial_route::build_main_window_initialization_script;
use crate::window::main_window_target::resolve_main_window_target;
use crate::window::telemetry::{
    log_main_window_navigation, log_main_window_page_load, log_main_window_target,
};

const MAIN_WINDOW_HEIGHT: f64 = 900.0;
const MAIN_WINDOW_LABEL: &str = "main";
const MAIN_WINDOW_MIN_HEIGHT: f64 = 720.0;
const MAIN_WINDOW_MIN_WIDTH: f64 = 1000.0;
const MAIN_WINDOW_TITLE: &str = "AigcFox Desktop V3";
const MAIN_WINDOW_WIDTH: f64 = 1440.0;

pub fn ensure_main_window(app: &App) -> Result<(), Box<dyn Error>> {
    if app.get_webview_window(MAIN_WINDOW_LABEL).is_some() {
        return Ok(());
    }

    let target = resolve_main_window_target()?;
    log_main_window_target(target.log_url());

    let navigation_target = target.clone();
    let mut builder = WebviewWindowBuilder::new(app, MAIN_WINDOW_LABEL, target.webview_url().clone())
        .title(MAIN_WINDOW_TITLE)
        .inner_size(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT)
        .min_inner_size(MAIN_WINDOW_MIN_WIDTH, MAIN_WINDOW_MIN_HEIGHT)
        .resizable(true)
        .center();

    if let Some(initialization_script) = build_main_window_initialization_script()? {
        builder = builder.initialization_script(initialization_script);
    }

    builder
        .on_navigation(move |url| {
            let allowed = navigation_target.allows_navigation(url);
            log_main_window_navigation(url.as_str(), allowed);
            allowed
        })
        .on_page_load(|_window, payload| {
            log_main_window_page_load(payload.event(), payload.url().as_str());
        })
        .build()?;

    Ok(())
}
