use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Place {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub lng: f64,
    pub lat: f64,
    pub description: Option<String>,
    pub place_type: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePlaceInput {
    pub project_id: String,
    pub name: String,
    pub lng: f64,
    pub lat: f64,
    pub description: Option<String>,
    pub place_type: Option<String>,
    pub metadata: Option<String>,
    pub annotation_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePlaceInput {
    pub name: Option<String>,
    pub lng: Option<f64>,
    pub lat: Option<f64>,
    pub description: Option<String>,
    pub place_type: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_place(
    input: CreatePlaceInput,
    state: State<AppState>,
) -> CommandResult<Place> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO places (
            id, project_id, name, lng, lat, description, place_type, metadata,
            created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [
            &id,
            &input.project_id,
            &input.name,
            &input.lng.to_string(),
            &input.lat.to_string(),
            &input.description.clone().unwrap_or_default(),
            &input.place_type.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    // Link to annotation if provided
    if let Some(annotation_id) = &input.annotation_id {
        let link_id = Uuid::new_v4().to_string();
        db.execute(
            "INSERT INTO annotation_place_links (id, annotation_id, place_id, created_at) VALUES (?1, ?2, ?3, ?4)",
            [&link_id, annotation_id, &id, &now],
        )?;
    }

    Ok(Place {
        id,
        project_id: input.project_id,
        name: input.name,
        lng: input.lng,
        lat: input.lat,
        description: input.description,
        place_type: input.place_type,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn get_place(
    place_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Place>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, lng, lat, description, place_type, metadata, created_at, updated_at
        FROM places WHERE id = ?1"
    )?;

    let result = stmt.query_row([&place_id], |row| {
        Ok(Place {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            lng: row.get(3)?,
            lat: row.get(4)?,
            description: row.get(5)?,
            place_type: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    });

    match result {
        Ok(place) => Ok(Some(place)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_places(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Place>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, lng, lat, description, place_type, metadata, created_at, updated_at
        FROM places
        WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let places = stmt
        .query_map([&project_id], |row| {
            Ok(Place {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                lng: row.get(3)?,
                lat: row.get(4)?,
                description: row.get(5)?,
                place_type: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(places)
}

#[tauri::command]
pub fn update_place(
    place_id: String,
    input: UpdatePlaceInput,
    state: State<AppState>,
) -> CommandResult<Place> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(name) = input.name {
        updates.push("name = ?");
        params.push(name);
    }
    if let Some(lng) = input.lng {
        updates.push("lng = ?");
        params.push(lng.to_string());
    }
    if let Some(lat) = input.lat {
        updates.push("lat = ?");
        params.push(lat.to_string());
    }
    if let Some(description) = input.description {
        updates.push("description = ?");
        params.push(description);
    }
    if let Some(place_type) = input.place_type {
        updates.push("place_type = ?");
        params.push(place_type);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(place_id.clone());

    let query = format!(
        "UPDATE places SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    get_place(place_id, state)?
        .ok_or_else(|| super::CommandError {
            message: "Place not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_place(
    place_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM places WHERE id = ?1", [&place_id])?;
    Ok(())
}

#[tauri::command]
pub fn get_place_for_annotation(
    annotation_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Place>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT p.id, p.project_id, p.name, p.lng, p.lat, p.description, p.place_type, p.metadata, p.created_at, p.updated_at
        FROM places p
        INNER JOIN annotation_place_links apl ON p.id = apl.place_id
        WHERE apl.annotation_id = ?1"
    )?;

    let result = stmt.query_row([&annotation_id], |row| {
        Ok(Place {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            lng: row.get(3)?,
            lat: row.get(4)?,
            description: row.get(5)?,
            place_type: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    });

    match result {
        Ok(place) => Ok(Some(place)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn link_annotation_to_place(
    annotation_id: String,
    place_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO annotation_place_links (id, annotation_id, place_id, created_at) VALUES (?1, ?2, ?3, ?4)",
        [&id, &annotation_id, &place_id, &now],
    )?;

    Ok(())
}

#[tauri::command]
pub fn unlink_annotation_from_place(
    annotation_id: String,
    place_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM annotation_place_links WHERE annotation_id = ?1 AND place_id = ?2",
        [&annotation_id, &place_id],
    )?;

    Ok(())
}
