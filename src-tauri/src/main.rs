// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::{Value, Error};
use tokio::net::UnixListener;
use tokio::io::AsyncReadExt;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

async fn run_socket_server(path: &str) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let _ = std::fs::remove_file(path);
    let listener = UnixListener::bind(path)?;

    loop {
        let (mut socket, _) = listener.accept().await?;

        tokio::spawn(async move {
            let mut buffer = Vec::new();
            match socket.read_to_end(&mut buffer).await {
                Ok(_) => match serde_json::from_slice::<Value>(&buffer) {
                    Ok(json) => println!("Received JSON: {:?}", json),
                    Err(e) => eprintln!("Failed to parse JSON: {:?}", e),
                },
                Err(e) => eprintln!("Failed to read from socket: {:?}", e),
            }
        });
    }
}

#[tokio::main]
async fn main() {
    let socket_server_path = "/tmp/rust-uds.potato";

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|_| {
            tokio::spawn(run_socket_server(socket_server_path));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

