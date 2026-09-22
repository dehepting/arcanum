use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Place {
    pub id: String,
    pub name: String,
    pub lng: f64,
    pub lat: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Artifact {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub date_range: Option<String>,
    pub owner_type: Option<String>,
    pub owner_name: Option<String>,
    pub findspot_place_id: Option<String>,
    pub images: Option<String>, // JSON array of image paths
    pub metadata: Option<String>, // JSON object
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub findspot: Option<Place>,
}

#[derive(Debug, Deserialize)]
pub struct CreateArtifactInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub date_range: Option<String>,
    pub owner_type: Option<String>,
    pub owner_name: Option<String>,
    pub findspot_place_id: Option<String>,
    pub images: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateArtifactInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub date_range: Option<String>,
    pub owner_type: Option<String>,
    pub owner_name: Option<String>,
    pub findspot_place_id: Option<String>,
    pub images: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SearchArtifactsInput {
    pub project_id: String,
    pub query: Option<String>,
    pub category: Option<String>,
    pub owner_type: Option<String>,
}

#[tauri::command]
pub fn create_artifact(
    input: CreateArtifactInput,
    state: State<AppState>,
) -> CommandResult<Artifact> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let description = input.description.clone().unwrap_or_default();
    let category = input.category.clone().unwrap_or_default();
    let date_range = input.date_range.clone().unwrap_or_default();
    let owner_type = input.owner_type.clone().unwrap_or_default();
    let owner_name = input.owner_name.clone().unwrap_or_default();
    let findspot_place_id_str = input.findspot_place_id.clone().unwrap_or_default();
    let images_str = input.images.clone().unwrap_or_default();
    let metadata_str = input.metadata.clone().unwrap_or_default();

    db.execute(
        "INSERT INTO artifacts (
            id, project_id, name, description, category, date_range,
            owner_type, owner_name, findspot_place_id, images, metadata,
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        [
            &id,
            &input.project_id,
            &input.name,
            &description,
            &category,
            &date_range,
            &owner_type,
            &owner_name,
            &findspot_place_id_str,
            &images_str,
            &metadata_str,
            &now,
            &now,
        ],
    )?;

    Ok(Artifact {
        id,
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        category: input.category,
        date_range: input.date_range,
        owner_type: input.owner_type,
        owner_name: input.owner_name,
        findspot_place_id: input.findspot_place_id,
        images: input.images,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
        findspot: None,
    })
}

#[tauri::command]
pub fn get_artifact(
    artifact_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Artifact>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT
            a.id, a.project_id, a.name, a.description, a.category, a.date_range,
            a.owner_type, a.owner_name, a.findspot_place_id, a.images, a.metadata,
            a.created_at, a.updated_at,
            p.id as place_id, p.name as place_name, p.lng, p.lat
        FROM artifacts a
        LEFT JOIN places p ON a.findspot_place_id = p.id
        WHERE a.id = ?1",
    )?;

    let result = stmt.query_row([&artifact_id], |row| {
        let findspot = if row.get::<_, Option<String>>(13)?.is_some() {
            Some(Place {
                id: row.get(13)?,
                name: row.get(14)?,
                lng: row.get(15)?,
                lat: row.get(16)?,
            })
        } else {
            None
        };

        Ok(Artifact {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            category: row.get(4)?,
            date_range: row.get(5)?,
            owner_type: row.get(6)?,
            owner_name: row.get(7)?,
            findspot_place_id: row.get(8)?,
            images: row.get(9)?,
            metadata: row.get(10)?,
            created_at: row.get(11)?,
            updated_at: row.get(12)?,
            findspot,
        })
    });

    match result {
        Ok(artifact) => Ok(Some(artifact)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_artifacts(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Artifact>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT
            a.id, a.project_id, a.name, a.description, a.category, a.date_range,
            a.owner_type, a.owner_name, a.findspot_place_id, a.images, a.metadata,
            a.created_at, a.updated_at,
            p.id as place_id, p.name as place_name, p.lng, p.lat
        FROM artifacts a
        LEFT JOIN places p ON a.findspot_place_id = p.id
        WHERE a.project_id = ?1
        ORDER BY a.created_at DESC",
    )?;

    let artifacts = stmt
        .query_map([&project_id], |row| {
            let findspot = if row.get::<_, Option<String>>(13)?.is_some() {
                Some(Place {
                    id: row.get(13)?,
                    name: row.get(14)?,
                    lng: row.get(15)?,
                    lat: row.get(16)?,
                })
            } else {
                None
            };

            Ok(Artifact {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
                date_range: row.get(5)?,
                owner_type: row.get(6)?,
                owner_name: row.get(7)?,
                findspot_place_id: row.get(8)?,
                images: row.get(9)?,
                metadata: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                findspot,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(artifacts)
}

#[tauri::command]
pub fn update_artifact(
    artifact_id: String,
    input: UpdateArtifactInput,
    state: State<AppState>,
) -> CommandResult<Artifact> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    // Build UPDATE query dynamically
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
    if let Some(category) = input.category {
        updates.push("category = ?");
        params.push(category);
    }
    if let Some(date_range) = input.date_range {
        updates.push("date_range = ?");
        params.push(date_range);
    }
    if let Some(owner_type) = input.owner_type {
        updates.push("owner_type = ?");
        params.push(owner_type);
    }
    if let Some(owner_name) = input.owner_name {
        updates.push("owner_name = ?");
        params.push(owner_name);
    }
    if let Some(findspot_place_id) = input.findspot_place_id {
        updates.push("findspot_place_id = ?");
        params.push(findspot_place_id);
    }
    if let Some(images) = input.images {
        updates.push("images = ?");
        params.push(images);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(artifact_id.clone());

    let query = format!(
        "UPDATE artifacts SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_artifact(artifact_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Artifact not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_artifact(
    artifact_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM artifacts WHERE id = ?1", [&artifact_id])?;
    Ok(())
}

#[tauri::command]
pub fn get_artifacts_by_findspot(
    place_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Artifact>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT
            id, project_id, name, description, category, date_range,
            owner_type, owner_name, findspot_place_id, images, metadata,
            created_at, updated_at
        FROM artifacts
        WHERE findspot_place_id = ?1
        ORDER BY created_at DESC",
    )?;

    let artifacts = stmt
        .query_map([&place_id], |row| {
            Ok(Artifact {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
                date_range: row.get(5)?,
                owner_type: row.get(6)?,
                owner_name: row.get(7)?,
                findspot_place_id: row.get(8)?,
                images: row.get(9)?,
                metadata: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                findspot: None,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(artifacts)
}

#[tauri::command]
pub fn search_artifacts(
    input: SearchArtifactsInput,
    state: State<AppState>,
) -> CommandResult<Vec<Artifact>> {
    let db = state.db.lock().unwrap();

    // Build search query
    let mut conditions = vec!["project_id = ?1"];
    let mut params: Vec<String> = vec![input.project_id];

    if input.category.is_some() {
        conditions.push("category = ?");
        params.push(input.category.unwrap());
    }

    if input.owner_type.is_some() {
        conditions.push("owner_type = ?");
        params.push(input.owner_type.unwrap());
    }

    if let Some(query) = input.query {
        conditions.push("(name LIKE ? OR description LIKE ?)");
        let search_pattern = format!("%{}%", query);
        params.push(search_pattern.clone());
        params.push(search_pattern);
    }

    let sql = format!(
        "SELECT
            id, project_id, name, description, category, date_range,
            owner_type, owner_name, findspot_place_id, images, metadata,
            created_at, updated_at
        FROM artifacts
        WHERE {}
        ORDER BY created_at DESC",
        conditions.join(" AND ")
    );

    let mut stmt = db.prepare(&sql)?;

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    let artifacts = stmt
        .query_map(rusqlite::params_from_iter(param_refs), |row| {
            Ok(Artifact {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                category: row.get(4)?,
                date_range: row.get(5)?,
                owner_type: row.get(6)?,
                owner_name: row.get(7)?,
                findspot_place_id: row.get(8)?,
                images: row.get(9)?,
                metadata: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
                findspot: None,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(artifacts)
}
