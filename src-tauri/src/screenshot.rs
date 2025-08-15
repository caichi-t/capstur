use anyhow::Result;
use image::DynamicImage;
use xcap::Monitor;

pub fn capture_screen_region(x: i32, y: i32, width: u32, height: u32) -> Result<DynamicImage> {
    // Get the primary monitor
    let monitors = Monitor::all()?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .ok_or_else(|| anyhow::anyhow!("No primary monitor found"))?;

    // Ensure coordinates are non-negative
    let x_pos = x.max(0) as u32;
    let y_pos = y.max(0) as u32;

    // Capture the specified region
    let image = monitor.capture_region(x_pos, y_pos, width, height)?;
    Ok(DynamicImage::ImageRgba8(image))
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

    Ok((monitor.width()? as u32, monitor.height()? as u32))
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