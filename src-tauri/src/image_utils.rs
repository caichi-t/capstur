use anyhow::Result;
use image::{DynamicImage, ImageFormat, RgbaImage, GenericImageView};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose};
use crate::ScreenshotData;

pub fn image_to_base64(image: &DynamicImage) -> Result<String, String> {
    let mut buffer = Vec::new();
    let mut cursor = Cursor::new(&mut buffer);
    
    image
        .write_to(&mut cursor, ImageFormat::Png)
        .map_err(|e| format!("Failed to encode image: {}", e))?;
    
    let base64_string = general_purpose::STANDARD.encode(&buffer);
    Ok(format!("data:image/png;base64,{}", base64_string))
}

pub fn base64_to_image(base64_data: &str) -> Result<DynamicImage, String> {
    // Remove the data URL prefix if present
    let base64_content = if base64_data.starts_with("data:image/") {
        base64_data
            .split(',')
            .nth(1)
            .ok_or("Invalid base64 data URL")?
    } else {
        base64_data
    };
    
    let decoded = general_purpose::STANDARD
        .decode(base64_content)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;
    
    let image = image::load_from_memory(&decoded)
        .map_err(|e| format!("Failed to load image: {}", e))?;
    
    Ok(image)
}

pub fn compose_images(images: Vec<&ScreenshotData>, layout: &str) -> Result<DynamicImage, String> {
    if images.is_empty() {
        return Err("No images to compose".to_string());
    }
    
    // Convert base64 images to DynamicImage
    let mut dynamic_images = Vec::new();
    for screenshot in &images {
        let img = base64_to_image(&screenshot.base64_data)?;
        dynamic_images.push(img);
    }
    
    match layout {
        "horizontal" => compose_horizontal(dynamic_images),
        "vertical" => compose_vertical(dynamic_images),
        "grid" => compose_grid(dynamic_images),
        _ => Err(format!("Unsupported layout: {}", layout)),
    }
}

fn compose_horizontal(images: Vec<DynamicImage>) -> Result<DynamicImage, String> {
    if images.is_empty() {
        return Err("No images provided".to_string());
    }
    
    let total_width: u32 = images.iter().map(|img| img.width()).sum();
    let max_height = images.iter().map(|img| img.height()).max().unwrap_or(0);
    
    let mut result = RgbaImage::new(total_width, max_height);
    let mut x_offset = 0;
    
    for image in images {
        let rgba_image = image.to_rgba8();
        for (x, y, pixel) in rgba_image.enumerate_pixels() {
            if x_offset + x < total_width && y < max_height {
                result.put_pixel(x_offset + x, y, *pixel);
            }
        }
        x_offset += image.width();
    }
    
    Ok(DynamicImage::ImageRgba8(result))
}

fn compose_vertical(images: Vec<DynamicImage>) -> Result<DynamicImage, String> {
    if images.is_empty() {
        return Err("No images provided".to_string());
    }
    
    let max_width = images.iter().map(|img| img.width()).max().unwrap_or(0);
    let total_height: u32 = images.iter().map(|img| img.height()).sum();
    
    let mut result = RgbaImage::new(max_width, total_height);
    let mut y_offset = 0;
    
    for image in images {
        let rgba_image = image.to_rgba8();
        for (x, y, pixel) in rgba_image.enumerate_pixels() {
            if x < max_width && y_offset + y < total_height {
                result.put_pixel(x, y_offset + y, *pixel);
            }
        }
        y_offset += image.height();
    }
    
    Ok(DynamicImage::ImageRgba8(result))
}

fn compose_grid(images: Vec<DynamicImage>) -> Result<DynamicImage, String> {
    if images.is_empty() {
        return Err("No images provided".to_string());
    }
    
    // Calculate grid dimensions
    let num_images = images.len();
    let cols = (num_images as f64).sqrt().ceil() as usize;
    let rows = (num_images + cols - 1) / cols;
    
    // Find the maximum dimensions for consistent sizing
    let max_width = images.iter().map(|img| img.width()).max().unwrap_or(0);
    let max_height = images.iter().map(|img| img.height()).max().unwrap_or(0);
    
    let total_width = (max_width * cols as u32) as u32;
    let total_height = (max_height * rows as u32) as u32;
    
    let mut result = RgbaImage::new(total_width, total_height);
    
    for (i, image) in images.iter().enumerate() {
        let col = i % cols;
        let row = i / cols;
        let x_offset = col as u32 * max_width;
        let y_offset = row as u32 * max_height;
        
        let rgba_image = image.to_rgba8();
        for (x, y, pixel) in rgba_image.enumerate_pixels() {
            if x_offset + x < total_width && y_offset + y < total_height {
                result.put_pixel(x_offset + x, y_offset + y, *pixel);
            }
        }
    }
    
    Ok(DynamicImage::ImageRgba8(result))
}

pub fn resize_image(image: &DynamicImage, max_width: u32, max_height: u32) -> DynamicImage {
    let (width, height) = image.dimensions();
    
    if width <= max_width && height <= max_height {
        return image.clone();
    }
    
    let width_ratio = max_width as f32 / width as f32;
    let height_ratio = max_height as f32 / height as f32;
    let scale_ratio = width_ratio.min(height_ratio);
    
    let new_width = (width as f32 * scale_ratio) as u32;
    let new_height = (height as f32 * scale_ratio) as u32;
    
    image.resize(new_width, new_height, image::imageops::FilterType::Lanczos3)
}