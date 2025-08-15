use tauri::{AppHandle, Manager, Emitter};
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
    println!("Received capture_region command: {:?}", region);
    
    let screenshot = capture_screen_region(region.x, region.y, region.width, region.height)
        .map_err(|e| {
            let error_msg = format!("Failed to capture region: {}", e);
            println!("Capture error: {}", error_msg);
            error_msg
        })?;
    
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
    screenshots.lock().unwrap().insert(id.clone(), screenshot_data.clone());
    println!("Stored screenshot with ID: {}", id);
    
    // Notify the main window that a new screenshot was captured
    if let Some(main_window) = app_handle.get_webview_window("main") {
        println!("Emitting screenshot-captured event to main window");
        match main_window.emit("screenshot-captured", &screenshot_data) {
            Ok(_) => println!("Event emitted successfully"),
            Err(e) => println!("Failed to emit event: {}", e),
        }
    } else {
        println!("Main window not found!");
    }
    
    println!("Returning screenshot data: {}", screenshot_data.id);
    Ok(screenshot_data)
}

#[tauri::command]
async fn get_screenshots(app_handle: AppHandle) -> Result<Vec<ScreenshotData>, String> {
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    let screenshots = screenshots.lock().unwrap();
    let result: Vec<ScreenshotData> = screenshots.values().cloned().collect();
    println!("get_screenshots returning {} items", result.len());
    Ok(result)
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
    println!("Starting image composition...");
    println!("Selected screenshot IDs: {:?}", screenshot_ids);
    println!("Layout: {}", layout);
    
    let screenshots: tauri::State<Screenshots> = app_handle.state();
    let screenshots = screenshots.lock().unwrap();
    
    println!("Total screenshots in storage: {}", screenshots.len());
    
    let images: Vec<_> = screenshot_ids
        .iter()
        .filter_map(|id| {
            if let Some(screenshot) = screenshots.get(id) {
                println!("Found screenshot: {} ({}x{})", id, screenshot.width, screenshot.height);
                Some(screenshot)
            } else {
                println!("Screenshot not found: {}", id);
                None
            }
        })
        .collect();
    
    if images.is_empty() {
        let error_msg = format!("No screenshots found for composition. Selected IDs: {:?}, Available IDs: {:?}", 
                               screenshot_ids, screenshots.keys().collect::<Vec<_>>());
        println!("{}", error_msg);
        return Err(error_msg);
    }
    
    println!("Composing {} images with layout: {}", images.len(), layout);
    
    match compose_images(images, &layout) {
        Ok(composed_image) => {
            println!("Image composition successful: {}x{}", composed_image.width(), composed_image.height());
            
            match image_to_base64(&composed_image) {
                Ok(base64_data) => {
                    println!("Base64 conversion successful, length: {}", base64_data.len());
                    Ok(base64_data)
                }
                Err(e) => {
                    let error_msg = format!("Failed to convert composed image to base64: {}", e);
                    println!("{}", error_msg);
                    Err(error_msg)
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Image composition failed: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
async fn hide_overlay_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(overlay_window) = app_handle.get_webview_window("overlay") {
        overlay_window.hide().map_err(|e| e.to_string())?;
        println!("Overlay window hidden");
    }
    Ok(())
}

#[tauri::command]
async fn show_overlay_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(overlay_window) = app_handle.get_webview_window("overlay") {
        overlay_window.show().map_err(|e| e.to_string())?;
        println!("Overlay window shown");
    }
    Ok(())
}

#[tauri::command]
async fn close_overlay_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(overlay_window) = app_handle.get_webview_window("overlay") {
        overlay_window.close().map_err(|e| e.to_string())?;
        println!("Overlay window closed");
    }
    Ok(())
}

#[tauri::command]
async fn test_screen_capture() -> Result<String, String> {
    println!("Testing basic screen capture...");
    
    match capture_full_screen() {
        Ok(_image) => {
            println!("Full screen capture successful!");
            Ok("Screen capture test successful".to_string())
        }
        Err(e) => {
            let error_msg = format!("Screen capture test failed: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[tauri::command]
async fn test_region_capture(app_handle: AppHandle) -> Result<String, String> {
    println!("Testing region capture with fixed coordinates...");
    
    // Test with a small fixed region (100x100 at position 100,100)
    let test_region = CaptureRegion {
        x: 100,
        y: 100,
        width: 200,
        height: 200,
    };
    
    match capture_region(app_handle, test_region).await {
        Ok(screenshot_data) => {
            let msg = format!("Region capture test successful! Screenshot ID: {}", screenshot_data.id);
            println!("{}", msg);
            Ok(msg)
        }
        Err(e) => {
            let error_msg = format!("Region capture test failed: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
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
            test_screen_capture,
            test_region_capture,
            start_region_capture,
            capture_region,
            get_screenshots,
            delete_screenshot,
            compose_screenshots,
            hide_overlay_window,
            show_overlay_window,
            close_overlay_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
