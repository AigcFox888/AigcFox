use crate::runtime::models::{DiagnosticsSnapshot, ThemeMode, utc_now};
use crate::runtime::security::SecureStoreSnapshot;

#[derive(Debug, Clone)]
pub struct DiagnosticsService {
    app_version: String,
    backend_base_url: String,
    database_path: String,
    platform: String,
}

impl DiagnosticsService {
    pub fn new(
        app_version: String,
        backend_base_url: String,
        database_path: String,
        platform: String,
    ) -> Self {
        Self {
            app_version,
            backend_base_url,
            database_path,
            platform,
        }
    }

    pub fn snapshot(
        &self,
        database_status: String,
        dirty_sync_cache_entry_count: u32,
        last_backend_probe_at: Option<String>,
        secure_store: SecureStoreSnapshot,
        sync_cache_entry_count: u32,
        theme_mode: ThemeMode,
    ) -> DiagnosticsSnapshot {
        DiagnosticsSnapshot {
            app_version: self.app_version.clone(),
            backend_base_url: self.backend_base_url.clone(),
            checked_at: utc_now(),
            database_path: self.database_path.clone(),
            database_status,
            dirty_sync_cache_entry_count,
            last_backend_probe_at,
            platform: self.platform.clone(),
            secure_store,
            sync_cache_entry_count,
            theme_mode,
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::runtime::diagnostics::DiagnosticsService;
    use crate::runtime::models::ThemeMode;
    use crate::runtime::security::{SecureStoreSnapshot, SecureStoreStatus};

    #[test]
    fn builds_snapshot_with_sync_cache_and_probe_metadata() {
        let service = DiagnosticsService::new(
            "0.1.0".to_string(),
            "http://127.0.0.1:3211".to_string(),
            "/tmp/desktop-v3.sqlite3".to_string(),
            "linux".to_string(),
        );

        let snapshot = service.snapshot(
            "ready".to_string(),
            1,
            Some("2026-04-13T00:00:00.000Z".to_string()),
            SecureStoreSnapshot {
                provider: "os-keyring".to_string(),
                status: SecureStoreStatus::Reserved,
                writes_enabled: false,
            },
            2,
            ThemeMode::Dark,
        );

        assert_eq!(snapshot.database_status, "ready");
        assert_eq!(snapshot.dirty_sync_cache_entry_count, 1);
        assert_eq!(snapshot.sync_cache_entry_count, 2);
        assert_eq!(
            snapshot.last_backend_probe_at.as_deref(),
            Some("2026-04-13T00:00:00.000Z")
        );
        assert_eq!(snapshot.secure_store.provider, "os-keyring");
        assert_eq!(snapshot.secure_store.status, SecureStoreStatus::Reserved);
        assert!(!snapshot.secure_store.writes_enabled);
    }
}
