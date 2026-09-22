use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct MapOverlay {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub storage_path: String,
    pub bounds: String,
    pub opacity: f64,
    pub visible: bool,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateOverlayInput {
    pub project_id: String,
    pub name: String,
    pub storage_path: String,
    pub bounds: String,
    pub opacity: Option<f64>,
    pub visible: Option<bool>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateOverlayInput {
    pub name: Option<String>,
    pub bounds: Option<String>,
    pub opacity: Option<f64>,
    pub visible: Option<bool>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_overlay(
    input: CreateOverlayInput,
    state: State<AppState>,
) -> CommandResult<MapOverlay> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let opacity = input.opacity.unwrap_or(0.7);
    let visible = input.visible.unwrap_or(true);
    let visible_int = if visible { 1 } else { 0 };

    db.execute(
        "INSERT INTO map_overlays (
            id, project_id, name, storage_path, bounds,
            opacity, visible, metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [
            &id,
            &input.project_id,
            &input.name,
            &input.storage_path,
            &input.bounds,
            &opacity.to_string(),
            &visible_int.to_string(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    Ok(MapOverlay {
        id,
        project_id: input.project_id,
        name: input.name,
        storage_path: input.storage_path,
        bounds: input.bounds,
        opacity,
        visible,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn load_overlays(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<MapOverlay>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, storage_path, bounds,
        opacity, visible, metadata, created_at, updated_at
        FROM map_overlays WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let rows = stmt.query_map([&project_id], |row| {
        let opacity_str: String = row.get(5)?;
        let opacity = opacity_str.parse::<f64>().unwrap_or(0.7);

        let visible_int: i32 = row.get(6)?;
        let visible = visible_int == 1;

        Ok(MapOverlay {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            storage_path: row.get(3)?,
            bounds: row.get(4)?,
            opacity,
            visible,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    let mut overlays = Vec::new();
    for row in rows {
        overlays.push(row?);
    }

    Ok(overlays)
}

#[tauri::command]
pub fn update_overlay(
    overlay_id: String,
    input: UpdateOverlayInput,
    state: State<AppState>,
) -> CommandResult<MapOverlay> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(name) = &input.name {
        updates.push("name = ?");
        params.push(name.clone());
    }
    if let Some(bounds) = &input.bounds {
        updates.push("bounds = ?");
        params.push(bounds.clone());
    }
    if let Some(opacity) = input.opacity {
        updates.push("opacity = ?");
        params.push(opacity.to_string());
    }
    if let Some(visible) = input.visible {
        updates.push("visible = ?");
        let visible_int = if visible { 1 } else { 0 };
        params.push(visible_int.to_string());
    }
    if let Some(metadata) = &input.metadata {
        updates.push("metadata = ?");
        params.push(metadata.clone());
    }

    updates.push("updated_at = ?");
    params.push(now.clone());
    params.push(overlay_id.clone());

    let query = format!(
        "UPDATE map_overlays SET {} WHERE id = ?",
        updates.join(", ")
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
    db.execute(&query, params_refs.as_slice())?;

    // Fetch and return updated overlay
    let mut stmt = db.prepare(
        "SELECT id, project_id, name, storage_path, bounds,
        opacity, visible, metadata, created_at, updated_at
        FROM map_overlays WHERE id = ?1"
    )?;

    let overlay = stmt.query_row([&overlay_id], |row| {
        let opacity_str: String = row.get(5)?;
        let opacity = opacity_str.parse::<f64>().unwrap_or(0.7);

        let visible_int: i32 = row.get(6)?;
        let visible = visible_int == 1;

        Ok(MapOverlay {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            storage_path: row.get(3)?,
            bounds: row.get(4)?,
            opacity,
            visible,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    Ok(overlay)
}

#[tauri::command]
pub fn delete_overlay(
    overlay_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM map_overlays WHERE id = ?1",
        [&overlay_id],
    )?;

    Ok(())
}
