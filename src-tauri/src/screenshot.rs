use anyhow::Result;
use image::{DynamicImage, ImageBuffer, Rgba};
use xcap::Monitor;

pub fn capture_screen_region(x: i32, y: i32, width: u32, height: u32) -> Result<DynamicImage> {
    println!("Starting capture_screen_region: x={}, y={}, width={}, height={}", x, y, width, height);
    
    // Get the primary monitor
    let monitors = Monitor::all()?;
    println!("Found {} monitors", monitors.len());
    
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or_else(|| anyhow::anyhow!("No primary monitor found"))?;

    let monitor_width = monitor.width()?;
    let monitor_height = monitor.height()?;
    println!("Using primary monitor: {}x{}", monitor_width, monitor_height);

    // Ensure coordinates are non-negative and within bounds
    let x_pos = (x.max(0) as u32).min(monitor_width as u32);
    let y_pos = (y.max(0) as u32).min(monitor_height as u32);
    
    // Ensure width and height don't exceed monitor bounds
    let adjusted_width = width.min((monitor_width as u32).saturating_sub(x_pos));
    let adjusted_height = height.min((monitor_height as u32).saturating_sub(y_pos));

    println!("Adjusted coordinates: x_pos={}, y_pos={}, width={}, height={}", 
             x_pos, y_pos, adjusted_width, adjusted_height);

    // Validate minimum size
    if adjusted_width < 1 || adjusted_height < 1 {
        return Err(anyhow::anyhow!("Invalid capture region size: {}x{}", adjusted_width, adjusted_height));
    }

    // Try region capture first, fall back to full screen if needed
    println!("Attempting to capture region...");
    match monitor.capture_region(x_pos, y_pos, adjusted_width, adjusted_height) {
        Ok(image) => {
            println!("Successfully captured region: {}x{}", image.width(), image.height());
            Ok(DynamicImage::ImageRgba8(image))
        },
        Err(e) => {
            println!("Region capture failed: {}, trying full screen capture...", e);
            // Fallback to full screen and crop
            let full_image = monitor.capture_image()?;
            println!("Full screen captured: {}x{}", full_image.width(), full_image.height());
            
            // Convert to DynamicImage first for cropping
            let dynamic_full = DynamicImage::ImageRgba8(full_image);
            let cropped = dynamic_full.crop_imm(x_pos, y_pos, adjusted_width, adjusted_height);
            println!("Cropped to: {}x{}", cropped.width(), cropped.height());
            
            Ok(cropped)
        }
    }
}

pub fn capture_full_screen() -> Result<DynamicImage> {
    let monitors = Monitor::all()?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or_else(|| anyhow::anyhow!("No primary monitor found"))?;

    let image = monitor.capture_image()?;
    Ok(DynamicImage::ImageRgba8(image))
}

pub fn get_screen_dimensions() -> Result<(u32, u32)> {
    let monitors = Monitor::all()?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or_else(|| anyhow::anyhow!("No primary monitor found"))?;

    let width = monitor.width()? as u32;
    let height = monitor.height()? as u32;
    println!("Screen dimensions: {}x{}", width, height);
    
    Ok((width, height))
}

pub fn get_all_monitors() -> Result<Vec<(String, u32, u32, i32, i32)>> {
    let monitors = Monitor::all()?;
    let mut result = Vec::new();
    
    for monitor in monitors {
        let name = monitor.name().unwrap_or_else(|_| "Unknown".to_string());
        let width = monitor.width().unwrap_or(0) as u32;
        let height = monitor.height().unwrap_or(0) as u32;
        let x = monitor.x().unwrap_or(0);
        let y = monitor.y().unwrap_or(0);
        
        result.push((name, width, height, x, y));
    }
    
    Ok(result)
}