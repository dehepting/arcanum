use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub birth_date: Option<String>,
    pub death_date: Option<String>,
    pub occupation: Option<String>,
    pub metadata: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreatePersonInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub birth_date: Option<String>,
    pub death_date: Option<String>,
    pub occupation: Option<String>,
    pub metadata: Option<String>,
    pub annotation_id: Option<String>,
    pub relationship_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePersonInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub birth_date: Option<String>,
    pub death_date: Option<String>,
    pub occupation: Option<String>,
    pub metadata: Option<String>,
}

#[tauri::command]
pub fn create_person(
    input: CreatePersonInput,
    state: State<AppState>,
) -> CommandResult<Person> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    db.execute(
        "INSERT INTO people (
            id, project_id, name, description, birth_date, death_date,
            occupation, metadata, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        [
            &id,
            &input.project_id,
            &input.name,
            &input.description.clone().unwrap_or_default(),
            &input.birth_date.clone().unwrap_or_default(),
            &input.death_date.clone().unwrap_or_default(),
            &input.occupation.clone().unwrap_or_default(),
            &input.metadata.clone().unwrap_or_default(),
            &now,
            &now,
        ],
    )?;

    // Link to annotation if provided
    if let Some(annotation_id) = &input.annotation_id {
        let link_id = Uuid::new_v4().to_string();
        let relationship_type = input.relationship_type.as_deref().unwrap_or("mentions");

        db.execute(
            "INSERT INTO annotation_people_links (id, annotation_id, person_id, relationship_type, created_at)
            VALUES (?1, ?2, ?3, ?4, ?5)",
            [&link_id, annotation_id, &id, &relationship_type.to_string(), &now],
        )?;
    }

    Ok(Person {
        id,
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        birth_date: input.birth_date,
        death_date: input.death_date,
        occupation: input.occupation,
        metadata: input.metadata,
        created_at: now.clone(),
        updated_at: now,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub fn get_person(
    person_id: String,
    state: State<AppState>,
) -> CommandResult<Option<Person>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, birth_date, death_date,
        occupation, metadata, created_at, updated_at
        FROM people WHERE id = ?1"
    )?;

    let result = stmt.query_row([&person_id], |row| {
        Ok(Person {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            birth_date: row.get(4)?,
            death_date: row.get(5)?,
            occupation: row.get(6)?,
            metadata: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    });

    match result {
        Ok(person) => Ok(Some(person)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn list_people(
    project_id: String,
    state: State<AppState>,
) -> CommandResult<Vec<Person>> {
    let db = state.db.lock().unwrap();

    let mut stmt = db.prepare(
        "SELECT id, project_id, name, description, birth_date, death_date,
        occupation, metadata, created_at, updated_at
        FROM people
        WHERE project_id = ?1
        ORDER BY created_at DESC"
    )?;

    let people = stmt
        .query_map([&project_id], |row| {
            Ok(Person {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                birth_date: row.get(4)?,
                death_date: row.get(5)?,
                occupation: row.get(6)?,
                metadata: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(people)
}

#[tauri::command]
pub fn update_person(
    person_id: String,
    input: UpdatePersonInput,
    state: State<AppState>,
) -> CommandResult<Person> {
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
    if let Some(birth_date) = input.birth_date {
        updates.push("birth_date = ?");
        params.push(birth_date);
    }
    if let Some(death_date) = input.death_date {
        updates.push("death_date = ?");
        params.push(death_date);
    }
    if let Some(occupation) = input.occupation {
        updates.push("occupation = ?");
        params.push(occupation);
    }
    if let Some(metadata) = input.metadata {
        updates.push("metadata = ?");
        params.push(metadata);
    }

    updates.push("updated_at = ?");
    params.push(now);
    params.push(person_id.clone());

    let query = format!(
        "UPDATE people SET {} WHERE id = ?",
        updates.join(", ")
    );

    let param_refs: Vec<&str> = params.iter().map(|s| s.as_str()).collect();
    db.execute(&query, rusqlite::params_from_iter(param_refs))?;

    drop(db);

    // Broadcast update notification to WebSocket clients
    let update_msg = serde_json::json!({
        "entity_id": person_id,
        "entity_type": "person"
    }).to_string();
    let _ = state.broadcast_tx.send(update_msg); // Ignore if no listeners

    get_person(person_id.clone(), state)?
        .ok_or_else(|| super::CommandError {
            message: "Person not found after update".to_string(),
        })
}

#[tauri::command]
pub fn delete_person(
    person_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    db.execute("DELETE FROM people WHERE id = ?1", [&person_id])?;
    Ok(())
}

#[tauri::command]
pub fn link_annotation_to_person(
    annotation_id: String,
    person_id: String,
    relationship_type: Option<String>,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let rel_type = relationship_type.unwrap_or_else(|| "mentions".to_string());

    db.execute(
        "INSERT INTO annotation_people_links (id, annotation_id, person_id, relationship_type, created_at)
        VALUES (?1, ?2, ?3, ?4, ?5)",
        [&id, &annotation_id, &person_id, &rel_type, &now],
    )?;

    Ok(())
}

#[tauri::command]
pub fn unlink_annotation_from_person(
    annotation_id: String,
    person_id: String,
    state: State<AppState>,
) -> CommandResult<()> {
    let db = state.db.lock().unwrap();

    db.execute(
        "DELETE FROM annotation_people_links WHERE annotation_id = ?1 AND person_id = ?2",
        [&annotation_id, &person_id],
    )?;

    Ok(())
}
