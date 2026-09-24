use axum::{
    extract::{Path, State, WebSocketUpgrade},
    response::{Html, IntoResponse},
    routing::get,
    Router,
};
use axum::extract::ws::{Message, WebSocket};
use std::sync::Arc;
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use rusqlite::Connection;
use std::path::PathBuf;
use futures_util::{SinkExt, StreamExt};

#[derive(Clone)]
pub struct AppState {
    pub db_path: PathBuf,
    pub broadcast_tx: broadcast::Sender<String>,
}

#[derive(Debug)]
struct EntityData {
    name: String,
    entity_type: String,
    description: Option<String>,
    // Person fields
    birth_date: Option<String>,
    death_date: Option<String>,
    occupation: Option<String>,
    // Event fields
    event_date: Option<String>,
    location: Option<String>,
    // Place fields
    lat: Option<f64>,
    lng: Option<f64>,
    place_type: Option<String>,
    // Artifact fields
    category: Option<String>,
    date_range: Option<String>,
    owner_type: Option<String>,
    owner_name: Option<String>,
}

pub async fn start_server(db_path: PathBuf, broadcast_tx: broadcast::Sender<String>) {
    let state = AppState {
        db_path,
        broadcast_tx,
    };

    let app = Router::new()
        .route("/entity/:id", get(serve_entity_page))
        .route("/ws", get(websocket_handler))
        .with_state(Arc::new(state));

    match TcpListener::bind("127.0.0.1:3001").await {
        Ok(listener) => {
            println!("🌐 HTTP server running on http://localhost:3001");

            if let Err(e) = axum::serve(listener, app).await {
                eprintln!("HTTP server error: {}", e);
            }
        }
        Err(e) => {
            eprintln!("Failed to bind HTTP server to port 3001: {}", e);
        }
    }
}

async fn serve_entity_page(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Html<String> {
    // Query database for entity
    let conn = Connection::open(&state.db_path).expect("Failed to open database");

    // Try to find entity in each table
    let entity = find_entity(&conn, &id);

    match entity {
        Some(data) => {
            let html = generate_entity_html(&data, &id);
            Html(html)
        }
        None => Html(format!(
            r#"
            <!DOCTYPE html>
            <html>
            <head>
                <style>{}</style>
            </head>
            <body>
                <div class="error">
                    <h1>Entity Not Found</h1>
                    <p>Could not find entity with ID: {}</p>
                </div>
            </body>
            </html>
            "#,
            get_styles(),
            id
        )),
    }
}

async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| websocket_connection(socket, state))
}

async fn websocket_connection(stream: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = stream.split();
    let mut broadcast_rx = state.broadcast_tx.subscribe();

    // Spawn task to forward broadcast messages to this WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = broadcast_rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from client (currently just for keepalive)
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            match msg {
                Message::Close(_) => break,
                _ => {} // Ignore other messages for now
            }
        }
    });

    // Wait for either task to finish (client disconnect or send error)
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }
}

fn find_entity(conn: &Connection, id: &str) -> Option<EntityData> {
    // Try people table
    if let Ok(mut stmt) = conn.prepare(
        "SELECT name, description, birth_date, death_date, occupation FROM people WHERE id = ?"
    ) {
        if let Ok(data) = stmt.query_row([id], |row| {
            Ok(EntityData {
                name: row.get(0)?,
                entity_type: "person".to_string(),
                description: row.get(1).ok(),
                birth_date: row.get(2).ok(),
                death_date: row.get(3).ok(),
                occupation: row.get(4).ok(),
                event_date: None,
                location: None,
                lat: None,
                lng: None,
                place_type: None,
                category: None,
                date_range: None,
                owner_type: None,
                owner_name: None,
            })
        }) {
            return Some(data);
        }
    }

    // Try events table
    if let Ok(mut stmt) = conn.prepare(
        "SELECT name, description, event_date, location FROM events WHERE id = ?"
    ) {
        if let Ok(data) = stmt.query_row([id], |row| {
            Ok(EntityData {
                name: row.get(0)?,
                entity_type: "event".to_string(),
                description: row.get(1).ok(),
                event_date: row.get(2).ok(),
                location: row.get(3).ok(),
                birth_date: None,
                death_date: None,
                occupation: None,
                lat: None,
                lng: None,
                place_type: None,
                category: None,
                date_range: None,
                owner_type: None,
                owner_name: None,
            })
        }) {
            return Some(data);
        }
    }

    // Try theories table
    if let Ok(mut stmt) = conn.prepare(
        "SELECT name, description FROM theories WHERE id = ?"
    ) {
        if let Ok(data) = stmt.query_row([id], |row| {
            Ok(EntityData {
                name: row.get(0)?,
                entity_type: "theory".to_string(),
                description: row.get(1).ok(),
                birth_date: None,
                death_date: None,
                occupation: None,
                event_date: None,
                location: None,
                lat: None,
                lng: None,
                place_type: None,
                category: None,
                date_range: None,
                owner_type: None,
                owner_name: None,
            })
        }) {
            return Some(data);
        }
    }

    // Try places table
    if let Ok(mut stmt) = conn.prepare(
        "SELECT name, description, lat, lng, place_type FROM places WHERE id = ?"
    ) {
        if let Ok(data) = stmt.query_row([id], |row| {
            Ok(EntityData {
                name: row.get(0)?,
                entity_type: "place".to_string(),
                description: row.get(1).ok(),
                lat: row.get(2).ok(),
                lng: row.get(3).ok(),
                place_type: row.get(4).ok(),
                birth_date: None,
                death_date: None,
                occupation: None,
                event_date: None,
                location: None,
                category: None,
                date_range: None,
                owner_type: None,
                owner_name: None,
            })
        }) {
            return Some(data);
        }
    }

    // Try artifacts table
    if let Ok(mut stmt) = conn.prepare(
        "SELECT name, description, category, date_range, owner_type, owner_name FROM artifacts WHERE id = ?"
    ) {
        if let Ok(data) = stmt.query_row([id], |row| {
            Ok(EntityData {
                name: row.get(0)?,
                entity_type: "artifact".to_string(),
                description: row.get(1).ok(),
                category: row.get(2).ok(),
                date_range: row.get(3).ok(),
                owner_type: row.get(4).ok(),
                owner_name: row.get(5).ok(),
                birth_date: None,
                death_date: None,
                occupation: None,
                event_date: None,
                location: None,
                lat: None,
                lng: None,
                place_type: None,
            })
        }) {
            return Some(data);
        }
    }

    None
}

fn get_styles() -> &'static str {
    r#"
        :root {
            --bg: #0a0a0a;
            --panel: #1a1a1a;
            --panel-2: #2a2a2a;
            --text: #e0e0e0;
            --text-muted: #888;
            --accent: #667eea;
            --accent-2: #764ba2;
            --line: #333;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            padding: 24px;
            line-height: 1.6;
            min-height: 100vh;
            overflow-y: auto;
        }

        .live-indicator {
            position: absolute;
            top: 16px;
            right: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #10b981;
            font-weight: 500;
        }

        .live-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .entity-type {
            display: inline-block;
            padding: 4px 12px;
            background: var(--panel-2);
            border-radius: 4px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            margin-bottom: 16px;
        }

        .entity-type.person { border-left: 3px solid #3b82f6; }
        .entity-type.event { border-left: 3px solid #ef4444; }
        .entity-type.theory { border-left: 3px solid #eab308; }
        .entity-type.place { border-left: 3px solid #10b981; }
        .entity-type.artifact { border-left: 3px solid #8b5cf6; }

        h1 {
            font-size: 32px;
            font-weight: 600;
            margin-bottom: 8px;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .entity-icon {
            font-size: 24px;
            margin-right: 8px;
        }

        .metadata {
            margin-top: 20px;
            padding: 16px;
            background: var(--panel-2);
            border-radius: 6px;
            border: 1px solid var(--line);
        }

        .field {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
        }

        .field:last-child {
            margin-bottom: 0;
        }

        .field-label {
            color: var(--text-muted);
            font-weight: 500;
            margin-right: 8px;
        }

        .bio {
            margin-top: 24px;
            padding: 20px;
            background: var(--panel);
            border-radius: 8px;
            border-left: 3px solid var(--accent);
        }

        .error {
            text-align: center;
            padding: 60px 20px;
        }

        .error h1 {
            margin-bottom: 12px;
        }

        .error p {
            color: var(--text-muted);
        }
    "#
}

fn generate_entity_html(data: &EntityData, id: &str) -> String {
    let icon = match data.entity_type.as_str() {
        "person" => "👤",
        "event" => "📅",
        "theory" => "💡",
        "place" => "📍",
        "artifact" => "🏺",
        _ => "📄",
    };

    // Build metadata fields section
    let mut metadata_html = String::new();

    match data.entity_type.as_str() {
        "person" => {
            if let Some(birth) = &data.birth_date {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Born:</span> {}</div>", birth));
            }
            if let Some(death) = &data.death_date {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Died:</span> {}</div>", death));
            }
            if let Some(occ) = &data.occupation {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Occupation:</span> {}</div>", occ));
            }
        }
        "event" => {
            if let Some(date) = &data.event_date {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Date:</span> {}</div>", date));
            }
            if let Some(loc) = &data.location {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Location:</span> {}</div>", loc));
            }
        }
        "place" => {
            if let (Some(lat), Some(lng)) = (data.lat, data.lng) {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Coordinates:</span> {:.6}, {:.6}</div>", lat, lng));
            }
            if let Some(place_type) = &data.place_type {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Type:</span> {}</div>", place_type));
            }
        }
        "artifact" => {
            if let Some(cat) = &data.category {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Category:</span> {}</div>", cat));
            }
            if let Some(range) = &data.date_range {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Date Range:</span> {}</div>", range));
            }
            if let Some(owner_type) = &data.owner_type {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Owner Type:</span> {}</div>", owner_type));
            }
            if let Some(owner_name) = &data.owner_name {
                metadata_html.push_str(&format!("<div class=\"field\"><span class=\"field-label\">Owner:</span> {}</div>", owner_name));
            }
        }
        _ => {}
    }

    let description = data.description.as_deref().unwrap_or("No description available.");

    format!(
        r#"
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{}</title>
            <style>{}</style>
        </head>
        <body>
            <div class="live-indicator">
                <div class="live-dot"></div>
                Live
            </div>

            <div class="entity-type {}">{}</div>

            <h1>
                <span class="entity-icon">{}</span>
                {}
            </h1>

            {}

            <div class="bio">
                {}
            </div>

            <script>
                const entityId = '{}';
                console.log('Entity page loaded:', entityId);

                // Connect to WebSocket for live updates
                let ws;

                function connectWebSocket() {{
                    ws = new WebSocket('ws://localhost:3001/ws');

                    ws.onopen = () => {{
                        console.log('WebSocket connected');
                    }};

                    ws.onmessage = (event) => {{
                        try {{
                            const update = JSON.parse(event.data);

                            // Only reload if this entity was updated
                            if (update.entity_id === entityId) {{
                                console.log('Entity updated, reloading...');
                                window.location.reload();
                            }}
                        }} catch (e) {{
                            console.error('Error parsing WebSocket message:', e);
                        }}
                    }};

                    ws.onerror = (error) => {{
                        console.error('WebSocket error:', error);
                    }};

                    ws.onclose = () => {{
                        console.log('WebSocket disconnected, reconnecting in 3s...');
                        setTimeout(connectWebSocket, 3000);
                    }};
                }}

                connectWebSocket();
            </script>
        </body>
        </html>
        "#,
        data.name,
        get_styles(),
        data.entity_type,
        data.entity_type.to_uppercase(),
        icon,
        data.name,
        if metadata_html.is_empty() { String::new() } else { format!("<div class=\"metadata\">{}</div>", metadata_html) },
        description.replace('\n', "<br>"),
        id
    )
}
