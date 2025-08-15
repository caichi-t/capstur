use tauri::{AppHandle, Manager};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use uuid::Uuid;

mod screenshot;
mod image_utils;
mod overlay;

use screenshot::*;
use image_utils::*;
use overlay::create_overlay_window;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotData {
    pub id: String,
    pub timestamp: u64,
    pub base64_data: String,
    pub width: u32,
    pub height: u32,
    pub region: CaptureRegion,
}

type Screenshots = Mutex<HashMap<String, ScreenshotData>>;

#[tauri::command]
async fn start_region_capture(app_handle: AppHandle) -> Result<(), String> {
    match create_overlay_window(&app_handle).await {
        Ok(_) => Ok(()),
        Err(e) => Err(format!("Failed to start region capture: {}", e)),
    }
}

#[tauri::command]
async fn capture_region(
    app_handle: AppHandle,
    region: CaptureRegion,
) -> Result<ScreenshotData, String> {
    let screenshot = capture_screen_region(region.x, region.y, region.width, region.height)
        .map_err(|e| format!("Failed to capture region: {}", e))?;
    
    let id = Uuid::new_v4().to_string();
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();
    
    let base64_data = image_to_base64(&screenshot)?;
    
    let screenshot_data = ScreenshotData {
        id: id.clone(),
        timestamp,
        base64_data,
        width: screenshot.width(),
        height: screenshot.height(),
        region,
    };
    
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    screenshots.lock().unwrap().insert(id, screenshot_data.clone());
    
    Ok(screenshot_data)
}

#[tauri::command]
async fn get_screenshots(app_handle: AppHandle) -> Result<Vec<ScreenshotData>, String> {
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    let screenshots = screenshots.lock().unwrap();
    Ok(screenshots.values().cloned().collect())
}

#[tauri::command]
async fn delete_screenshot(app_handle: AppHandle, id: String) -> Result<(), String> {
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    let mut screenshots = screenshots.lock().unwrap();
    screenshots.remove(&id);
    Ok(())
}

#[tauri::command]
async fn compose_screenshots(
    app_handle: AppHandle,
    screenshot_ids: Vec<String>,
    layout: String,
) -> Result<String, String> {
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    let screenshots = screenshots.lock().unwrap();
    
    let images: Vec<_> = screenshot_ids
        .iter()
        .filter_map(|id| screenshots.get(id))
        .collect();
    
    if images.is_empty() {
        return Err("No screenshots selected".to_string());
    }
    
    let composed_image = compose_images(images, &layout)?;
    let base64_data = image_to_base64(&composed_image)?;
    
    Ok(base64_data)
}

#[tauri::command]
async fn close_overlay_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(overlay_window) = app_handle.get_webview_window("overlay") {
        overlay_window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(Screenshots::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            start_region_capture,
            capture_region,
            get_screenshots,
            delete_screenshot,
            compose_screenshots,
            close_overlay_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
