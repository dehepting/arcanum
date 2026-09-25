use serde::{Deserialize, Serialize};
use tauri::State;
use rusqlite::params;

use super::{AppState, CommandResult};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchInput {
    pub project_id: String,
    pub query: String,
    pub entity_types: Vec<String>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub entity_type: String,
    pub name: String,
    pub description: Option<String>,
    pub snippet: String,
    pub rank: f64,
}

#[tauri::command]
pub fn search_entities(
    input: SearchInput,
    state: State<AppState>,
) -> CommandResult<Vec<SearchResult>> {
    let db = state.db.lock().unwrap();
    let mut all_results = Vec::new();

    // Default limit of 50 total results
    let total_limit = input.limit.unwrap_or(50);

    // If no entity types specified, return empty results
    if input.entity_types.is_empty() {
        return Ok(all_results);
    }

    // Validate entity types against whitelist to prevent SQL injection
    const VALID_ENTITY_TYPES: &[&str] = &["people", "events", "theories", "places", "artifacts"];
    let validated_types: Vec<&String> = input
        .entity_types
        .iter()
        .filter(|t| VALID_ENTITY_TYPES.contains(&t.as_str()))
        .collect();

    if validated_types.is_empty() {
        return Ok(all_results);
    }

    // Transform query for prefix matching: add * to each word for autocomplete behavior
    // This allows typing "f" to match "Foucault", "fouc" to match "Foucault", etc.
    let fts_query = input
        .query
        .split_whitespace()
        .map(|word| {
            // If word already has wildcard, leave it; otherwise add prefix wildcard
            if word.ends_with('*') {
                word.to_string()
            } else {
                format!("{}*", word)
            }
        })
        .collect::<Vec<String>>()
        .join(" ");

    // Calculate per-type limit to distribute results evenly
    let per_type_limit = (total_limit / validated_types.len()).max(1);

    // Search each requested entity type
    for entity_type in validated_types {
        let table_name = entity_type.as_str();
        let fts_table = format!("{}_fts", table_name);

        // Build the SQL query based on entity type
        let sql = format!(
            "SELECT
                {0}.id,
                {0}.name,
                {0}.description,
                snippet({1}, 1, '<mark>', '</mark>', '...', 32) as snippet,
                bm25({1}) as rank
            FROM {1}
            INNER JOIN {0} ON {1}.id = {0}.id
            WHERE {1} MATCH ?1
            AND {0}.project_id = ?2
            ORDER BY rank
            LIMIT ?3",
            table_name, fts_table
        );

        let mut stmt = match db.prepare(&sql) {
            Ok(stmt) => stmt,
            Err(_) => continue, // Skip if FTS table doesn't exist yet
        };

        let results = stmt.query_map(
            params![&fts_query, &input.project_id, per_type_limit],
            |row| {
                Ok(SearchResult {
                    id: row.get(0)?,
                    entity_type: entity_type.clone(),
                    name: row.get(1)?,
                    description: row.get(2)?,
                    snippet: row.get(3)?,
                    rank: row.get(4)?,
                })
            },
        );

        if let Ok(results) = results {
            for result in results {
                if let Ok(result) = result {
                    all_results.push(result);
                }
            }
        }
    }

    // Sort all results by rank (lower BM25 score = better match)
    all_results.sort_by(|a, b| a.rank.partial_cmp(&b.rank).unwrap());

    // Take top results up to the limit
    Ok(all_results.into_iter().take(total_limit).collect())
}
