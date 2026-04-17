use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

impl CommandError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
            request_id: None,
        }
    }
}

#[derive(Debug, Error)]
pub enum RuntimeError {
    #[error("invalid preference value: {0}")]
    InvalidPreferenceValue(String),
    #[error("database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("database migration error: {0}")]
    Migration(#[from] rusqlite_migration::Error),
    #[error("http client error: {0}")]
    Http(#[from] reqwest::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("backend error: {code}: {message}")]
    Backend {
        code: String,
        message: String,
        request_id: Option<String>,
    },
    #[error("invalid backend url: {0}")]
    InvalidBackendUrl(String),
    #[error("runtime not ready: {0}")]
    NotReady(String),
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<RuntimeError> for CommandError {
    fn from(value: RuntimeError) -> Self {
        match value {
            RuntimeError::InvalidPreferenceValue(message) => {
                CommandError::new("invalid_request", message)
            }
            RuntimeError::Database(error) => CommandError::new("internal_error", error.to_string()),
            RuntimeError::Migration(error) => {
                CommandError::new("internal_error", error.to_string())
            }
            RuntimeError::Http(error) => CommandError::new("internal_error", error.to_string()),
            RuntimeError::Io(error) => CommandError::new("internal_error", error.to_string()),
            RuntimeError::Backend {
                code,
                message,
                request_id,
            } => CommandError {
                code,
                message,
                request_id,
            },
            RuntimeError::InvalidBackendUrl(message) => {
                CommandError::new("invalid_request", message)
            }
            RuntimeError::NotReady(message) => CommandError::new("not_ready", message),
            RuntimeError::Internal(message) => CommandError::new("internal_error", message),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{CommandError, RuntimeError};

    #[test]
    fn maps_backend_errors_to_command_errors() {
        let command_error: CommandError = RuntimeError::Backend {
            code: "not_ready".to_string(),
            message: "backend not ready".to_string(),
            request_id: Some("req_1".to_string()),
        }
        .into();

        assert_eq!(command_error.code, "not_ready");
        assert_eq!(command_error.request_id.as_deref(), Some("req_1"));
    }
}
