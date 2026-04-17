use reqwest::Url;

use crate::error::RuntimeError;
use crate::runtime::client::probe_contract::{
    BackendEnvelope, BackendProbeData, parse_backend_probe_envelope,
};
use crate::runtime::models::{BackendProbe, utc_now};

#[derive(Debug, Clone)]
pub struct BackendClient {
    base_url: Url,
    client: reqwest::Client,
}

impl BackendClient {
    pub fn new(base_url: String) -> Result<Self, RuntimeError> {
        let parsed_url =
            Url::parse(&base_url).map_err(|_| RuntimeError::InvalidBackendUrl(base_url.clone()))?;

        Ok(Self {
            base_url: parsed_url,
            client: reqwest::Client::new(),
        })
    }

    pub fn base_url(&self) -> String {
        self.base_url.to_string()
    }

    pub async fn get_liveness(&self) -> Result<BackendProbe, RuntimeError> {
        self.get_probe("/api/v1/healthz").await
    }

    pub async fn get_readiness(&self) -> Result<BackendProbe, RuntimeError> {
        self.get_probe("/readyz").await
    }

    async fn get_probe(&self, path: &str) -> Result<BackendProbe, RuntimeError> {
        let url = self
            .base_url
            .join(path)
            .map_err(|_| RuntimeError::InvalidBackendUrl(self.base_url.to_string()))?;

        let response = self.client.get(url).send().await?;
        let status = response.status();
        let envelope = response.json::<BackendEnvelope<BackendProbeData>>().await?;

        parse_backend_probe_envelope(status, envelope, utc_now())
    }
}

#[cfg(test)]
mod tests {
    use std::io::{Read, Write};
    use std::net::TcpListener;
    use std::thread;

    use super::BackendClient;
    use crate::error::RuntimeError;

    fn build_json_response(status_line: &str, body: &str) -> String {
        format!(
            "{status_line}\r\ncontent-type: application/json\r\ncontent-length: {}\r\nconnection: close\r\n\r\n{body}",
            body.len()
        )
    }

    fn spawn_probe_server(response: String) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").expect("bind probe server");
        let address = listener.local_addr().expect("read local addr");

        thread::spawn(move || {
            let (mut stream, _) = listener.accept().expect("accept probe request");
            let mut buffer = [0_u8; 1024];
            let _ = stream.read(&mut buffer);
            stream
                .write_all(response.as_bytes())
                .expect("write probe response");
            stream.flush().expect("flush probe response");
        });

        format!("http://{}", address)
    }

    fn run_async_test<T>(future: impl std::future::Future<Output = T>) -> T {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("build tokio runtime")
            .block_on(future)
    }

    #[test]
    fn fetches_liveness_over_http_and_keeps_request_id() {
        let base_url = spawn_probe_server(build_json_response(
            "HTTP/1.1 200 OK",
            "{\"ok\":true,\"data\":{\"service\":\"control-plane-api\",\"status\":\"pass\"},\"meta\":{\"requestId\":\"req_http_ok\"}}",
        ));

        let probe = run_async_test(async {
            BackendClient::new(base_url)
                .expect("create backend client")
                .get_liveness()
                .await
                .expect("fetch liveness")
        });

        assert_eq!(probe.service, "control-plane-api");
        assert_eq!(probe.status, "pass");
        assert_eq!(probe.request_id.as_deref(), Some("req_http_ok"));
    }

    #[test]
    fn maps_backend_envelope_errors_from_http_responses() {
        let base_url = spawn_probe_server(build_json_response(
            "HTTP/1.1 503 Service Unavailable",
            "{\"ok\":false,\"error\":{\"code\":\"not_ready\",\"message\":\"backend warming up\",\"requestId\":\"req_http_err\"}}",
        ));

        let error = run_async_test(async {
            BackendClient::new(base_url)
                .expect("create backend client")
                .get_readiness()
                .await
                .expect_err("surface readiness error")
        });

        match error {
            RuntimeError::Backend {
                code,
                message,
                request_id,
            } => {
                assert_eq!(code, "not_ready");
                assert_eq!(message, "backend warming up");
                assert_eq!(request_id.as_deref(), Some("req_http_err"));
            }
            other => panic!("expected backend error, got {other:?}"),
        }
    }

    #[test]
    fn fails_closed_when_http_probe_has_no_error_payload() {
        let base_url = spawn_probe_server(build_json_response(
            "HTTP/1.1 503 Service Unavailable",
            "{\"ok\":false,\"data\":null,\"error\":null}",
        ));

        let error = run_async_test(async {
            BackendClient::new(base_url)
                .expect("create backend client")
                .get_readiness()
                .await
                .expect_err("surface fallback not ready error")
        });

        match error {
            RuntimeError::NotReady(message) => {
                assert_eq!(
                    message,
                    "backend probe failed with status 503 Service Unavailable"
                );
            }
            other => panic!("expected not ready error, got {other:?}"),
        }
    }
}
