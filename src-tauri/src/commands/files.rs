use serde::{Deserialize, Serialize};
use tauri::State;
use std::fs;

use super::{AppState, CommandResult};

#[derive(Debug, Deserialize)]
pub struct UploadFileInput {
    pub bucket: String,
    pub file_path: String,
    pub data: Vec<u8>,
}

#[derive(Debug, Serialize)]
pub struct UploadFileResult {
    pub storage_path: String,
}

#[derive(Debug, Deserialize)]
pub struct ReadFileInput {
    pub bucket: String,
    pub file_path: String,
}

#[derive(Debug, Serialize)]
pub struct ReadFileResult {
    pub data: Vec<u8>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteFileInput {
    pub bucket: String,
    pub file_path: String,
}

#[derive(Debug, Deserialize)]
pub struct GetFilePathInput {
    pub bucket: String,
    pub file_path: String,
}

#[derive(Debug, Serialize)]
pub struct GetFilePathResult {
    pub full_path: String,
}

/// Upload a file to local storage
#[tauri::command]
pub fn upload_file(
    input: UploadFileInput,
    state: State<AppState>,
) -> CommandResult<UploadFileResult> {
    let storage_path = state
        .storage
        .store_file(&input.bucket, &input.file_path, &input.data)?;

    Ok(UploadFileResult { storage_path })
}

/// Read a file from local storage
#[tauri::command]
pub fn read_file(
    input: ReadFileInput,
    state: State<AppState>,
) -> CommandResult<ReadFileResult> {
    let data = state.storage.read_file(&input.bucket, &input.file_path)?;

    Ok(ReadFileResult { data })
}

/// Delete a file from local storage
#[tauri::command]
pub fn delete_file(
    input: DeleteFileInput,
    state: State<AppState>,
) -> CommandResult<()> {
    state
        .storage
        .delete_file(&input.bucket, &input.file_path)?;

    Ok(())
}

/// Get the full file system path for a stored file
#[tauri::command]
pub fn get_file_path(
    input: GetFilePathInput,
    state: State<AppState>,
) -> CommandResult<GetFilePathResult> {
    let path = state
        .storage
        .get_file_path(&input.bucket, &input.file_path);

    Ok(GetFilePathResult {
        full_path: path.to_string_lossy().to_string(),
    })
}

/// Save a file from user selection using Tauri dialog
/// Note: In Tauri 2.x, file dialogs should be called from the frontend using the dialog plugin
#[tauri::command]
pub async fn save_file_dialog(
    _default_path: Option<String>,
) -> CommandResult<Option<String>> {
    // This is a placeholder - actual implementation should use tauri-plugin-dialog from frontend
    // Frontend should call: await save({ defaultPath: 'file.txt' })
    Ok(None)
}

/// Open a file dialog to select a file
/// Note: In Tauri 2.x, file dialogs should be called from the frontend using the dialog plugin
#[tauri::command]
pub async fn open_file_dialog(
    _multiple: Option<bool>,
) -> CommandResult<Option<Vec<String>>> {
    // This is a placeholder - actual implementation should use tauri-plugin-dialog from frontend
    // Frontend should call: await open({ multiple: true })
    Ok(None)
}

/// Copy a file from source to destination in local storage
#[tauri::command]
pub fn copy_file_to_storage(
    source_path: String,
    bucket: String,
    dest_path: String,
    state: State<AppState>,
) -> CommandResult<UploadFileResult> {
    // Read the source file
    let data = fs::read(&source_path)?;

    // Store it in the bucket
    let storage_path = state.storage.store_file(&bucket, &dest_path, &data)?;

    Ok(UploadFileResult { storage_path })
}
