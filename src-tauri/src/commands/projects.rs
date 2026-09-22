use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProjectInput {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[tauri::command]
pub fn create_project(
    input: CreateProjectInput,
    state: State<AppState>,
) -> CommandResult<Project> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let description = input.description.clone().unwrap_or_default();

    db.execute(
        "INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [&id, &input.name, &description, &now, &now],
    )?;

    Ok(Project {
        id,
        name: input.name,
        description: input.description,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn get_project(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Project>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare("SELECT id, name, description, created_at, updated_at FROM projects WHERE id = ?1")?;

    let result = stmt.query_row([&project_id], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    });

    match result {
        Ok(project) => Ok(Some(project)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> CommandResult<Vec<Project>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare("SELECT id, name, description, created_at, updated_at FROM projects ORDER BY updated_at DESC")?;

    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?
    .collect::<Result<Vec<_>, _>>()?;

    Ok(projects)
}

#[tauri::command]
pub fn update_project(
    project_id: String,
    input: UpdateProjectInput,
    state: State<AppState>,
) -> CommandResult<Project> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    // Build dynamic UPDATE query based on provided fields
    let mut updates = Vec::new();
    let mut idx = 1;

    if input.name.is_some() {
        updates.push(format!("name = ?{}", idx));
        idx += 1;
    }
    if input.description.is_some() {
        updates.push(format!("description = ?{}", idx));
        idx += 1;
    }

    updates.push(format!("updated_at = ?{}", idx));
    idx += 1;

    let query = format!(
        "UPDATE projects SET {} WHERE id = ?{}",
        updates.join(", "),
        idx
    );

    // Execute with proper parameter binding
    match (input.name, input.description) {
        (Some(name), Some(desc)) => {
            db.execute(&query, [&name, &desc, &now, &project_id])?;
        }
        (Some(name), None) => {
            db.execute(&query, [&name, &now, &project_id])?;
        }
        (None, Some(desc)) => {
            db.execute(&query, [&desc, &now, &project_id])?;
        }
        (None, None) => {
            db.execute(&query, [&now, &project_id])?;
        }
    }

    // Drop the lock before calling get_project
    drop(db);

    // Fetch and return updated project
    get_project(project_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Project not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_project(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM projects WHERE id = ?1", [&project_id])?;
    Ok(())
}
