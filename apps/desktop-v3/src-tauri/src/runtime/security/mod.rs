use serde::Serialize;

// Wave 1 先只产出 reserved 快照，其他状态保留给后续真实 secure store 实现。
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SecureStoreStatus {
    Reserved,
    Ready,
    Unavailable,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SecureStoreSnapshot {
    pub provider: String,
    pub status: SecureStoreStatus,
    pub writes_enabled: bool,
}

#[derive(Debug, Clone, Default)]
pub struct SecureStore;

impl SecureStore {
    pub fn snapshot(&self) -> SecureStoreSnapshot {
        SecureStoreSnapshot {
            provider: "os-keyring".to_string(),
            status: SecureStoreStatus::Reserved,
            writes_enabled: false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{SecureStore, SecureStoreStatus};

    #[test]
    fn returns_reserved_snapshot_for_wave1_skeleton() {
        let secure_store = SecureStore;

        let snapshot = secure_store.snapshot();

        assert_eq!(snapshot.provider, "os-keyring");
        assert_eq!(snapshot.status, SecureStoreStatus::Reserved);
        assert!(!snapshot.writes_enabled);
    }
}
