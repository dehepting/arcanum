use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProvenanceRecord {
    pub id: String,
    pub project_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub event_type: String,
    pub event_data: Option<String>,
    pub user_id: Option<String>,
    pub timestamp: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProvenanceInput {
    pub project_id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub event_type: String,
    pub event_data: Option<String>,
    pub user_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProvenanceInput {
    pub event_type: Option<String>,
    pub event_data: Option<String>,
    pub user_id: Option<String>,
}

#[tauri::command]
pub fn create_provenance_record(
    input: CreateProvenanceInput,
    state: State<AppState>,
) -> CommandResult<ProvenanceRecord> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let timestamp = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO provenance_records (
            id, project_id, entity_type, entity_id, event_type,
            event_data, user_id, timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        [
            &id,
            &input.project_id,
            &input.entity_type,
            &input.entity_id,
            &input.event_type,
            &input.event_data.clone().unwrap_or_default(),
            &input.user_id.clone().unwrap_or_default(),
            &timestamp,
        ],
    )?;

    Ok(ProvenanceRecord {
        id,
        project_id: input.project_id,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        event_type: input.event_type,
        event_data: input.event_data,
        user_id: input.user_id,
        timestamp,
    })
}

#[tauri::command]
pub fn get_provenance(
    entity_id: String,
    entity_type: String,
    state: State<AppState>,
) -> CommandResult<Vec<ProvenanceRecord>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, entity_type, entity_id, event_type,
        event_data, user_id, timestamp
        FROM provenance_records
        WHERE entity_id = ?1 AND entity_type = ?2
        ORDER BY timestamp DESC"
    )?;

    let rows = stmt.query_map([&entity_id, &entity_type], |row| {
        Ok(ProvenanceRecord {
            id: row.get(0)?,
            project_id: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            event_type: row.get(4)?,
            event_data: row.get(5)?,
            user_id: row.get(6)?,
            timestamp: row.get(7)?,
        })
    })?;

    let mut records = Vec::new();
    for row in rows {
        records.push(row?);
    }

    Ok(records)
}

#[tauri::command]
pub fn update_provenance_record(
    record_id: String,
    input: UpdateProvenanceInput,
    state: State<AppState>,
) -> CommandResult<ProvenanceRecord> {
    let db = state.db.lock().unwrap();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(event_type) = &input.event_type {
        updates.push("event_type = ?");
        params.push(event_type.clone());
    }
    if let Some(event_data) = &input.event_data {
        updates.push("event_data = ?");
        params.push(event_data.clone());
    }
    if let Some(user_id) = &input.user_id {
        updates.push("user_id = ?");
        params.push(user_id.clone());
    }

    params.push(record_id.clone());

    let query = format!(
        "UPDATE provenance_records SET {} WHERE id = ?",
        updates.join(", ")
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
    db.execute(&query, params_refs.as_slice())?;

    // Fetch and return updated record
    let mut stmt = db.prepare(
        "SELECT id, project_id, entity_type, entity_id, event_type,
        event_data, user_id, timestamp
        FROM provenance_records WHERE id = ?1"
    )?;

    let record = stmt.query_row([&record_id], |row| {
        Ok(ProvenanceRecord {
            id: row.get(0)?,
            project_id: row.get(1)?,
            entity_type: row.get(2)?,
            entity_id: row.get(3)?,
            event_type: row.get(4)?,
            event_data: row.get(5)?,
            user_id: row.get(6)?,
            timestamp: row.get(7)?,
        })
    })?;

    Ok(record)
}

#[tauri::command]
pub fn delete_provenance_record(
    record_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM provenance_records WHERE id = ?1",
        [&record_id],
    )?;

    Ok(())
}
