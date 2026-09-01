#[macro_use] extern crate rocket;
#[macro_use] extern crate lazy_static;

use rocket::response::status::NotFound;
use rocket::fs::NamedFile;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{ContentType, Header};
use rocket::{Request, Response};
use std::path::PathBuf;
use std::collections::HashMap;
use std::time::Instant;

lazy_static! {
    static ref START_TIME: Instant = Instant::now();

    // This is a static hashmap that maps the path of the request to the path of the file
    static ref VALID_PATH: HashMap<&'static str, &'static str> = {
        let mut valid_paths = HashMap::new();
        valid_paths.insert("index", "site/layouts/index.html");
        valid_paths.insert("profile", "site/layouts/profile.html");
        valid_paths.insert("anim", "site/scripts/anim.js");
        valid_paths.insert("contentPage", "site/scripts/contentPage.js");
        valid_paths.insert("profileContent", "site/scripts/profileContent.js");
        valid_paths.insert("config", "site/scripts/config.js");
        valid_paths.insert("utils", "site/scripts/utils.js");
        valid_paths.insert("ball", "site/scripts/ball.js");
        valid_paths.insert("guy", "site/scripts/guy.js");
        valid_paths.insert("audio", "site/scripts/audio.js");
        valid_paths.insert("particles", "site/scripts/particles.js");
        valid_paths.insert("terminal", "site/scripts/terminal.js");
        valid_paths.insert("haptics", "site/scripts/haptics.js");
        valid_paths.insert("bulb", "site/scripts/bulb.js");
        valid_paths.insert("style", "site/styles/style.css");
        valid_paths.insert("projects", "site/layouts/projects.html");
        valid_paths.insert("skills", "site/layouts/skills.html");
        valid_paths.insert("contact", "site/layouts/contact.html");
        valid_paths.insert("images", "site/images");
        valid_paths.insert("robots.txt", "site/layouts/robots.txt");
        valid_paths.insert("AR_Gravity_Simulator_Privacy_Policy.html", "site/layouts/AR_Gravity_Simulator_Privacy_Policy.html");
        valid_paths.insert("manifest.json", "site/layouts/manifest.json");
        valid_paths.insert("sw", "site/scripts/sw.js");
        valid_paths
    };
}

/// Fairing to attach production security headers to all responses
pub struct SecurityHeaders;

#[rocket::async_trait]
impl Fairing for SecurityHeaders {
    fn info(&self) -> Info {
        Info {
            name: "Security Headers Fairing",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, _req: &'r Request<'_>, res: &mut Response<'r>) {
        res.set_header(Header::new("X-Frame-Options", "SAMEORIGIN"));
        res.set_header(Header::new("X-Content-Type-Options", "nosniff"));
        res.set_header(Header::new("X-XSS-Protection", "1; mode=block"));
        res.set_header(Header::new("Referrer-Policy", "strict-origin-when-cross-origin"));
        res.set_header(Header::new("Permissions-Policy", "camera=(), microphone=(), geolocation=()"));
        res.set_header(Header::new("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload"));
        res.set_header(Header::new(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; manifest-src 'self'; worker-src 'self';",
        ));
    }
}

/// Basic, safe healthcheck endpoint (for Docker, uptime monitors, and reverse proxies)
#[get("/healthz")]
fn healthz() -> (ContentType, String) {
    let uptime = START_TIME.elapsed().as_secs();
    (
        ContentType::JSON,
        format!("{{\"status\":\"ok\",\"service\":\"profile\",\"uptime_seconds\":{}}}", uptime),
    )
}

/// Health alias
#[get("/health")]
fn health_alias() -> (ContentType, String) {
    healthz()
}

/// Sanitized server status & telemetry endpoint (no sensitive host internals exposed)
#[get("/api/status")]
fn api_status() -> (ContentType, String) {
    let uptime = START_TIME.elapsed().as_secs();
    (
        ContentType::JSON,
        format!(
            "{{\"status\":\"operational\",\"service\":\"profile\",\"version\":\"0.1.0\",\"uptime_seconds\":{},\"runtime\":\"Rust (Rocket 0.5)\",\"health\":\"optimal\"}}",
            uptime
        ),
    )
}

#[get("/")]
async fn root() -> Result<NamedFile, NotFound<String>> {
    NamedFile::open("site/layouts/index.html")
    .await
    .map_err(|_| NotFound("Not Found".to_string()))
}
    
#[get("/<path..>")]
async fn static_files(path: PathBuf) -> Result<NamedFile, NotFound<String>> {
    let rel_path_str = path.to_str().unwrap_or("");
    let mut rel_path = rel_path_str;
    let mut root_path: &str;
    match rel_path.split_once('/') {
        Some((key, value)) => {
            root_path = key;
            rel_path = value;
        }
        None => {
            root_path = rel_path;
            rel_path = "";
        }
    }

    // Robust matching: strip extensions if not found
    if !VALID_PATH.contains_key(root_path) {
        if let Some(stripped) = root_path.strip_suffix(".js")
            .or_else(|| root_path.strip_suffix(".css"))
            .or_else(|| root_path.strip_suffix(".json")) {
            if VALID_PATH.contains_key(stripped) {
                root_path = stripped;
            }
        }
    }

    if root_path.is_empty() || !VALID_PATH.contains_key(root_path){
        NamedFile::open("site/layouts/index.html")
        .await
        .map_err(|_| NotFound("Not Found".to_string()))
    }
    else{
        let mut real_path = PathBuf::from(VALID_PATH.get(root_path).unwrap());
        if !rel_path.is_empty() {
            real_path.push(rel_path);
        }
        NamedFile::open(real_path).await.map_err(|_| NotFound("Not Found".to_string()))    
    }
    
}

pub fn rocket_builder() -> rocket::Rocket<rocket::Build> {
    rocket::build()
        .attach(SecurityHeaders)
        .mount("/", routes![root, healthz, health_alias, api_status, static_files])
}