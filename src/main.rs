#[macro_use] extern crate rocket;
#[macro_use] extern crate lazy_static;
use rocket::response::status::NotFound;
use rocket::fs::NamedFile;
use std::path::PathBuf;
use std::collections::HashMap;

// This is a static hashmap that maps the path of the request to the path of the file
lazy_static! {
    static ref VALID_PATH: HashMap<&'static str, &'static str> = {
        let mut valid_paths = HashMap::new();
        valid_paths.insert("index", "site/layouts/index.html");
        valid_paths.insert("profile", "site/layouts/profile.html");
        valid_paths.insert("anim", "site/scripts/anim.js");
        valid_paths.insert("contentPage", "site/scripts/contentPage.js");
        valid_paths.insert("profileContent", "site/scripts/profileContent.js");
        valid_paths.insert("style", "site/styles/style.css");
        valid_paths
    };
}

#[get("/")]
async fn root() -> Result<NamedFile, NotFound<String>> {
    NamedFile::open("site/layouts/index.html")
    .await
    .map_err(|e| NotFound(e.to_string()))
}
    
#[get("/<path..>")]
async fn static_files(path: PathBuf) -> Result<NamedFile, NotFound<String>> {
    if path.to_str().is_none() || !VALID_PATH.contains_key(path.to_str().unwrap()){
        NamedFile::open("site/layouts/index.html")
        .await
        .map_err(|e| NotFound(e.to_string()))
    }
    else{
        let rpath = PathBuf::from(VALID_PATH.get(path.to_str().unwrap()).unwrap());
        NamedFile::open(rpath).await.map_err(|e| NotFound(e.to_string()))    
    }
    
}

#[launch]
fn rocket() -> _ {   
    rocket::build().mount("/", routes![root,static_files])
}