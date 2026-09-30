use rusqlite::{Connection, Result};
use std::path::PathBuf;

pub fn init_db(app_data_dir: PathBuf) -> Result<Connection> {
    let db_path = app_data_dir.join("arcanum.db");
    let conn = Connection::open(&db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON", [])?;

    // Create all tables
    create_tables(&conn)?;

    // Run migrations if needed
    migrate_annotation_links(&conn)?;
    migrate_add_profile_photos_and_source_type(&conn)?;

    Ok(conn)
}

/// Checks if the annotation links migration has been completed
pub fn is_migration_completed(conn: &Connection) -> bool {
    // Check if migrations table exists and contains our migration
    let result: Result<i32, _> = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='migrations'",
        [],
        |row| row.get(0)
    );

    if result.unwrap_or(0) == 0 {
        return false;
    }

    let migration_result: Result<i32, _> = conn.query_row(
        "SELECT COUNT(*) FROM migrations WHERE name = 'annotation_entity_links_v1'",
        [],
        |row| row.get(0)
    );
    migration_result.is_ok() && migration_result.unwrap() > 0
}

/// Migrates data from old annotation link tables to the new unified table.
/// This function is idempotent - it can be run multiple times safely.
pub fn migrate_annotation_links(conn: &Connection) -> Result<()> {
    // Check if migration has already been run by looking for a migration marker
    if is_migration_completed(conn) {
        // Migration already completed
        log::info!("Annotation links migration already completed, skipping");
        return Ok(());
    }

    log::info!("Starting annotation links migration...");

    // Migrate from annotation_people_links
    let people_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM annotation_people_links",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    if people_count > 0 {
        log::info!("Migrating {} people links...", people_count);
        conn.execute(
            "INSERT OR IGNORE INTO annotation_entity_links (id, annotation_id, entity_id, entity_type, relationship_type, created_at)
            SELECT id, annotation_id, person_id, 'person', relationship_type, created_at
            FROM annotation_people_links
            WHERE EXISTS (SELECT 1 FROM annotations WHERE id = annotation_id)
              AND EXISTS (SELECT 1 FROM people WHERE id = person_id)",
            [],
        )?;
    }

    // Migrate from annotation_theories_links
    let theories_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM annotation_theories_links",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    if theories_count > 0 {
        log::info!("Migrating {} theory links...", theories_count);
        conn.execute(
            "INSERT OR IGNORE INTO annotation_entity_links (id, annotation_id, entity_id, entity_type, relationship_type, created_at)
            SELECT id, annotation_id, theory_id, 'theory', 'mentions', created_at
            FROM annotation_theories_links
            WHERE EXISTS (SELECT 1 FROM annotations WHERE id = annotation_id)
              AND EXISTS (SELECT 1 FROM theories WHERE id = theory_id)",
            [],
        )?;
    }

    // Migrate from annotation_place_links
    let places_count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM annotation_place_links",
        [],
        |row| row.get(0)
    ).unwrap_or(0);

    if places_count > 0 {
        log::info!("Migrating {} place links...", places_count);
        conn.execute(
            "INSERT OR IGNORE INTO annotation_entity_links (id, annotation_id, entity_id, entity_type, relationship_type, created_at)
            SELECT id, annotation_id, place_id, 'place', 'mentions', created_at
            FROM annotation_place_links
            WHERE EXISTS (SELECT 1 FROM annotations WHERE id = annotation_id)
              AND EXISTS (SELECT 1 FROM places WHERE id = place_id)",
            [],
        )?;
    }

    // Record migration completion in migrations table
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO migrations (name, applied_at) VALUES ('annotation_entity_links_v1', ?1)",
        [&now],
    )?;

    log::info!("Annotation links migration completed: {} people, {} theories, {} places",
        people_count, theories_count, places_count);

    Ok(())
}

/// Adds profile_photo_url columns to entity tables and source_type to sources table.
/// This function is idempotent - it can be run multiple times safely.
pub fn migrate_add_profile_photos_and_source_type(conn: &Connection) -> Result<()> {
    // Check if migration has already been run
    let migration_name = "add_profile_photos_and_source_type_v1";
    let result: Result<i32, _> = conn.query_row(
        "SELECT COUNT(*) FROM migrations WHERE name = ?1",
        [migration_name],
        |row| row.get(0)
    );

    if result.unwrap_or(0) > 0 {
        log::info!("Profile photos migration already completed, skipping");
        return Ok(());
    }

    log::info!("Starting profile photos and source_type migration...");

    // Add profile_photo_url to places
    let _ = conn.execute(
        "ALTER TABLE places ADD COLUMN profile_photo_url TEXT",
        [],
    );

    // Add profile_photo_url to artifacts
    let _ = conn.execute(
        "ALTER TABLE artifacts ADD COLUMN profile_photo_url TEXT",
        [],
    );

    // Add profile_photo_url to people
    let _ = conn.execute(
        "ALTER TABLE people ADD COLUMN profile_photo_url TEXT",
        [],
    );

    // Add profile_photo_url to events
    let _ = conn.execute(
        "ALTER TABLE events ADD COLUMN profile_photo_url TEXT",
        [],
    );

    // Add profile_photo_url to theories
    let _ = conn.execute(
        "ALTER TABLE theories ADD COLUMN profile_photo_url TEXT",
        [],
    );

    // Add source_type to sources (defaults to 'pdf' for existing records)
    let _ = conn.execute(
        "ALTER TABLE sources ADD COLUMN source_type TEXT DEFAULT 'pdf'",
        [],
    );

    // Record migration completion
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO migrations (name, applied_at) VALUES (?1, ?2)",
        [migration_name, &now],
    )?;

    log::info!("Profile photos and source_type migration completed");

    Ok(())
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
            profile_photo_url TEXT,
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
            profile_photo_url TEXT,
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
            profile_photo_url TEXT,
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
            profile_photo_url TEXT,
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
            profile_photo_url TEXT,
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
            source_type TEXT DEFAULT 'pdf',
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

    // FTS5 virtual tables for full-text search

    // People FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS people_fts USING fts5(
            id UNINDEXED,
            name,
            description,
            occupation,
            content=people,
            content_rowid=rowid
        )",
        [],
    )?;

    // People FTS triggers
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS people_fts_insert
        AFTER INSERT ON people BEGIN
            INSERT INTO people_fts(rowid, id, name, description, occupation)
            VALUES (new.rowid, new.id, new.name, COALESCE(new.description, ''), COALESCE(new.occupation, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS people_fts_update
        AFTER UPDATE ON people BEGIN
            UPDATE people_fts SET
                id = new.id,
                name = new.name,
                description = COALESCE(new.description, ''),
                occupation = COALESCE(new.occupation, '')
            WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS people_fts_delete
        AFTER DELETE ON people BEGIN
            DELETE FROM people_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    // Events FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS events_fts USING fts5(
            id UNINDEXED,
            name,
            description,
            location,
            content=events,
            content_rowid=rowid
        )",
        [],
    )?;

    // Events FTS triggers
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS events_fts_insert
        AFTER INSERT ON events BEGIN
            INSERT INTO events_fts(rowid, id, name, description, location)
            VALUES (new.rowid, new.id, new.name, COALESCE(new.description, ''), COALESCE(new.location, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS events_fts_update
        AFTER UPDATE ON events BEGIN
            UPDATE events_fts SET
                id = new.id,
                name = new.name,
                description = COALESCE(new.description, ''),
                location = COALESCE(new.location, '')
            WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS events_fts_delete
        AFTER DELETE ON events BEGIN
            DELETE FROM events_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    // Theories FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS theories_fts USING fts5(
            id UNINDEXED,
            name,
            description,
            content=theories,
            content_rowid=rowid
        )",
        [],
    )?;

    // Theories FTS triggers
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS theories_fts_insert
        AFTER INSERT ON theories BEGIN
            INSERT INTO theories_fts(rowid, id, name, description)
            VALUES (new.rowid, new.id, new.name, COALESCE(new.description, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS theories_fts_update
        AFTER UPDATE ON theories BEGIN
            UPDATE theories_fts SET
                id = new.id,
                name = new.name,
                description = COALESCE(new.description, '')
            WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS theories_fts_delete
        AFTER DELETE ON theories BEGIN
            DELETE FROM theories_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    // Places FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS places_fts USING fts5(
            id UNINDEXED,
            name,
            description,
            place_type,
            content=places,
            content_rowid=rowid
        )",
        [],
    )?;

    // Places FTS triggers
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS places_fts_insert
        AFTER INSERT ON places BEGIN
            INSERT INTO places_fts(rowid, id, name, description, place_type)
            VALUES (new.rowid, new.id, new.name, COALESCE(new.description, ''), COALESCE(new.place_type, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS places_fts_update
        AFTER UPDATE ON places BEGIN
            UPDATE places_fts SET
                id = new.id,
                name = new.name,
                description = COALESCE(new.description, ''),
                place_type = COALESCE(new.place_type, '')
            WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS places_fts_delete
        AFTER DELETE ON places BEGIN
            DELETE FROM places_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    // Artifacts FTS
    conn.execute(
        "CREATE VIRTUAL TABLE IF NOT EXISTS artifacts_fts USING fts5(
            id UNINDEXED,
            name,
            description,
            category,
            owner_name,
            content=artifacts,
            content_rowid=rowid
        )",
        [],
    )?;

    // Artifacts FTS triggers
    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS artifacts_fts_insert
        AFTER INSERT ON artifacts BEGIN
            INSERT INTO artifacts_fts(rowid, id, name, description, category, owner_name)
            VALUES (new.rowid, new.id, new.name, COALESCE(new.description, ''), COALESCE(new.category, ''), COALESCE(new.owner_name, ''));
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS artifacts_fts_update
        AFTER UPDATE ON artifacts BEGIN
            UPDATE artifacts_fts SET
                id = new.id,
                name = new.name,
                description = COALESCE(new.description, ''),
                category = COALESCE(new.category, ''),
                owner_name = COALESCE(new.owner_name, '')
            WHERE rowid = old.rowid;
        END",
        [],
    )?;

    conn.execute(
        "CREATE TRIGGER IF NOT EXISTS artifacts_fts_delete
        AFTER DELETE ON artifacts BEGIN
            DELETE FROM artifacts_fts WHERE rowid = old.rowid;
        END",
        [],
    )?;

    // Populate FTS5 tables with existing data
    // These 'rebuild' commands tell FTS5 to sync from the content tables
    conn.execute("INSERT INTO people_fts(people_fts) VALUES('rebuild')", [])?;
    conn.execute("INSERT INTO events_fts(events_fts) VALUES('rebuild')", [])?;
    conn.execute("INSERT INTO theories_fts(theories_fts) VALUES('rebuild')", [])?;
    conn.execute("INSERT INTO places_fts(places_fts) VALUES('rebuild')", [])?;
    conn.execute("INSERT INTO artifacts_fts(artifacts_fts) VALUES('rebuild')", [])?;

    // Migrations tracking table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS migrations (
            name TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL
        )",
        [],
    )?;

    // Unified annotation-entity links table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS annotation_entity_links (
            id TEXT PRIMARY KEY,
            annotation_id TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            entity_type TEXT NOT NULL CHECK (entity_type IN ('person', 'event', 'theory', 'place', 'artifact')),
            relationship_type TEXT DEFAULT 'mentions',
            created_at TEXT NOT NULL,
            FOREIGN KEY (annotation_id) REFERENCES annotations(id) ON DELETE CASCADE,
            UNIQUE(annotation_id, entity_id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_entity_annotation ON annotation_entity_links(annotation_id)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_entity_entity ON annotation_entity_links(entity_id, entity_type)",
        [],
    )?;
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_annotation_entity_type ON annotation_entity_links(entity_type)",
        [],
    )?;

    Ok(())
}
