use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Canvas {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub is_dashboard: bool,
    pub canvas_data: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCanvasInput {
    pub project_id: String,
    pub name: String,
    pub is_dashboard: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCanvasInput {
    pub name: Option<String>,
    pub canvas_data: Option<String>,
}

#[tauri::command]
pub fn create_canvas(
    input: CreateCanvasInput,
    state: State<AppState>,
) -> CommandResult<Canvas> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO canvases (id, project_id, name, is_dashboard, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [
            &id,
            &input.project_id,
            &input.name,
            &(input.is_dashboard.unwrap_or(false) as i32).to_string(),
            &now,
            &now,
        ],
    )?;

    drop(db);

    get_canvas(id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Canvas not found after creation".to_string(),
        })
}

#[tauri::command]
pub fn get_canvas(
    canvas_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Canvas>> {
    let db = state.db.lock().unwrap();

    let canvas = db.query_row(
        "SELECT id, project_id, name, is_dashboard, canvas_data, created_at, updated_at
         FROM canvases WHERE id = ?",
        [&canvas_id],
        |row| {
            Ok(Canvas {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                is_dashboard: row.get::<_, i32>(3)? != 0,
                canvas_data: row.get(4).ok(),
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    );

    match canvas {
        Ok(c) => Ok(Some(c)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_canvases(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Canvas>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, is_dashboard, canvas_data, created_at, updated_at
         FROM canvases
         WHERE project_id = ?
         ORDER BY is_dashboard DESC, created_at ASC",
    )?;

    let canvases = stmt
        .query_map([&project_id], |row| {
            Ok(Canvas {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                is_dashboard: row.get::<_, i32>(3)? != 0,
                canvas_data: row.get(4).ok(),
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(canvases)
}

#[tauri::command]
pub fn update_canvas(
    canvas_id: String,
    input: UpdateCanvasInput,
    state: State<AppState>,
) -> CommandResult<Canvas> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(name) = input.name {
        updates.push("name = ?");
        params.push(name);
    }
    if let Some(canvas_data) = input.canvas_data {
        updates.push("canvas_data = ?");
        params.push(canvas_data);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(canvas_id.clone());

    let query = format!(
        "UPDATE canvases SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_canvas(canvas_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Canvas not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_canvas(
    canvas_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute("DELETE FROM canvases WHERE id = ?", [&canvas_id])?;

    Ok(())
}
