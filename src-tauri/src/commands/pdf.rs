use crate::commands::{CommandError, CommandResult};
use std::process::Command;
use base64::Engine;

#[derive(serde::Serialize)]
pub struct PdfPageInfo {
    pub width: u32,
    pub height: u32,
    pub total_pages: u16,
}

/// Render a PDF page to PNG using macOS's built-in sips command
#[tauri::command]
pub async fn render_pdf_page(
    file_path: String,
    page_number: u16,
    _scale: Option<f32>,
) -> CommandResult<String> {
    // Use sips (macOS built-in) to convert PDF page to PNG
    // sips -s format png input.pdf --out output.png

    let temp_dir = std::env::temp_dir();
    let temp_file = temp_dir.join(format!("pdf_page_{}.png", page_number));

    let output = Command::new("sips")
        .arg("-s")
        .arg("format")
        .arg("png")
        .arg(&file_path)
        .arg("--out")
        .arg(&temp_file)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to execute sips command: {}", e),
        })?;

    if !output.status.success() {
        return Err(CommandError {
            message: format!("sips command failed: {}", String::from_utf8_lossy(&output.stderr)),
        });
    }

    // Read the generated PNG file
    let png_bytes = std::fs::read(&temp_file)
        .map_err(|e| CommandError {
            message: format!("Failed to read generated PNG: {}", e),
        })?;

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_file);

    // Encode to base64
    let base64_image = base64::engine::general_purpose::STANDARD.encode(&png_bytes);

    Ok(base64_image)
}

/// Get PDF metadata using mdls (macOS built-in)
#[tauri::command]
pub async fn get_pdf_info(file_path: String) -> CommandResult<PdfPageInfo> {
    // Use mdls to get PDF page count
    let output = Command::new("mdls")
        .arg("-name")
        .arg("kMDItemNumberOfPages")
        .arg(&file_path)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to execute mdls command: {}", e),
        })?;

    if !output.status.success() {
        return Err(CommandError {
            message: format!("mdls command failed: {}", String::from_utf8_lossy(&output.stderr)),
        });
    }

    // Parse output like "kMDItemNumberOfPages = 664"
    let output_str = String::from_utf8_lossy(&output.stdout);
    let total_pages = output_str
        .split('=')
        .nth(1)
        .and_then(|s| s.trim().parse::<u16>().ok())
        .unwrap_or(1);

    // Use sips to get dimensions
    let output = Command::new("sips")
        .arg("-g")
        .arg("pixelWidth")
        .arg("-g")
        .arg("pixelHeight")
        .arg(&file_path)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to get PDF dimensions: {}", e),
        })?;

    let output_str = String::from_utf8_lossy(&output.stdout);
    let mut width = 612; // Default Letter width in points
    let mut height = 792; // Default Letter height in points

    for line in output_str.lines() {
        if line.contains("pixelWidth") {
            if let Some(val) = line.split(':').nth(1) {
                width = val.trim().parse().unwrap_or(width);
            }
        } else if line.contains("pixelHeight") {
            if let Some(val) = line.split(':').nth(1) {
                height = val.trim().parse().unwrap_or(height);
            }
        }
    }

    Ok(PdfPageInfo {
        width,
        height,
        total_pages,
    })
}
