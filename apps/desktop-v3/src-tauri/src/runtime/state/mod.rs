use std::sync::Arc;

use tokio::sync::RwLock;

#[derive(Debug, Clone, Default)]
pub struct SessionSnapshot {
    pub last_backend_probe_at: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub struct SessionState {
    inner: Arc<RwLock<SessionSnapshot>>,
}

impl SessionState {
    pub async fn record_backend_probe(&self, checked_at: String) {
        let mut snapshot = self.inner.write().await;
        snapshot.last_backend_probe_at = Some(checked_at);
    }

    pub async fn snapshot(&self) -> SessionSnapshot {
        self.inner.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::SessionState;

    #[test]
    fn records_last_backend_probe_timestamp() {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("build tokio runtime");

        runtime.block_on(async {
            let session_state = SessionState::default();

            session_state
                .record_backend_probe("2026-04-13T00:00:00.000Z".to_string())
                .await;

            let snapshot = session_state.snapshot().await;

            assert_eq!(
                snapshot.last_backend_probe_at.as_deref(),
                Some("2026-04-13T00:00:00.000Z")
            );
        });
    }
}
