mod migrations;

use std::fs;
use std::path::PathBuf;

use rusqlite::{Connection, OptionalExtension, params};

use crate::error::RuntimeError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SyncCacheStats {
    pub dirty_entries: u32,
    pub total_entries: u32,
}

#[derive(Debug, Clone)]
pub struct LocalDatabase {
    path: PathBuf,
}

impl LocalDatabase {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn initialize(&self) -> Result<(), RuntimeError> {
        let mut connection = self.open_connection()?;
        migrations::desktop_v3_migrations().to_latest(&mut connection)?;
        Ok(())
    }

    pub fn get_preference(&self, key: &str) -> Result<Option<String>, RuntimeError> {
        let connection = self.open_connection()?;

        let value = connection
            .query_row(
                "SELECT value FROM user_preferences WHERE key = ?1",
                params![key],
                |row| row.get::<_, String>(0),
            )
            .optional()?;

        Ok(value)
    }

    pub fn set_preference(&self, key: &str, value: &str) -> Result<(), RuntimeError> {
        let connection = self.open_connection()?;

        connection.execute(
            "
            INSERT INTO user_preferences (key, value)
            VALUES (?1, ?2)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            ",
            params![key, value],
        )?;

        Ok(())
    }

    pub fn probe(&self) -> Result<(), RuntimeError> {
        let connection = self.open_connection()?;
        let _ = connection.query_row("SELECT 1", [], |row| row.get::<_, i64>(0))?;
        Ok(())
    }

    pub fn get_sync_cache_stats(&self) -> Result<SyncCacheStats, RuntimeError> {
        let connection = self.open_connection()?;
        let (total_entries, dirty_entries) = connection.query_row(
            "
            SELECT
                COUNT(*) AS total_entries,
                SUM(CASE WHEN is_dirty = 1 THEN 1 ELSE 0 END) AS dirty_entries
            FROM sync_cache
            ",
            [],
            |row| {
                let total_entries = row.get::<_, u32>(0)?;
                let dirty_entries = row.get::<_, Option<u32>>(1)?.unwrap_or(0);
                Ok((total_entries, dirty_entries))
            },
        )?;

        Ok(SyncCacheStats {
            dirty_entries,
            total_entries,
        })
    }

    fn open_connection(&self) -> Result<Connection, RuntimeError> {
        if let Some(parent) = self.path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut connection = Connection::open(&self.path)?;
        migrations::desktop_v3_migrations().to_latest(&mut connection)?;
        Ok(connection)
    }
}

#[cfg(test)]
mod tests {
    use rusqlite::{Connection, params};
    use tempfile::tempdir;

    use super::LocalDatabase;

    #[test]
    fn initializes_baseline_schema_from_empty_database() {
        let tempdir = tempdir().expect("tempdir");
        let database_path = tempdir.path().join("desktop-v3.sqlite3");
        let database = LocalDatabase::new(database_path.clone());

        database.initialize().expect("initialize sqlite baseline");

        let connection = Connection::open(database_path).expect("open initialized database");
        let tables: Vec<String> = connection
            .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
            .expect("prepare table list query")
            .query_map([], |row| row.get::<_, String>(0))
            .expect("query table list")
            .collect::<Result<Vec<_>, _>>()
            .expect("collect table list");

        assert!(tables.contains(&"sync_cache".to_string()));
        assert!(tables.contains(&"user_preferences".to_string()));
    }

    #[test]
    fn persists_user_preferences() {
        let tempdir = tempdir().expect("tempdir");
        let database_path = tempdir.path().join("desktop-v3.sqlite3");
        let database = LocalDatabase::new(database_path);

        database.initialize().expect("initialize sqlite baseline");
        database
            .set_preference("ui.theme_mode", "dark")
            .expect("write theme preference");

        let value = database
            .get_preference("ui.theme_mode")
            .expect("read theme preference");

        assert_eq!(value.as_deref(), Some("dark"));
    }

    #[test]
    fn reports_sync_cache_counts() {
        let tempdir = tempdir().expect("tempdir");
        let database_path = tempdir.path().join("desktop-v3.sqlite3");
        let database = LocalDatabase::new(database_path.clone());

        database.initialize().expect("initialize sqlite baseline");

        let connection = Connection::open(database_path).expect("open initialized database");
        connection
            .execute(
                "
                INSERT INTO sync_cache (id, remote_id, data, is_dirty)
                VALUES (?1, ?2, ?3, ?4)
                ",
                params!["cache_1", "remote_1", "{\"name\":\"first\"}", 1],
            )
            .expect("insert dirty cache row");
        connection
            .execute(
                "
                INSERT INTO sync_cache (id, remote_id, data, is_dirty, synced_at)
                VALUES (?1, ?2, ?3, ?4, ?5)
                ",
                params![
                    "cache_2",
                    "remote_2",
                    "{\"name\":\"second\"}",
                    0,
                    "2026-04-12T00:00:00.000Z"
                ],
            )
            .expect("insert synced cache row");

        let stats = database
            .get_sync_cache_stats()
            .expect("read sync cache stats");

        assert_eq!(stats.total_entries, 2);
        assert_eq!(stats.dirty_entries, 1);
    }
}
