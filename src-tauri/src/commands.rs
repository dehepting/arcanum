use serde::Serialize;
use rusqlite::Connection;
use std::sync::Mutex;
use tokio::sync::broadcast;

// Re-export all command modules
pub mod artifacts;
pub mod people;
pub mod events;
pub mod theories;
pub mod places;
pub mod entity_pages;
pub mod sources;
pub mod projects;
pub mod files;
pub mod migration;
pub mod annotations;
pub mod overlays;
pub mod provenance;
pub mod canvases;
pub mod search;

// App state that holds the database connection and storage
pub struct AppState {
    pub db: Mutex<Connection>,
    pub storage: crate::storage::AppStorage,
    pub broadcast_tx: broadcast::Sender<String>,
}

// Common error type for commands
#[derive(Debug, Serialize)]
pub struct CommandError {
    pub message: String,
}

impl From<rusqlite::Error> for CommandError {
    fn from(err: rusqlite::Error) -> Self {
        CommandError {
            message: err.to_string(),
        }
    }
}

impl From<std::io::Error> for CommandError {
    fn from(err: std::io::Error) -> Self {
        CommandError {
            message: err.to_string(),
        }
    }
}

impl From<serde_json::Error> for CommandError {
    fn from(err: serde_json::Error) -> Self {
        CommandError {
            message: err.to_string(),
        }
    }
}

// Common response types
pub type CommandResult<T> = Result<T, CommandError>;
