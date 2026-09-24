use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn init_db(app_data_dir: PathBuf) -> Result<Connection> {
    let db_path = app_data_dir.join("arcanum.db");
    let conn = Connection::open(&db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Create all tables
    create_tables(&conn)?;

    Ok(conn)
}

fn create_tables(conn: &Connection) -> Result<()> {
    // Projects table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;

    // Places table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS places (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            lng REAL NOT NULL,
            lat REAL NOT NULL,
            description TEXT,
            place_type TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_places_project ON places(project_id)",
        [],
    )?;

    // Artifacts table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS artifacts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            date_range TEXT,
            owner_type TEXT,
            owner_name TEXT,
            findspot_place_id TEXT,
            images TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (findspot_place_id) REFERENCES places(id) ON DELETE SET NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_artifacts_project ON artifacts(project_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_artifacts_findspot ON artifacts(findspot_place_id)",
        [],
    )?;

    // People table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS people (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            birth_date TEXT,
            death_date TEXT,
            occupation TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_people_project ON people(project_id)",
        [],
    )?;

    // Events table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            event_date TEXT,
            location TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id)",
        [],
    )?;

    // Theories table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS theories (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_theories_project ON theories(project_id)",
        [],
    )?;

    // Entity pages table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS entity_pages (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'event', 'theory', 'place', 'artifact')),
            title TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_pages_entity ON entity_pages(entity_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_pages_project ON entity_pages(project_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_pages_type ON entity_pages(entity_type)",
        [],
    )?;
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_pages_unique_entity ON entity_pages(entity_id)",
        [],
    )?;

    // Canvases table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS canvases (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            is_dashboard INTEGER DEFAULT 0,
            canvas_data TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_canvases_project ON canvases(project_id)",
        [],
    )?;

    // Entity links table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS entity_links (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            from_entity_id TEXT NOT NULL,
            from_entity_type TEXT NOT NULL,
            to_entity_id TEXT NOT NULL,
            to_entity_type TEXT NOT NULL,
            relationship_type TEXT,
            verified INTEGER DEFAULT 0,
            notes TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_links_from ON entity_links(from_entity_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_links_to ON entity_links(to_entity_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_links_project ON entity_links(project_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_entity_links_type ON entity_links(relationship_type)",
        [],
    )?;
    conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_links_unique ON entity_links(from_entity_id, to_entity_id, relationship_type)",
        [],
    )?;

    // Sources table (PDFs/documents)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS sources (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            title TEXT NOT NULL,
            file_name TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            file_size INTEGER,
            mime_type TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_sources_project ON sources(project_id)",
        [],
    )?;

    // Annotations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotations (
            id TEXT PRIMARY KEY,
            source_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            page_number INTEGER,
            annotation_type TEXT NOT NULL,
            content TEXT,
            geometry TEXT,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotations_source ON annotations(source_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotations_project ON annotations(project_id)",
        [],
    )?;

    // Annotation-People links
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotation_people_links (
            id TEXT PRIMARY KEY,
            annotation_id TEXT NOT NULL,
            person_id TEXT NOT NULL,
            relationship_type TEXT DEFAULT 'mentions',
            created_at TEXT NOT NULL,
            FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
            FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_people_annotation ON annotation_people_links(annotation_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_people_person ON annotation_people_links(person_id)",
        [],
    )?;

    // Annotation-Theories links
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotation_theories_links (
            id TEXT PRIMARY KEY,
            annotation_id TEXT NOT NULL,
            theory_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
            FOREIGN KEY (theory_id) REFERENCES theories(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_theories_annotation ON annotation_theories_links(annotation_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_theories_theory ON annotation_theories_links(theory_id)",
        [],
    )?;

    // Annotation-Place links
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotation_place_links (
            id TEXT PRIMARY KEY,
            annotation_id TEXT NOT NULL,
            place_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
            FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_place_annotation ON annotation_place_links(annotation_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_place_place ON annotation_place_links(place_id)",
        [],
    )?;

    // Map overlays table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS map_overlays (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            bounds TEXT NOT NULL,
            opacity REAL DEFAULT 0.7,
            visible INTEGER DEFAULT 1,
            metadata TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_map_overlays_project ON map_overlays(project_id)",
        [],
    )?;

    // Provenance records table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS provenance_records (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_data TEXT,
            user_id TEXT,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_provenance_entity ON provenance_records(entity_type, entity_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_provenance_project ON provenance_records(project_id)",
        [],
    )?;

    Ok(())
}
