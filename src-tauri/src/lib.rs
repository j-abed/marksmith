use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, RunEvent, State};

struct OpenedUrls(Mutex<Vec<String>>);

fn collect_startup_files() -> Vec<String> {
    document_paths_from_args(std::env::args().skip(1))
}

fn document_paths_from_args<I>(args: I) -> Vec<String>
where
    I: IntoIterator,
    I::Item: AsRef<str>,
{
    args.into_iter()
        .filter_map(|arg| normalize_open_path(arg.as_ref()))
        .collect()
}

fn normalize_open_path(arg: &str) -> Option<String> {
    if arg.starts_with("file://") {
        let path = arg.trim_start_matches("file://");
        let path = path.strip_prefix("//").unwrap_or(path);
        let decoded = percent_encoding::percent_decode_str(path)
            .decode_utf8()
            .ok()?
            .into_owned();
        return is_document_path(&decoded).then_some(decoded);
    }

    is_document_path(arg).then(|| arg.to_string())
}

fn url_to_document_path(url: &url::Url) -> Option<String> {
    if url.scheme() == "file" {
        let path = url.to_file_path().ok()?.to_string_lossy().into_owned();
        return is_document_path(&path).then_some(path);
    }

    normalize_open_path(url.as_str())
}

fn urls_to_document_paths(urls: &[url::Url]) -> Vec<String> {
    urls.iter().filter_map(url_to_document_path).collect()
}

fn is_document_path(path: &str) -> bool {
    if path.starts_with('-') {
        return false;
    }
    let lower = path.to_lowercase();
    lower.ends_with(".md")
        || lower.ends_with(".markdown")
        || lower.ends_with(".txt")
        || lower.ends_with(".html")
        || lower.ends_with(".htm")
}

fn store_open_files(state: &OpenedUrls, files: Vec<String>) {
    if files.is_empty() {
        return;
    }

    let mut stored = state.0.lock().expect("opened urls lock");
    for path in files {
        if !stored.contains(&path) {
            stored.push(path);
        }
    }
}

fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

fn emit_open_files_if_ready(app: &AppHandle, files: Vec<String>) {
    if files.is_empty() || app.get_webview_window("main").is_none() {
        return;
    }

    let _ = app.emit("open-files", files);
}

fn handle_opened_urls(app: &AppHandle, state: &OpenedUrls, urls: Vec<url::Url>) {
    let files = urls_to_document_paths(&urls);
    if files.is_empty() {
        return;
    }

    store_open_files(state, files.clone());
    focus_main_window(app);
    emit_open_files_if_ready(app, files);
}

#[tauri::command]
fn pending_open_files(state: State<'_, OpenedUrls>) -> Vec<String> {
    state.0.lock().expect("opened urls lock").clone()
}

#[tauri::command]
fn clear_pending_open_files(state: State<'_, OpenedUrls>) {
    state.0.lock().expect("opened urls lock").clear();
}

fn flush_pending_open_files(app: &AppHandle) {
    let state = app.state::<OpenedUrls>();
    let files = state.0.lock().expect("opened urls lock").clone();
    emit_open_files_if_ready(app, files);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let startup_files = collect_startup_files();

    let builder = tauri::Builder::default()
        .manage(OpenedUrls(Mutex::new(Vec::new())));

    #[cfg(not(target_os = "macos"))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        focus_main_window(app);
        let files = document_paths_from_args(args);
        if files.is_empty() {
            return;
        }

        let state = app.state::<OpenedUrls>();
        store_open_files(&state, files.clone());
        emit_open_files_if_ready(app, files);
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Info
                } else {
                    log::LevelFilter::Warn
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            pending_open_files,
            clear_pending_open_files
        ])
        .setup(move |app| {
            if !startup_files.is_empty() {
                let state = app.state::<OpenedUrls>();
                store_open_files(&state, startup_files);
            }
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            match event {
                RunEvent::Ready => flush_pending_open_files(app),
                RunEvent::Opened { urls } => {
                    let state = app.state::<OpenedUrls>();
                    handle_opened_urls(app, &state, urls);
                }
                _ => {}
            }
        });
}

#[cfg(test)]
mod tests {
    use super::{
        document_paths_from_args, is_document_path, normalize_open_path, url_to_document_path,
    };

    #[test]
    fn accepts_document_extensions() {
        assert!(is_document_path("/Users/me/notes.md"));
        assert!(is_document_path("draft.markdown"));
        assert!(!is_document_path("-psn_0_12345"));
        assert!(!is_document_path("--flag"));
    }

    #[test]
    fn filters_args_to_documents_only() {
        let files = document_paths_from_args([
            "-psn_0_123",
            "/Users/me/one.md",
            "/Users/me/readme.txt",
        ]);
        assert_eq!(files, vec!["/Users/me/one.md", "/Users/me/readme.txt"]);
    }

    #[test]
    fn parses_file_urls() {
        let url = url::Url::parse("file:///Users/me/notes.md").expect("url");
        assert_eq!(
            url_to_document_path(&url),
            Some("/Users/me/notes.md".to_string())
        );
    }

    #[test]
    fn parses_percent_encoded_file_urls() {
        let path = normalize_open_path("file:///Users/me/My%20Notes.md");
        assert_eq!(path, Some("/Users/me/My Notes.md".to_string()));
    }
}
