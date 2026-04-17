use tauri::webview::PageLoadEvent;

pub fn log_main_window_navigation(url: &str, allowed: bool) {
    eprintln!("desktop-v3.main-window.navigation allowed={allowed} url={url}");
}

pub fn log_main_window_page_load(event: PageLoadEvent, url: &str) {
    let event_name = match event {
        PageLoadEvent::Started => "started",
        PageLoadEvent::Finished => "finished",
    };

    eprintln!("desktop-v3.main-window.page-load event={event_name} url={url}");
}

pub fn log_main_window_target(url: &str) {
    eprintln!("desktop-v3.main-window.url {url}");
}
