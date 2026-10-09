use crate::commands::{CommandError, CommandResult};
use std::process::Command;
use base64::Engine;

#[derive(serde::Serialize)]
pub struct PdfPageInfo {
    pub width: u32,
    pub height: u32,
    pub total_pages: u16,
}

/// Render a PDF page to PNG using qlmanage (macOS built-in)
#[tauri::command]
pub async fn render_pdf_page(
    file_path: String,
    page_number: u16,
    _scale: Option<f32>,
) -> CommandResult<String> {
    // First, split the PDF to extract just the page we want using Python's PyPDF2 (if available)
    // Otherwise, use qlmanage to render the whole PDF (only works for page 1)

    // For now, let's use qlmanage which renders the first page only
    // We'll need to add page extraction later

    let temp_dir = std::env::temp_dir();
    let output_dir = temp_dir.join(format!("pdf_render_{}", std::process::id()));
    std::fs::create_dir_all(&output_dir)
        .map_err(|e| CommandError {
            message: format!("Failed to create temp directory: {}", e),
        })?;

    // Use qlmanage to generate thumbnail/preview
    // -t = thumbnail mode, -s = size, -o = output dir
    let output = Command::new("qlmanage")
        .arg("-t")
        .arg("-s")
        .arg("2000") // Large size for quality
        .arg("-o")
        .arg(&output_dir)
        .arg(&file_path)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to execute qlmanage command: {}", e),
        })?;

    if !output.status.success() {
        let _ = std::fs::remove_dir_all(&output_dir);
        return Err(CommandError {
            message: format!("qlmanage command failed: {}", String::from_utf8_lossy(&output.stderr)),
        });
    }

    // qlmanage creates a file with .png extension added to the original filename
    let file_name = std::path::Path::new(&file_path)
        .file_name()
        .ok_or_else(|| CommandError {
            message: "Invalid file path".to_string(),
        })?
        .to_string_lossy();

    let png_file = output_dir.join(format!("{}.png", file_name));

    // Read the generated PNG file
    let png_bytes = std::fs::read(&png_file)
        .map_err(|e| CommandError {
            message: format!("Failed to read generated PNG (looked for {:?}): {}", png_file, e),
        })?;

    // Clean up temp directory
    let _ = std::fs::remove_dir_all(&output_dir);

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

    // Log the raw output for debugging
    eprintln!("mdls output: {}", output_str);

    let total_pages = if output_str.contains("(null)") {
        // Metadata not available, try using pdfinfo or fallback to 1
        1
    } else {
        output_str
            .split('=')
            .nth(1)
            .and_then(|s| s.trim().parse::<u16>().ok())
            .unwrap_or(1)
    };

    // Use sips to get dimensions of first page
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

    eprintln!("PDF Info: {}x{}, {} pages", width, height, total_pages);

    Ok(PdfPageInfo {
        width,
        height,
        total_pages,
    })
}
