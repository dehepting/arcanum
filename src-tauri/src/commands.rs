use serde::Serialize;
use rusqlite::Connection;
use std::sync::Mutex;

// Re-export all command modules
pub mod artifacts;
pub mod people;
pub mod events;
pub mod theories;
pub mod places;
pub mod entity_pages;
pub mod sources;
pub mod projects;

// App state that holds the database connection
pub struct AppState {
    pub db: Mutex<Connection>,
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

// Common response types
pub type CommandResult<T> = Result<T, CommandError>;
