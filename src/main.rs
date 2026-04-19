use profile::rocket_builder; #[rocket::main] async fn main() { let _ = rocket_builder().launch().await; }
