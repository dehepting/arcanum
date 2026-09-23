use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Event {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub location: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEventInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub location: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEventInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub event_date: Option<String>,
    pub location: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_event(
    input: CreateEventInput,
    state: State<AppState>,
) -> CommandResult<Event> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO events (
            id, project_id, name, description, event_date, location,
            metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        [
            &id,
            &input.project_id,
            &input.name,
            &input.description.clone().unwrap_or_default(),
            &input.event_date.clone().unwrap_or_default(),
            &input.location.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    Ok(Event {
        id,
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        event_date: input.event_date,
        location: input.location,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_event(
    event_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Event>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, event_date, location,
        metadata, created_at, updated_at
        FROM events WHERE id = ?1"
    )?;

    let result = stmt.query_row([&event_id], |row| {
        Ok(Event {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            event_date: row.get(4)?,
            location: row.get(5)?,
            metadata: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    });

    match result {
        Ok(event) => Ok(Some(event)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_events(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Event>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, event_date, location,
        metadata, created_at, updated_at
        FROM events
        WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let events = stmt
        .query_map([&project_id], |row| {
            Ok(Event {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                event_date: row.get(4)?,
                location: row.get(5)?,
                metadata: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(events)
}

#[tauri::command]
pub fn update_event(
    event_id: String,
    input: UpdateEventInput,
    state: State<AppState>,
) -> CommandResult<Event> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(name) = input.name {
        updates.push("name = ?");
        params.push(name);
    }
    if let Some(description) = input.description {
        updates.push("description = ?");
        params.push(description);
    }
    if let Some(event_date) = input.event_date {
        updates.push("event_date = ?");
        params.push(event_date);
    }
    if let Some(location) = input.location {
        updates.push("location = ?");
        params.push(location);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(event_id.clone());

    let query = format!(
        "UPDATE events SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_event(event_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Event not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_event(
    event_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM events WHERE id = ?1", [&event_id])?;
    Ok(())
}
