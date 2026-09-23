use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Theory {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTheoryInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub metadata: Option<String>,
    pub annotation_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateTheoryInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_theory(
    input: CreateTheoryInput,
    state: State<AppState>,
) -> CommandResult<Theory> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO theories (
            id, project_id, name, description, metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        [
            &id,
            &input.project_id,
            &input.name,
            &input.description.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    // Link to annotation if provided
    if let Some(annotation_id) = &input.annotation_id {
        let link_id = Uuid::new_v4().to_string();

        db.execute(
            "INSERT INTO annotation_theories_links (id, annotation_id, theory_id, created_at)
            VALUES (?1, ?2, ?3, ?4)",
            [&link_id, annotation_id, &id, &now],
        )?;
    }

    Ok(Theory {
        id,
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_theory(
    theory_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Theory>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, metadata, created_at, updated_at
        FROM theories WHERE id = ?1"
    )?;

    let result = stmt.query_row([&theory_id], |row| {
        Ok(Theory {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            metadata: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    });

    match result {
        Ok(theory) => Ok(Some(theory)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_theories(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Theory>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, metadata, created_at, updated_at
        FROM theories
        WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let theories = stmt
        .query_map([&project_id], |row| {
            Ok(Theory {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                metadata: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(theories)
}

#[tauri::command]
pub fn update_theory(
    theory_id: String,
    input: UpdateTheoryInput,
    state: State<AppState>,
) -> CommandResult<Theory> {
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
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(theory_id.clone());

    let query = format!(
        "UPDATE theories SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_theory(theory_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Theory not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_theory(
    theory_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM theories WHERE id = ?1", [&theory_id])?;
    Ok(())
}

#[tauri::command]
pub fn link_annotation_to_theory(
    annotation_id: String,
    theory_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO annotation_theories_links (id, annotation_id, theory_id, created_at)
        VALUES (?1, ?2, ?3, ?4)",
        [&id, &annotation_id, &theory_id, &now],
    )?;

    Ok(())
}

#[tauri::command]
pub fn unlink_annotation_from_theory(
    annotation_id: String,
    theory_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM annotation_theories_links WHERE annotation_id = ?1 AND theory_id = ?2",
        [&annotation_id, &theory_id],
    )?;

    Ok(())
}
