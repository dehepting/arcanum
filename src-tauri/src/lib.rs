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
      let _storage = storage::AppStorage::new(app_data_dir)
        .expect("Failed to initialize storage");

      // Store database connection in app state
      app.manage(AppState {
        db: Mutex::new(conn),
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::projects::create_project,
      commands::projects::get_project,
      commands::projects::list_projects,
      commands::projects::update_project,
      commands::projects::delete_project,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
