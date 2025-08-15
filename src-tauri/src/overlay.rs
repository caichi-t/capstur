use tauri::{AppHandle, Manager, WebviewWindowBuilder, WebviewUrl};
use anyhow::Result;
use crate::screenshot::get_screen_dimensions;

pub async fn create_overlay_window(app_handle: &AppHandle) -> Result<()> {
    // Close existing overlay if it exists
    if let Some(existing_overlay) = app_handle.get_webview_window("overlay") {
        existing_overlay.close()?;
    }
    
    // Get screen dimensions
    let (screen_width, screen_height) = get_screen_dimensions()?;
    
    // Create the overlay window
    let overlay_window = WebviewWindowBuilder::new(
        app_handle,
        "overlay",
        WebviewUrl::App("overlay.html".into())
    )
    .title("Screen Capture Overlay")
    .inner_size(screen_width as f64, screen_height as f64)
    .position(0.0, 0.0)
    .resizable(false)
    .maximizable(false)
    .minimizable(false)
    .closable(true)
    .decorations(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .build()?;
    
    // Show the overlay window
    overlay_window.show()?;
    overlay_window.set_focus()?;
    
    Ok(())
}