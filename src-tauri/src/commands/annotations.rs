use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Annotation {
    pub id: String,
    pub source_id: String,
    pub project_id: String,
    pub page_number: Option<i32>,
    pub annotation_type: String,
    pub content: Option<String>,
    pub geometry: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAnnotationInput {
    pub source_id: String,
    pub project_id: String,
    pub page_number: Option<i32>,
    pub annotation_type: String,
    pub content: Option<String>,
    pub geometry: Option<String>,
    pub metadata: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateAnnotationInput {
    pub content: Option<String>,
    pub geometry: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_annotation(
    input: CreateAnnotationInput,
    state: State<AppState>,
) -> CommandResult<Annotation> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let page_number_str = input.page_number.map(|p| p.to_string()).unwrap_or_default();

    db.execute(
        "INSERT INTO annotations (
            id, source_id, project_id, page_number, annotation_type,
            content, geometry, metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [
            &id,
            &input.source_id,
            &input.project_id,
            &page_number_str,
            &input.annotation_type,
            &input.content.clone().unwrap_or_default(),
            &input.geometry.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    Ok(Annotation {
        id,
        source_id: input.source_id,
        project_id: input.project_id,
        page_number: input.page_number,
        annotation_type: input.annotation_type,
        content: input.content,
        geometry: input.geometry,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command]
pub fn load_annotations(
    source_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Annotation>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, source_id, project_id, page_number, annotation_type,
        content, geometry, metadata, created_at, updated_at
        FROM annotations WHERE source_id = ?1
        ORDER BY created_at ASC"
    )?;

    let rows = stmt.query_map([&source_id], |row| {
        let page_number_str: Option<String> = row.get(3)?;
        let page_number = page_number_str.and_then(|s| s.parse::<i32>().ok());

        Ok(Annotation {
            id: row.get(0)?,
            source_id: row.get(1)?,
            project_id: row.get(2)?,
            page_number,
            annotation_type: row.get(4)?,
            content: row.get(5)?,
            geometry: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    let mut annotations = Vec::new();
    for row in rows {
        annotations.push(row?);
    }

    Ok(annotations)
}

#[tauri::command]
pub fn update_annotation(
    annotation_id: String,
    input: UpdateAnnotationInput,
    state: State<AppState>,
) -> CommandResult<Annotation> {
    let db = state.db.lock().unwrap();
    let now = Utc::now().to_rfc3339();

    // Build dynamic update query based on provided fields
    let mut updates = Vec::new();
    let mut params: Vec<String> = Vec::new();

    if let Some(content) = &input.content {
        updates.push("content = ?");
        params.push(content.clone());
    }
    if let Some(geometry) = &input.geometry {
        updates.push("geometry = ?");
        params.push(geometry.clone());
    }
    if let Some(metadata) = &input.metadata {
        updates.push("metadata = ?");
        params.push(metadata.clone());
    }

    updates.push("updated_at = ?");
    params.push(now.clone());
    params.push(annotation_id.clone());

    let query = format!(
        "UPDATE annotations SET {} WHERE id = ?",
        updates.join(", ")
    );

    let params_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|s| s as &dyn rusqlite::ToSql).collect();
    db.execute(&query, params_refs.as_slice())?;

    // Fetch and return updated annotation
    let mut stmt = db.prepare(
        "SELECT id, source_id, project_id, page_number, annotation_type,
        content, geometry, metadata, created_at, updated_at
        FROM annotations WHERE id = ?1"
    )?;

    let annotation = stmt.query_row([&annotation_id], |row| {
        let page_number_str: Option<String> = row.get(3)?;
        let page_number = page_number_str.and_then(|s| s.parse::<i32>().ok());

        Ok(Annotation {
            id: row.get(0)?,
            source_id: row.get(1)?,
            project_id: row.get(2)?,
            page_number,
            annotation_type: row.get(4)?,
            content: row.get(5)?,
            geometry: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    Ok(annotation)
}

#[tauri::command]
pub fn delete_annotation(
    annotation_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM annotations WHERE id = ?1",
        [&annotation_id],
    )?;

    Ok(())
}

// ============================================================================
// Unified Annotation-Entity Linking Commands
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct AnnotationEntityLink {
    pub id: String,
    pub annotation_id: String,
    pub entity_id: String,
    pub entity_type: String,
    pub relationship_type: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LinkedEntity {
    pub entity_id: String,
    pub entity_type: String,
    pub relationship_type: String,
    pub created_at: String,
}

/// Links an annotation to any entity (person, event, theory, place, artifact)
#[tauri::command]
pub fn link_annotation_to_entity(
    annotation_id: String,
    entity_id: String,
    entity_type: String,
    relationship_type: Option<String>,
    state: State<AppState>,
) -> CommandResult<AnnotationEntityLink> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let rel_type = relationship_type.unwrap_or_else(|| "mentions".to_string());

    // Validate entity_type
    let valid_types = vec!["person", "event", "theory", "place", "artifact"];
    if !valid_types.contains(&entity_type.as_str()) {
        return Err(super::CommandError {
            message: format!("Invalid entity_type '{}'. Must be one of: person, event, theory, place, artifact", entity_type),
        });
    }

    db.execute(
        "INSERT INTO annotation_entity_links (id, annotation_id, entity_id, entity_type, relationship_type, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        ON CONFLICT(annotation_id, entity_id) DO UPDATE SET
            entity_type = excluded.entity_type,
            relationship_type = excluded.relationship_type",
        [&id, &annotation_id, &entity_id, &entity_type, &rel_type, &now],
    )?;

    Ok(AnnotationEntityLink {
        id,
        annotation_id,
        entity_id,
        entity_type,
        relationship_type: rel_type,
        created_at: now,
    })
}

/// Unlinks an annotation from an entity
#[tauri::command]
pub fn unlink_annotation_from_entity(
    annotation_id: String,
    entity_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM annotation_entity_links WHERE annotation_id = ?1 AND entity_id = ?2",
        [&annotation_id, &entity_id],
    )?;

    Ok(())
}

/// Gets all entities linked to a specific annotation
#[tauri::command]
pub fn get_entities_for_annotation(
    annotation_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<LinkedEntity>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT entity_id, entity_type, relationship_type, created_at
        FROM annotation_entity_links
        WHERE annotation_id = ?1
        AND id != 'migration_marker'
        ORDER BY created_at ASC"
    )?;

    let rows = stmt.query_map([&annotation_id], |row| {
        Ok(LinkedEntity {
            entity_id: row.get(0)?,
            entity_type: row.get(1)?,
            relationship_type: row.get(2)?,
            created_at: row.get(3)?,
        })
    })?;

    let mut entities = Vec::new();
    for row in rows {
        entities.push(row?);
    }

    Ok(entities)
}

/// Gets all annotations linked to a specific entity (reverse lookup)
#[tauri::command]
pub fn get_annotations_for_entity(
    entity_id: String,
    entity_type: String,
    state: State<AppState>,
) -> CommandResult<Vec<String>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT annotation_id
        FROM annotation_entity_links
        WHERE entity_id = ?1 AND entity_type = ?2
        AND id != 'migration_marker'
        ORDER BY created_at ASC"
    )?;

    let rows = stmt.query_map([&entity_id, &entity_type], |row| {
        row.get::<_, String>(0)
    })?;

    let mut annotation_ids = Vec::new();
    for row in rows {
        annotation_ids.push(row?);
    }

    Ok(annotation_ids)
}
