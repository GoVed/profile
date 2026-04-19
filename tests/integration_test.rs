use rocket::local::asynchronous::Client;
use rocket::http::Status;
use profile::rocket_builder;

#[rocket::async_test]
async fn test_root_path() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    let response = client.get("/").dispatch().await;
    assert_eq!(response.status(), Status::Ok);
    let body = response.into_string().await;
    assert!(body.unwrap().contains("Ved Suthar"));
}

#[rocket::async_test]
async fn test_static_files() {
    let client = Client::tracked(rocket_builder()).await.expect("valid rocket instance");
    
    // Test a valid static file mapping (style)
    let response = client.get("/style").dispatch().await;
    assert_eq!(response.status(), Status::Ok);

    // Test a path that should forward to index (fallback behavior in static_files)
    let response = client.get("/invalid_path_that_should_fallback").dispatch().await;
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
}
