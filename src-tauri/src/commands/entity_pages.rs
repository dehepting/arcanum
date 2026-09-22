use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct EntityPage {
    pub id: String,
    pub project_id: String,
    pub entity_id: String,
    pub entity_type: String,
    pub title: String,
    pub storage_path: String,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateEntityPageInput {
    pub project_id: String,
    pub entity_id: String,
    pub entity_type: String,
    pub title: String,
    pub storage_path: String,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateEntityPageInput {
    pub title: Option<String>,
    pub storage_path: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_entity_page(
    input: CreateEntityPageInput,
    state: State<AppState>,
) -> CommandResult<EntityPage> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO entity_pages (
            id, project_id, entity_id, entity_type, title, storage_path,
            metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        [
            &id,
            &input.project_id,
            &input.entity_id,
            &input.entity_type,
            &input.title,
            &input.storage_path,
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    Ok(EntityPage {
        id,
        project_id: input.project_id,
        entity_id: input.entity_id,
        entity_type: input.entity_type,
        title: input.title,
        storage_path: input.storage_path,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn get_entity_page(
    entity_id: String,
    state: State<AppState>,
) -> CommandResult<Option<EntityPage>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, entity_id, entity_type, title, storage_path,
        metadata, created_at, updated_at
        FROM entity_pages WHERE entity_id = ?1"
    )?;

    let result = stmt.query_row([&entity_id], |row| {
        Ok(EntityPage {
            id: row.get(0)?,
            project_id: row.get(1)?,
            entity_id: row.get(2)?,
            entity_type: row.get(3)?,
            title: row.get(4)?,
            storage_path: row.get(5)?,
            metadata: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    });

    match result {
        Ok(page) => Ok(Some(page)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_entity_pages(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<EntityPage>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, entity_id, entity_type, title, storage_path,
        metadata, created_at, updated_at
        FROM entity_pages
        WHERE project_id = ?1
        ORDER BY updated_at DESC"
    )?;

    let pages = stmt
        .query_map([&project_id], |row| {
            Ok(EntityPage {
                id: row.get(0)?,
                project_id: row.get(1)?,
                entity_id: row.get(2)?,
                entity_type: row.get(3)?,
                title: row.get(4)?,
                storage_path: row.get(5)?,
                metadata: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(pages)
}

#[tauri::command]
pub fn update_entity_page(
    entity_id: String,
    input: UpdateEntityPageInput,
    state: State<AppState>,
) -> CommandResult<EntityPage> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(title) = input.title {
        updates.push("title = ?");
        params.push(title);
    }
    if let Some(storage_path) = input.storage_path {
        updates.push("storage_path = ?");
        params.push(storage_path);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(entity_id.clone());

    let query = format!(
        "UPDATE entity_pages SET {} WHERE entity_id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_entity_page(entity_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Entity page not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_entity_page(
    entity_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM entity_pages WHERE entity_id = ?1", [&entity_id])?;
    Ok(())
}
