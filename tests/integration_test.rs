use rocket::local::asynchronous::Client;
use rocket::http::Status;
use profile::rocket_builder;

#[rocket::async_test]
async fn test_root_path() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("Ved Suthar"));
    assert!(body.contains("https://schema.org"));
    assert!(body.contains("\"@type\": \"Person\""));
    assert!(body.contains("https://veds.me/"));
    assert!(body.contains("speculationrules"));
    assert!(body.contains("og:image"));
    assert!(body.contains("summary_large_image"));
    assert!(body.contains("Grand Sim Pro"));
    assert!(body.contains("OpenInkBridge"));
    assert!(body.contains("Resim"));
    assert!(body.contains("Tech Stack"));
}

#[rocket::async_test]
async fn test_static_files() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    
    // Test static file mappings for scripts & styles
    let routes = vec!["/style", "/ball", "/guy", "/audio", "/particles", "/terminal", "/haptics", "/bulb", "/profileContent", "/config"];
    for route in routes {
        let response = client.get(route).dispatch().await;
        assert_eq!(response.status(), Status::Ok, "Failed for route {}", route);
    }

    // Test a path that should forward to index (fallback behavior in static_files)
    let response = client.get("/invalid_path_that_should_fallback").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("Ved Suthar"));
}

#[rocket::async_test]
async fn test_manifest_json() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/manifest.json").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("Ved Suthar"));
}

#[rocket::async_test]
async fn test_projects_page() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/projects").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("project-card"));
    assert!(body.contains("Grand Sim Pro"));
    assert!(body.contains("OpenInkBridge"));
    assert!(body.contains("https://goved.github.io/resim/"));
}

#[rocket::async_test]
async fn test_project_images() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    
    let response = client.get("/images/grand_sim_pro.webp").dispatch().await;
    assert_eq!(response.status(), Status::Ok);

    let response = client.get("/images/open_ink_bridge.webp").dispatch().await;
    assert_eq!(response.status(), Status::Ok);

    let response = client.get("/images/resim.webp").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
}

#[rocket::async_test]
async fn test_skills_page() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/skills").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("Tech Stack"));
}

#[rocket::async_test]
async fn test_contact_page() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/contact").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await.unwrap();
    assert!(body.contains("connect"));
}

#[rocket::async_test]
async fn test_healthz_and_telemetry() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    
    let healthz_resp = client.get("/healthz").dispatch().await;
    assert_eq!(healthz_resp.status(), Status::Ok);
    let body = healthz_resp.into_string().await.unwrap();
    assert!(body.contains("\"status\":\"ok\""));
    assert!(body.contains("\"service\":\"profile\""));
    assert!(body.contains("uptime_seconds"));

    let health_resp = client.get("/health").dispatch().await;
    assert_eq!(health_resp.status(), Status::Ok);

    let status_resp = client.get("/api/status").dispatch().await;
    assert_eq!(status_resp.status(), Status::Ok);
    let status_body = status_resp.into_string().await.unwrap();
    assert!(status_body.contains("\"status\":\"operational\""));
    assert!(status_body.contains("\"runtime\":\"Rust (Rocket 0.5)\""));
}

#[rocket::async_test]
async fn test_security_headers() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/").dispatch().await;
    assert_eq!(response.status(), Status::Ok);

    let headers = response.headers();
    assert_eq!(headers.get_one("X-Frame-Options"), Some("SAMEORIGIN"));
    assert_eq!(headers.get_one("X-Content-Type-Options"), Some("nosniff"));
    assert_eq!(headers.get_one("X-XSS-Protection"), Some("1; mode=block"));
    assert_eq!(headers.get_one("Referrer-Policy"), Some("strict-origin-when-cross-origin"));
    assert!(headers.get_one("Content-Security-Policy").is_some());
    assert!(headers.get_one("Strict-Transport-Security").is_some());
}


