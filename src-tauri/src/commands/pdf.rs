use crate::commands::{CommandError, CommandResult};
use pdfium_render::prelude::*;
use image::ImageEncoder;
use base64::Engine;

#[derive(serde::Serialize)]
pub struct PdfPageInfo {
    pub width: u32,
    pub height: u32,
    pub total_pages: u16,
}

/// Render a PDF page to PNG and return as base64
#[tauri::command]
pub async fn render_pdf_page(
    file_path: String,
    page_number: u16,
    scale: Option<f32>,
) -> CommandResult<String> {
    let scale = scale.unwrap_or(2.0); // 2x scale for better quality

    // Initialize Pdfium (this is fast enough to do per-request)
    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./"))
            .or_else(|_| Pdfium::bind_to_system_library())
            .map_err(|e| CommandError {
                message: format!("Failed to initialize Pdfium: {}", e),
            })?,
    );

    // Load the PDF document
    let document = pdfium
        .load_pdf_from_file(&file_path, None)
        .map_err(|e| CommandError {
            message: format!("Failed to load PDF: {}", e),
        })?;

    // Check page number is valid (pdfium uses 0-based indexing)
    let page_index = page_number.saturating_sub(1);
    let page_count = document.pages().len() as usize;
    if (page_index as usize) >= page_count {
        return Err(CommandError {
            message: format!("Page {} out of range (total pages: {})", page_number, page_count),
        });
    }

    // Get the page
    let page = document.pages().get(page_index)
        .map_err(|e| CommandError {
            message: format!("Failed to get page {}: {}", page_number, e),
        })?;

    // Render the page to a bitmap
    let render_config = PdfRenderConfig::new()
        .set_target_width((page.width().value * scale) as i32)
        .set_maximum_height((page.height().value * scale) as i32)
        .rotate_if_landscape(PdfPageRenderRotation::None, false);

    let bitmap = page
        .render_with_config(&render_config)
        .map_err(|e| CommandError {
            message: format!("Failed to render page: {}", e),
        })?;

    // Convert bitmap to image::DynamicImage
    let dynamic_image = bitmap.as_image();

    // Encode as PNG
    let mut png_bytes = Vec::new();
    image::codecs::png::PngEncoder::new(&mut png_bytes)
        .write_image(
            dynamic_image.as_bytes(),
            dynamic_image.width(),
            dynamic_image.height(),
            dynamic_image.color().into(),
        )
        .map_err(|e| CommandError {
            message: format!("Failed to encode PNG: {}", e),
        })?;

    // Encode to base64
    let base64_image = base64::engine::general_purpose::STANDARD.encode(&png_bytes);

    Ok(base64_image)
}

/// Get PDF metadata (page count, dimensions)
#[tauri::command]
pub async fn get_pdf_info(file_path: String) -> CommandResult<PdfPageInfo> {
    // Initialize Pdfium
    let pdfium = Pdfium::new(
        Pdfium::bind_to_library(Pdfium::pdfium_platform_library_name_at_path("./"))
            .or_else(|_| Pdfium::bind_to_system_library())
            .map_err(|e| CommandError {
                message: format!("Failed to initialize Pdfium: {}", e),
            })?,
    );

    let document = pdfium
        .load_pdf_from_file(&file_path, None)
        .map_err(|e| CommandError {
            message: format!("Failed to load PDF: {}", e),
        })?;

    let total_pages = document.pages().len() as u16;

    // Get first page dimensions as default
    let first_page = document.pages().get(0)
        .map_err(|e| CommandError {
            message: format!("Failed to get first page: {}", e),
        })?;

    Ok(PdfPageInfo {
        width: first_page.width().value as u32,
        height: first_page.height().value as u32,
        total_pages,
    })
}
