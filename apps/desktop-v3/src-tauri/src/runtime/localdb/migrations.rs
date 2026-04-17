use rusqlite_migration::{M, Migrations};

pub fn desktop_v3_migrations() -> Migrations<'static> {
    Migrations::new(vec![M::up(
        "
        CREATE TABLE IF NOT EXISTS user_preferences (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sync_cache (
            id          TEXT PRIMARY KEY,
            remote_id   TEXT NOT NULL,
            data        TEXT NOT NULL,
            synced_at   TEXT,
            created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
            is_dirty    INTEGER NOT NULL DEFAULT 1
        );
        ",
    )])
}
