use crate::commands::{CommandError, CommandResult};
use std::process::Command;
use base64::Engine;
use lopdf::Document;

#[derive(serde::Serialize)]
pub struct PdfPageInfo {
    pub width: u32,
    pub height: u32,
    pub total_pages: u16,
}

/// Render a PDF page to PNG using pdftoppm (from poppler-utils)
#[tauri::command]
pub async fn render_pdf_page(
    file_path: String,
    page_number: u16,
    scale: Option<f32>,
) -> CommandResult<String> {
    let scale = scale.unwrap_or(2.0);
    let dpi = (72.0 * scale) as u32; // Convert scale to DPI (72 = default PDF DPI)

    let temp_dir = std::env::temp_dir();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    let output_prefix = temp_dir.join(format!("pdf_page_{}_{}", std::process::id(), timestamp));

    eprintln!("Rendering page {} of {} at {} DPI", page_number, file_path, dpi);
    eprintln!("Output prefix: {:?}", output_prefix);

    // Use pdftoppm to render a specific page
    // -f = first page, -l = last page (same number = single page)
    // -png = output format
    // -r = resolution in DPI
    let output = Command::new("pdftoppm")
        .arg("-f")
        .arg(page_number.to_string())
        .arg("-l")
        .arg(page_number.to_string())
        .arg("-png")
        .arg("-r")
        .arg(dpi.to_string())
        .arg(&file_path)
        .arg(&output_prefix)
        .output()
        .map_err(|e| CommandError {
            message: format!("Failed to execute pdftoppm (is poppler installed? try: brew install poppler): {}", e),
        })?;

    eprintln!("pdftoppm exit status: {}", output.status);
    eprintln!("pdftoppm stdout: {}", String::from_utf8_lossy(&output.stdout));
    eprintln!("pdftoppm stderr: {}", String::from_utf8_lossy(&output.stderr));

    if !output.status.success() {
        return Err(CommandError {
            message: format!(
                "pdftoppm failed with status {}: stdout: {} stderr: {}",
                output.status,
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            ),
        });
    }

    // pdftoppm creates files with format: prefix-NNN.png where NNN is zero-padded page number
    // For single-page extraction, it always creates -001.png regardless of which page was extracted
    let png_file = format!("{}-001.png", output_prefix.to_string_lossy());

    eprintln!("Looking for PNG file: {}", png_file);

    // Check what files were actually created in temp dir
    if let Ok(entries) = std::fs::read_dir(&temp_dir) {
        let temp_files: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.path().to_string_lossy().contains("pdf_page"))
            .collect();
        eprintln!("Files in temp dir matching 'pdf_page': {:?}", temp_files.iter().map(|e| e.path()).collect::<Vec<_>>());
    }

    // Read the generated PNG file
    let png_bytes = std::fs::read(&png_file)
        .map_err(|e| CommandError {
            message: format!("Failed to read generated PNG {}: {}", png_file, e),
        })?;

    // Clean up temp file
    let _ = std::fs::remove_file(&png_file);

    // Encode to base64
    let base64_image = base64::engine::general_purpose::STANDARD.encode(&png_bytes);

    eprintln!("Successfully rendered page {}", page_number);

    Ok(base64_image)
}

/// Get PDF metadata using lopdf (pure Rust)
#[tauri::command]
pub async fn get_pdf_info(file_path: String) -> CommandResult<PdfPageInfo> {
    // Use lopdf to directly read the PDF and get page count
    let document = Document::load(&file_path)
        .map_err(|e| CommandError {
            message: format!("Failed to load PDF: {}", e),
        })?;

    let total_pages = document.get_pages().len() as u16;
    eprintln!("PDF has {} pages (detected by lopdf)", total_pages);

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
