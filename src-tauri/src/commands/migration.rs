use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri::State;
use std::fs;
use std::path::Path;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize)]
pub struct ImportStats {
    pub table: String,
    pub imported: usize,
    pub failed: usize,
    pub skipped: usize,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub total_imported: usize,
    pub total_failed: usize,
    pub stats: Vec<ImportStats>,
}

/// Import projects from JSON file
#[tauri::command]
pub fn import_projects(
    json_path: String,
    state: State<AppState>,
) -> CommandResult<ImportStats> {
    let db = state.db.lock().unwrap();
    let content = fs::read_to_string(&json_path)?;
    let projects: Vec<Value> = serde_json::from_str(&content)?;

    let mut imported = 0;
    let mut failed = 0;

    for project in projects {
        let result = db.execute(
            "INSERT OR REPLACE INTO projects (id, name, description, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5)",
            [
                project["id"].as_str().unwrap_or(""),
                project["name"].as_str().unwrap_or(""),
                project["description"].as_str().unwrap_or(""),
                project["created_at"].as_str().unwrap_or(""),
                project["updated_at"].as_str().unwrap_or(""),
            ],
        );

        if result.is_ok() {
            imported += 1;
        } else {
            failed += 1;
        }
    }

    Ok(ImportStats {
        table: "projects".to_string(),
        imported,
        failed,
        skipped: 0,
    })
}

/// Import places from JSON file
#[tauri::command]
pub fn import_places(
    json_path: String,
    state: State<AppState>,
) -> CommandResult<ImportStats> {
    let db = state.db.lock().unwrap();
    let content = fs::read_to_string(&json_path)?;
    let places: Vec<Value> = serde_json::from_str(&content)?;

    let mut imported = 0;
    let mut failed = 0;

    for place in places {
        let lng = place["lng"].as_f64().unwrap_or(0.0).to_string();
        let lat = place["lat"].as_f64().unwrap_or(0.0).to_string();

        let result = db.execute(
            "INSERT OR REPLACE INTO places (
                id, project_id, name, lng, lat, description, place_type, metadata,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                place["id"].as_str().unwrap_or(""),
                place["project_id"].as_str().unwrap_or(""),
                place["name"].as_str().unwrap_or(""),
                &lng,
                &lat,
                place["description"].as_str().unwrap_or(""),
                place["place_type"].as_str().unwrap_or(""),
                place["metadata"].as_str().unwrap_or(""),
                place["created_at"].as_str().unwrap_or(""),
                place["updated_at"].as_str().unwrap_or(""),
            ],
        );

        if result.is_ok() {
            imported += 1;
        } else {
            failed += 1;
        }
    }

    Ok(ImportStats {
        table: "places".to_string(),
        imported,
        failed,
        skipped: 0,
    })
}

/// Import artifacts from JSON file
#[tauri::command]
pub fn import_artifacts(
    json_path: String,
    state: State<AppState>,
) -> CommandResult<ImportStats> {
    let db = state.db.lock().unwrap();
    let content = fs::read_to_string(&json_path)?;
    let artifacts: Vec<Value> = serde_json::from_str(&content)?;

    let mut imported = 0;
    let mut failed = 0;

    for artifact in artifacts {
        let result = db.execute(
            "INSERT OR REPLACE INTO artifacts (
                id, project_id, name, description, category, date_range,
                owner_type, owner_name, findspot_place_id, images, metadata,
                created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            [
                artifact["id"].as_str().unwrap_or(""),
                artifact["project_id"].as_str().unwrap_or(""),
                artifact["name"].as_str().unwrap_or(""),
                artifact["description"].as_str().unwrap_or(""),
                artifact["category"].as_str().unwrap_or(""),
                artifact["date_range"].as_str().unwrap_or(""),
                artifact["owner_type"].as_str().unwrap_or(""),
                artifact["owner_name"].as_str().unwrap_or(""),
                artifact["findspot_place_id"].as_str().unwrap_or(""),
                artifact["images"].as_str().unwrap_or(""),
                artifact["metadata"].as_str().unwrap_or(""),
                artifact["created_at"].as_str().unwrap_or(""),
                artifact["updated_at"].as_str().unwrap_or(""),
            ],
        );

        if result.is_ok() {
            imported += 1;
        } else {
            failed += 1;
        }
    }

    Ok(ImportStats {
        table: "artifacts".to_string(),
        imported,
        failed,
        skipped: 0,
    })
}

/// Import people from JSON file
#[tauri::command]
pub fn import_people(
    json_path: String,
    state: State<AppState>,
) -> CommandResult<ImportStats> {
    let db = state.db.lock().unwrap();
    let content = fs::read_to_string(&json_path)?;
    let people: Vec<Value> = serde_json::from_str(&content)?;

    let mut imported = 0;
    let mut failed = 0;

    for person in people {
        let result = db.execute(
            "INSERT OR REPLACE INTO people (
                id, project_id, name, description, birth_date, death_date,
                occupation, metadata, created_at, updated_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            [
                person["id"].as_str().unwrap_or(""),
                person["project_id"].as_str().unwrap_or(""),
                person["name"].as_str().unwrap_or(""),
                person["description"].as_str().unwrap_or(""),
                person["birth_date"].as_str().unwrap_or(""),
                person["death_date"].as_str().unwrap_or(""),
                person["occupation"].as_str().unwrap_or(""),
                person["metadata"].as_str().unwrap_or(""),
                person["created_at"].as_str().unwrap_or(""),
                person["updated_at"].as_str().unwrap_or(""),
            ],
        );

        if result.is_ok() {
            imported += 1;
        } else {
            failed += 1;
        }
    }

    Ok(ImportStats {
        table: "people".to_string(),
        imported,
        failed,
        skipped: 0,
    })
}

/// Import all data from a directory containing JSON files
#[tauri::command]
pub fn import_all_data(
    data_dir: String,
    state: State<AppState>,
) -> CommandResult<ImportResult> {
    let mut stats = Vec::new();
    let mut total_imported = 0;
    let mut total_failed = 0;

    // Import projects
    let projects_path = Path::new(&data_dir).join("projects.json");
    if projects_path.exists() {
        match import_projects(projects_path.to_string_lossy().to_string(), state.clone()) {
            Ok(stat) => {
                total_imported += stat.imported;
                total_failed += stat.failed;
                stats.push(stat);
            }
            Err(_) => {
                stats.push(ImportStats {
                    table: "projects".to_string(),
                    imported: 0,
                    failed: 0,
                    skipped: 0,
                });
            }
        }
    }

    // Import places
    let places_path = Path::new(&data_dir).join("places.json");
    if places_path.exists() {
        match import_places(places_path.to_string_lossy().to_string(), state.clone()) {
            Ok(stat) => {
                total_imported += stat.imported;
                total_failed += stat.failed;
                stats.push(stat);
            }
            Err(_) => {
                stats.push(ImportStats {
                    table: "places".to_string(),
                    imported: 0,
                    failed: 0,
                    skipped: 0,
                });
            }
        }
    }

    // Import artifacts
    let artifacts_path = Path::new(&data_dir).join("artifacts.json");
    if artifacts_path.exists() {
        match import_artifacts(artifacts_path.to_string_lossy().to_string(), state.clone()) {
            Ok(stat) => {
                total_imported += stat.imported;
                total_failed += stat.failed;
                stats.push(stat);
            }
            Err(_) => {
                stats.push(ImportStats {
                    table: "artifacts".to_string(),
                    imported: 0,
                    failed: 0,
                    skipped: 0,
                });
            }
        }
    }

    // Import people
    let people_path = Path::new(&data_dir).join("people.json");
    if people_path.exists() {
        match import_people(people_path.to_string_lossy().to_string(), state.clone()) {
            Ok(stat) => {
                total_imported += stat.imported;
                total_failed += stat.failed;
                stats.push(stat);
            }
            Err(_) => {
                stats.push(ImportStats {
                    table: "people".to_string(),
                    imported: 0,
                    failed: 0,
                    skipped: 0,
                });
            }
        }
    }

    Ok(ImportResult {
        total_imported,
        total_failed,
        stats,
    })
}

/// Copy files from migration directory to app storage
#[tauri::command]
pub fn import_files(
    files_dir: String,
    state: State<AppState>,
) -> CommandResult<usize> {
    let mut copied = 0;

    let buckets = vec!["artifacts", "sources", "map-overlays", "entity-pages"];

    for bucket in buckets {
        let source_dir = Path::new(&files_dir).join(bucket);
        if !source_dir.exists() {
            continue;
        }

        let dest_dir = match bucket {
            "artifacts" => state.storage.artifacts_dir(),
            "sources" => state.storage.sources_dir(),
            "map-overlays" => state.storage.map_overlays_dir(),
            "entity-pages" => state.storage.entity_pages_dir(),
            _ => continue,
        };

        // Copy all files recursively
        if let Ok(entries) = fs::read_dir(&source_dir) {
            for entry in entries.flatten() {
                let source_path = entry.path();
                if source_path.is_file() {
                    if let Some(file_name) = source_path.file_name() {
                        let dest_path = dest_dir.join(file_name);
                        if fs::copy(&source_path, &dest_path).is_ok() {
                            copied += 1;
                        }
                    }
                }
            }
        }
    }

    Ok(copied)
}
