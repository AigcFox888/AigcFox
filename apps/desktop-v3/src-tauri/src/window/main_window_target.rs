use std::error::Error;

use tauri::{Url, WebviewUrl};

const MAIN_WINDOW_DEV_URL: &str = "http://127.0.0.1:1420/";
const MAIN_WINDOW_PROD_PATH: &str = "index.html";
const MAIN_WINDOW_TARGET_MODE_ENV: &str = "AIGCFOX_DESKTOP_V3_WINDOW_TARGET_MODE";

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum MainWindowTargetMode {
    App,
    Dev,
}

#[derive(Debug, Clone)]
pub enum MainWindowTarget {
    Dev {
        origin: String,
        url: String,
        webview_url: WebviewUrl,
    },
    Production {
        path: String,
        webview_url: WebviewUrl,
    },
}

impl MainWindowTarget {
    pub fn allows_navigation(&self, candidate: &Url) -> bool {
        match self {
            Self::Dev { origin, .. } => candidate.origin().ascii_serialization() == *origin,
            Self::Production { .. } => true,
        }
    }

    pub fn log_url(&self) -> &str {
        match self {
            Self::Dev { url, .. } => url,
            Self::Production { path, .. } => path,
        }
    }

    pub fn webview_url(&self) -> &WebviewUrl {
        match self {
            Self::Dev { webview_url, .. } | Self::Production { webview_url, .. } => webview_url,
        }
    }
}

pub fn resolve_main_window_target() -> Result<MainWindowTarget, Box<dyn Error>> {
    match resolve_main_window_target_mode(
        std::env::var(MAIN_WINDOW_TARGET_MODE_ENV).ok().as_deref(),
    )? {
        MainWindowTargetMode::Dev => {
            let raw_url = std::env::var("AIGCFOX_DESKTOP_V3_DEV_WINDOW_URL")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .unwrap_or_else(|| MAIN_WINDOW_DEV_URL.to_string());
            let parsed_url: Url = raw_url.parse()?;
            let origin = parsed_url.origin().ascii_serialization();

            Ok(MainWindowTarget::Dev {
                origin,
                url: raw_url,
                webview_url: WebviewUrl::External(parsed_url),
            })
        }
        MainWindowTargetMode::App => Ok(MainWindowTarget::Production {
            path: MAIN_WINDOW_PROD_PATH.to_string(),
            webview_url: WebviewUrl::App(MAIN_WINDOW_PROD_PATH.into()),
        }),
    }
}

fn resolve_main_window_target_mode(
    raw_mode: Option<&str>,
) -> Result<MainWindowTargetMode, Box<dyn Error>> {
    let normalized_mode = raw_mode
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_ascii_lowercase);

    match normalized_mode.as_deref() {
        Some("app") => Ok(MainWindowTargetMode::App),
        Some("dev") => Ok(MainWindowTargetMode::Dev),
        Some("auto") | None => {
            if cfg!(debug_assertions) {
                Ok(MainWindowTargetMode::Dev)
            } else {
                Ok(MainWindowTargetMode::App)
            }
        }
        Some(other) => Err(format!(
            "{MAIN_WINDOW_TARGET_MODE_ENV} must be one of: auto, app, dev (received {other})"
        )
        .into()),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        MAIN_WINDOW_TARGET_MODE_ENV, MainWindowTarget, MainWindowTargetMode,
        resolve_main_window_target, resolve_main_window_target_mode,
    };
    use tauri::{Url, WebviewUrl};

    #[test]
    fn auto_mode_defaults_to_dev_in_debug_builds() {
        if cfg!(debug_assertions) {
            assert_eq!(
                resolve_main_window_target_mode(None).expect("mode should resolve"),
                MainWindowTargetMode::Dev,
            );
        }
    }

    #[test]
    fn app_mode_override_is_accepted() {
        assert_eq!(
            resolve_main_window_target_mode(Some("app")).expect("mode should resolve"),
            MainWindowTargetMode::App,
        );
    }

    #[test]
    fn invalid_mode_fails_closed() {
        let error = resolve_main_window_target_mode(Some("broken"))
            .expect_err("invalid mode should fail closed");

        assert!(
            error
                .to_string()
                .contains(&format!("{MAIN_WINDOW_TARGET_MODE_ENV} must be one of")),
        );
    }

    #[test]
    fn development_target_defaults_to_local_vite_origin() {
        let target = resolve_main_window_target().expect("target should resolve");

        if cfg!(debug_assertions) {
            match target {
                MainWindowTarget::Dev { origin, url, .. } => {
                    assert_eq!(origin, "http://127.0.0.1:1420");
                    assert_eq!(url, "http://127.0.0.1:1420/");
                }
                MainWindowTarget::Production { .. } => {
                    panic!("debug builds should resolve a development target");
                }
            }
        } else if let MainWindowTarget::Production { path, .. } = target {
            assert_eq!(path, "index.html");
        }
    }

    #[test]
    fn development_target_only_allows_same_origin_navigation() {
        let target = MainWindowTarget::Dev {
            origin: "http://127.0.0.1:1420".to_string(),
            url: "http://127.0.0.1:1420/".to_string(),
            webview_url: WebviewUrl::External(
                "http://127.0.0.1:1420/"
                    .parse()
                    .expect("dev url should parse"),
            ),
        };

        assert!(target.allows_navigation(
            &Url::parse("http://127.0.0.1:1420/diagnostics").expect("candidate should parse"),
        ));
        assert!(!target.allows_navigation(
            &Url::parse("http://localhost:1420/diagnostics").expect("candidate should parse"),
        ));
        assert!(!target.allows_navigation(
            &Url::parse("https://tauri.app/").expect("candidate should parse"),
        ));
    }
}
