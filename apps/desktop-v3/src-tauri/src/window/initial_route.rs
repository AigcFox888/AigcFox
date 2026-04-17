use std::error::Error;

const MAIN_WINDOW_INITIAL_ROUTE_ENV: &str = "AIGCFOX_DESKTOP_V3_WINDOW_INITIAL_ROUTE";

pub fn build_main_window_initialization_script() -> Result<Option<String>, Box<dyn Error>> {
    build_main_window_initialization_script_for_route(
        std::env::var(MAIN_WINDOW_INITIAL_ROUTE_ENV).ok().as_deref(),
    )
}

fn resolve_main_window_initial_route(raw_route: Option<&str>) -> Result<Option<String>, Box<dyn Error>> {
    let normalized_route = normalize_main_window_initial_route(raw_route);

    match normalized_route.as_deref() {
        None => Ok(None),
        Some("/") | Some("/diagnostics") | Some("/preferences") => Ok(normalized_route),
        Some(other) => Err(format!(
            "{MAIN_WINDOW_INITIAL_ROUTE_ENV} must be one of: /, /diagnostics, /preferences (received {other})"
        )
        .into()),
    }
}

fn normalize_main_window_initial_route(raw_route: Option<&str>) -> Option<String> {
    let trimmed_route = raw_route?.trim();

    if trimmed_route.is_empty() {
        return None;
    }

    if trimmed_route.starts_with('/') {
        return Some(trimmed_route.to_string());
    }

    Some(format!("/{trimmed_route}"))
}

fn build_main_window_initialization_script_for_route(
    raw_route: Option<&str>,
) -> Result<Option<String>, Box<dyn Error>> {
    let Some(route) = resolve_main_window_initial_route(raw_route)? else {
        return Ok(None);
    };

    if route == "/" {
        return Ok(None);
    }

    let target_hash = format!("#{route}");

    Ok(Some(format!(
        "(() => {{ const targetHash = {target_hash:?}; if (window.location.hash !== targetHash) {{ window.location.hash = targetHash; }} }})();"
    )))
}

#[cfg(test)]
mod tests {
    use super::{
        build_main_window_initialization_script_for_route, normalize_main_window_initial_route,
        resolve_main_window_initial_route,
    };

    #[test]
    fn empty_route_disables_initialization_script() {
        assert_eq!(normalize_main_window_initial_route(None), None);
        assert_eq!(normalize_main_window_initial_route(Some("   ")), None);
    }

    #[test]
    fn accepts_allowed_routes_with_or_without_leading_slash() {
        assert_eq!(
            resolve_main_window_initial_route(Some("diagnostics"))
                .expect("route should resolve"),
            Some("/diagnostics".to_string())
        );
        assert_eq!(
            resolve_main_window_initial_route(Some("/preferences"))
                .expect("route should resolve"),
            Some("/preferences".to_string())
        );
    }

    #[test]
    fn rejects_unknown_routes() {
        let error = resolve_main_window_initial_route(Some("/broken"))
            .expect_err("route should fail closed");

        assert!(error.to_string().contains("/diagnostics"));
    }

    #[test]
    fn builds_hash_initialization_script_for_non_root_route() {
        let script = build_main_window_initialization_script_for_route(Some("/diagnostics"))
            .expect("script should build")
            .expect("script should be present");

        assert!(script.contains("#/diagnostics"));
    }
}
