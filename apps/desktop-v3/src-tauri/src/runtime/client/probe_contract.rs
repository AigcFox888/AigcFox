use reqwest::StatusCode;
use serde::Deserialize;

use crate::error::RuntimeError;
use crate::runtime::models::BackendProbe;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendEnvelope<T> {
    pub ok: bool,
    pub data: Option<T>,
    pub error: Option<BackendErrorPayload>,
    pub meta: Option<BackendMeta>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendMeta {
    pub request_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackendErrorPayload {
    pub code: String,
    pub message: String,
    pub request_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BackendProbeData {
    pub service: String,
    pub status: String,
}

pub fn parse_backend_probe_envelope(
    status: StatusCode,
    envelope: BackendEnvelope<BackendProbeData>,
    checked_at: String,
) -> Result<BackendProbe, RuntimeError> {
    if !status.is_success() || !envelope.ok {
        return Err(build_backend_error(status, envelope.error));
    }

    let data = envelope
        .data
        .ok_or_else(|| RuntimeError::Internal("backend envelope missing data".to_string()))?;

    Ok(BackendProbe {
        checked_at,
        request_id: envelope.meta.and_then(|meta| meta.request_id),
        service: data.service,
        status: data.status,
    })
}

fn build_backend_error(status: StatusCode, error: Option<BackendErrorPayload>) -> RuntimeError {
    match error {
        Some(error) => RuntimeError::Backend {
            code: error.code,
            message: error.message,
            request_id: error.request_id,
        },
        None => RuntimeError::NotReady(format!("backend probe failed with status {}", status)),
    }
}

#[cfg(test)]
mod tests {
    use reqwest::StatusCode;

    use super::{
        BackendEnvelope, BackendErrorPayload, BackendMeta, BackendProbeData,
        parse_backend_probe_envelope,
    };
    use crate::error::RuntimeError;

    #[test]
    fn parses_successful_probe_envelopes() {
        let probe = parse_backend_probe_envelope(
            StatusCode::OK,
            BackendEnvelope {
                ok: true,
                data: Some(BackendProbeData {
                    service: "control-plane-api".to_string(),
                    status: "pass".to_string(),
                }),
                error: None,
                meta: Some(BackendMeta {
                    request_id: Some("req_1".to_string()),
                }),
            },
            "2026-04-13T01:20:00.000Z".to_string(),
        )
        .expect("parse successful envelope");

        assert_eq!(probe.service, "control-plane-api");
        assert_eq!(probe.status, "pass");
        assert_eq!(probe.request_id.as_deref(), Some("req_1"));
        assert_eq!(probe.checked_at, "2026-04-13T01:20:00.000Z");
    }

    #[test]
    fn surfaces_backend_error_payloads() {
        let error = parse_backend_probe_envelope(
            StatusCode::SERVICE_UNAVAILABLE,
            BackendEnvelope::<BackendProbeData> {
                ok: false,
                data: None,
                error: Some(BackendErrorPayload {
                    code: "not_ready".to_string(),
                    message: "backend warming up".to_string(),
                    request_id: Some("req_2".to_string()),
                }),
                meta: None,
            },
            "2026-04-13T01:20:00.000Z".to_string(),
        )
        .expect_err("surface backend error");

        match error {
            RuntimeError::Backend {
                code,
                message,
                request_id,
            } => {
                assert_eq!(code, "not_ready");
                assert_eq!(message, "backend warming up");
                assert_eq!(request_id.as_deref(), Some("req_2"));
            }
            other => panic!("expected backend error, got {other:?}"),
        }
    }

    #[test]
    fn fails_closed_when_success_envelope_has_no_data() {
        let error = parse_backend_probe_envelope(
            StatusCode::OK,
            BackendEnvelope::<BackendProbeData> {
                ok: true,
                data: None,
                error: None,
                meta: None,
            },
            "2026-04-13T01:20:00.000Z".to_string(),
        )
        .expect_err("fail closed on missing data");

        match error {
            RuntimeError::Internal(message) => {
                assert_eq!(message, "backend envelope missing data");
            }
            other => panic!("expected internal error, got {other:?}"),
        }
    }
}
