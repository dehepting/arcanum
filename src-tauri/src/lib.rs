mod db;
mod storage;
mod commands;

use std::sync::Mutex;
use tauri::Manager;
use commands::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialize database
      let app_data_dir = app.path().app_data_dir()
        .expect("Failed to get app data directory");

      std::fs::create_dir_all(&app_data_dir)
        .expect("Failed to create app data directory");

      let conn = db::init_db(app_data_dir.clone())
        .expect("Failed to initialize database");

      // Initialize storage
      let storage = storage::AppStorage::new(app_data_dir)
        .expect("Failed to initialize storage");

      // Store database connection and storage in app state
      app.manage(AppState {
        db: Mutex::new(conn),
        storage,
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      // Project commands
      commands::projects::create_project,
      commands::projects::get_project,
      commands::projects::list_projects,
      commands::projects::update_project,
      commands::projects::delete_project,

      // Artifact commands
      commands::artifacts::create_artifact,
      commands::artifacts::get_artifact,
      commands::artifacts::list_artifacts,
      commands::artifacts::update_artifact,
      commands::artifacts::delete_artifact,
      commands::artifacts::get_artifacts_by_findspot,
      commands::artifacts::search_artifacts,

      // Place commands
      commands::places::create_place,
      commands::places::get_place,
      commands::places::list_places,
      commands::places::update_place,
      commands::places::delete_place,
      commands::places::get_place_for_annotation,
      commands::places::link_annotation_to_place,
      commands::places::unlink_annotation_from_place,

      // People commands
      commands::people::create_person,
      commands::people::get_person,
      commands::people::list_people,
      commands::people::update_person,
      commands::people::delete_person,
      commands::people::link_annotation_to_person,
      commands::people::unlink_annotation_from_person,

      // Event commands
      commands::events::create_event,
      commands::events::get_event,
      commands::events::list_events,
      commands::events::update_event,
      commands::events::delete_event,

      // Theory commands
      commands::theories::create_theory,
      commands::theories::get_theory,
      commands::theories::list_theories,
      commands::theories::update_theory,
      commands::theories::delete_theory,
      commands::theories::link_annotation_to_theory,
      commands::theories::unlink_annotation_from_theory,

      // Source commands
      commands::sources::create_source,
      commands::sources::get_source,
      commands::sources::list_sources,
      commands::sources::update_source,
      commands::sources::delete_source,

      // Entity page commands
      commands::entity_pages::create_entity_page,
      commands::entity_pages::get_entity_page,
      commands::entity_pages::list_entity_pages,
      commands::entity_pages::update_entity_page,
      commands::entity_pages::delete_entity_page,

      // File commands
      commands::files::upload_file,
      commands::files::read_file,
      commands::files::delete_file,
      commands::files::get_file_path,
      commands::files::save_file_dialog,
      commands::files::open_file_dialog,
      commands::files::copy_file_to_storage,

      // Migration commands
      commands::migration::import_projects,
      commands::migration::import_places,
      commands::migration::import_artifacts,
      commands::migration::import_people,
      commands::migration::import_all_data,
      commands::migration::import_files,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
