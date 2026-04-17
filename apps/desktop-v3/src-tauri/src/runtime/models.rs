use chrono::{SecondsFormat, Utc};
use serde::{Deserialize, Serialize};

use crate::error::RuntimeError;
use crate::runtime::security::SecureStoreSnapshot;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

impl Default for ThemeMode {
    fn default() -> Self {
        Self::System
    }
}

impl ThemeMode {
    pub fn as_storage_value(&self) -> &'static str {
        match self {
            ThemeMode::Light => "light",
            ThemeMode::Dark => "dark",
            ThemeMode::System => "system",
        }
    }

    pub fn from_storage_value(value: &str) -> Result<Self, RuntimeError> {
        match value {
            "light" => Ok(Self::Light),
            "dark" => Ok(Self::Dark),
            "system" => Ok(Self::System),
            other => Err(RuntimeError::InvalidPreferenceValue(other.to_string())),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemePreference {
    pub mode: ThemeMode,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsSnapshot {
    pub app_version: String,
    pub backend_base_url: String,
    pub checked_at: String,
    pub database_path: String,
    pub database_status: String,
    pub dirty_sync_cache_entry_count: u32,
    pub last_backend_probe_at: Option<String>,
    pub platform: String,
    pub secure_store: SecureStoreSnapshot,
    pub sync_cache_entry_count: u32,
    pub theme_mode: ThemeMode,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendProbe {
    pub checked_at: String,
    pub request_id: Option<String>,
    pub service: String,
    pub status: String,
}

pub fn utc_now() -> String {
    Utc::now().to_rfc3339_opts(SecondsFormat::Millis, true)
}
