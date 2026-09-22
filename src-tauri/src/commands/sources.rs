use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Source {
    pub id: String,
    pub project_id: String,
    pub title: String,
    pub file_name: String,
    pub storage_path: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSourceInput {
    pub project_id: String,
    pub title: String,
    pub file_name: String,
    pub storage_path: String,
    pub file_size: Option<i64>,
    pub mime_type: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSourceInput {
    pub title: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_source(
    input: CreateSourceInput,
    state: State<AppState>,
) -> CommandResult<Source> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let file_size_str = input.file_size.map(|s| s.to_string()).unwrap_or_default();

    db.execute(
        "INSERT INTO sources (
            id, project_id, title, file_name, storage_path,
            file_size, mime_type, metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [
            &id,
            &input.project_id,
            &input.title,
            &input.file_name,
            &input.storage_path,
            &file_size_str,
            &input.mime_type.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    Ok(Source {
        id,
        project_id: input.project_id,
        title: input.title,
        file_name: input.file_name,
        storage_path: input.storage_path,
        file_size: input.file_size,
        mime_type: input.mime_type,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn get_source(
    source_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Source>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, title, file_name, storage_path,
        file_size, mime_type, metadata, created_at, updated_at
        FROM sources WHERE id = ?1"
    )?;

    let result = stmt.query_row([&source_id], |row| {
        let file_size_str: Option<String> = row.get(5)?;
        let file_size = file_size_str.and_then(|s| s.parse::<i64>().ok());

        Ok(Source {
            id: row.get(0)?,
            project_id: row.get(1)?,
            title: row.get(2)?,
            file_name: row.get(3)?,
            storage_path: row.get(4)?,
            file_size,
            mime_type: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    });

    match result {
        Ok(source) => Ok(Some(source)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_sources(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Source>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, title, file_name, storage_path,
        file_size, mime_type, metadata, created_at, updated_at
        FROM sources
        WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let sources = stmt
        .query_map([&project_id], |row| {
            let file_size_str: Option<String> = row.get(5)?;
            let file_size = file_size_str.and_then(|s| s.parse::<i64>().ok());

            Ok(Source {
                id: row.get(0)?,
                project_id: row.get(1)?,
                title: row.get(2)?,
                file_name: row.get(3)?,
                storage_path: row.get(4)?,
                file_size,
                mime_type: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(sources)
}

#[tauri::command]
pub fn update_source(
    source_id: String,
    input: UpdateSourceInput,
    state: State<AppState>,
) -> CommandResult<Source> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(title) = input.title {
        updates.push("title = ?");
        params.push(title);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(source_id.clone());

    let query = format!(
        "UPDATE sources SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_source(source_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Source not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_source(
    source_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM sources WHERE id = ?1", [&source_id])?;
    Ok(())
}
