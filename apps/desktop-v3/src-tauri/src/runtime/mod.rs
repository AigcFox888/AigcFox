pub mod client;
pub mod diagnostics;
pub mod localdb;
pub mod models;
pub mod security;
pub mod state;

use std::path::PathBuf;

use tauri::{AppHandle, Manager};

use crate::error::RuntimeError;
use crate::runtime::client::backend_client::BackendClient;
use crate::runtime::diagnostics::DiagnosticsService;
use crate::runtime::localdb::LocalDatabase;
use crate::runtime::models::{
    BackendProbe, DiagnosticsSnapshot, ThemeMode, ThemePreference, utc_now,
};
use crate::runtime::security::SecureStore;
use crate::runtime::state::SessionState;

const THEME_PREFERENCE_KEY: &str = "ui.theme_mode";

#[derive(Debug, Clone)]
pub struct DesktopRuntime {
    backend_client: BackendClient,
    diagnostics_service: DiagnosticsService,
    local_database: LocalDatabase,
    secure_store: SecureStore,
    session_state: SessionState,
}

impl DesktopRuntime {
    pub fn bootstrap(app: AppHandle) -> Result<Self, RuntimeError> {
        let database_path = resolve_local_database_path(&app)?;
        let local_database = LocalDatabase::new(database_path.clone());
        local_database.initialize()?;

        if local_database
            .get_preference(THEME_PREFERENCE_KEY)?
            .is_none()
        {
            local_database.set_preference(
                THEME_PREFERENCE_KEY,
                ThemeMode::default().as_storage_value(),
            )?;
        }

        let backend_client = BackendClient::new(resolve_backend_base_url())?;
        let diagnostics_service = DiagnosticsService::new(
            app.package_info().version.to_string(),
            backend_client.base_url(),
            database_path.display().to_string(),
            std::env::consts::OS.to_string(),
        );

        Ok(Self {
            backend_client,
            diagnostics_service,
            local_database,
            secure_store: SecureStore,
            session_state: SessionState::default(),
        })
    }

    pub fn get_theme_preference(&self) -> Result<ThemePreference, RuntimeError> {
        let raw_value = self
            .local_database
            .get_preference(THEME_PREFERENCE_KEY)?
            .unwrap_or_else(|| ThemeMode::default().as_storage_value().to_string());

        let mode = ThemeMode::from_storage_value(&raw_value)?;
        Ok(ThemePreference {
            mode,
            updated_at: utc_now(),
        })
    }

    pub fn set_theme_preference(&self, mode: ThemeMode) -> Result<ThemePreference, RuntimeError> {
        self.local_database
            .set_preference(THEME_PREFERENCE_KEY, mode.as_storage_value())?;

        Ok(ThemePreference {
            mode,
            updated_at: utc_now(),
        })
    }

    pub async fn get_diagnostics_snapshot(&self) -> Result<DiagnosticsSnapshot, RuntimeError> {
        self.local_database.probe()?;
        let sync_cache_stats = self.local_database.get_sync_cache_stats()?;
        let session_snapshot = self.session_state.snapshot().await;

        let theme_mode = self.get_theme_preference()?.mode;
        Ok(self.diagnostics_service.snapshot(
            "ready".to_string(),
            sync_cache_stats.dirty_entries,
            session_snapshot.last_backend_probe_at,
            self.secure_store.snapshot(),
            sync_cache_stats.total_entries,
            theme_mode,
        ))
    }

    pub async fn get_backend_liveness(&self) -> Result<BackendProbe, RuntimeError> {
        let probe = self.backend_client.get_liveness().await?;
        self.session_state
            .record_backend_probe(probe.checked_at.clone())
            .await;
        Ok(probe)
    }

    pub async fn get_backend_readiness(&self) -> Result<BackendProbe, RuntimeError> {
        let probe = self.backend_client.get_readiness().await?;
        self.session_state
            .record_backend_probe(probe.checked_at.clone())
            .await;
        Ok(probe)
    }

    pub async fn run_startup_backend_probe(&self) {
        eprintln!("desktop-v3.startup-backend-probe.begin");

        match self.get_backend_liveness().await {
            Ok(probe) => {
                eprintln!(
                    "desktop-v3.startup-backend-probe.liveness.ok service={} status={} request_id={}",
                    normalize_log_value(&probe.service),
                    normalize_log_value(&probe.status),
                    normalize_log_value(probe.request_id.as_deref().unwrap_or("-"))
                );
            }
            Err(error) => {
                eprintln!(
                    "desktop-v3.startup-backend-probe.liveness.err {}",
                    normalize_log_value(&error.to_string())
                );
            }
        }

        match self.get_backend_readiness().await {
            Ok(probe) => {
                eprintln!(
                    "desktop-v3.startup-backend-probe.readiness.ok service={} status={} request_id={}",
                    normalize_log_value(&probe.service),
                    normalize_log_value(&probe.status),
                    normalize_log_value(probe.request_id.as_deref().unwrap_or("-"))
                );
            }
            Err(error) => {
                eprintln!(
                    "desktop-v3.startup-backend-probe.readiness.err {}",
                    normalize_log_value(&error.to_string())
                );
            }
        }

        eprintln!("desktop-v3.startup-backend-probe.end");
    }

    pub async fn report_renderer_boot(
        &self,
        stage: String,
        route: String,
        runtime: String,
    ) -> Result<(), RuntimeError> {
        eprintln!(
            "desktop-v3.renderer.boot stage={} route={} runtime={}",
            normalize_log_value(&stage),
            normalize_log_value(&route),
            normalize_log_value(&runtime),
        );
        Ok(())
    }
}

fn resolve_backend_base_url() -> String {
    crate::env::optional_env(crate::env::BACKEND_BASE_URL_ENV)
        .unwrap_or_else(|| "http://127.0.0.1:3211".to_string())
}

fn resolve_local_database_path(app: &AppHandle) -> Result<PathBuf, RuntimeError> {
    let mut directory = app
        .path()
        .app_data_dir()
        .map_err(|error| RuntimeError::Internal(error.to_string()))?;
    directory.push("aigcfox");
    directory.push("desktop-v3.sqlite3");
    Ok(directory)
}

fn normalize_log_value(value: &str) -> String {
    let trimmed = value.trim();

    if trimmed.is_empty() {
        return "-".to_string();
    }

    trimmed.split_whitespace().collect::<Vec<_>>().join("_")
}

#[cfg(test)]
mod tests {
    use super::normalize_log_value;

    #[test]
    fn normalizes_log_values_into_single_tokens() {
        assert_eq!(normalize_log_value("  backend \n warming\tup "), "backend_warming_up");
    }

    #[test]
    fn empty_log_values_fall_back_to_placeholder() {
        assert_eq!(normalize_log_value("   "), "-");
    }
}
