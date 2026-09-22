use std::path::PathBuf;
use std::fs;

pub struct AppStorage {
    pub root_dir: PathBuf,
}

impl AppStorage {
    pub fn new(app_data_dir: PathBuf) -> Result<Self, std::io::Error> {
        let storage_dir = app_data_dir.join("storage");

        // Create storage directories
        fs::create_dir_all(&storage_dir)?;
        fs::create_dir_all(storage_dir.join("artifacts"))?;
        fs::create_dir_all(storage_dir.join("sources"))?;
        fs::create_dir_all(storage_dir.join("map-overlays"))?;
        fs::create_dir_all(storage_dir.join("entity-pages"))?;

        Ok(Self {
            root_dir: storage_dir,
        })
    }

    /// Get the path for artifacts bucket
    pub fn artifacts_dir(&self) -> PathBuf {
        self.root_dir.join("artifacts")
    }

    /// Get the path for sources bucket (PDFs)
    pub fn sources_dir(&self) -> PathBuf {
        self.root_dir.join("sources")
    }

    /// Get the path for map overlays bucket
    pub fn map_overlays_dir(&self) -> PathBuf {
        self.root_dir.join("map-overlays")
    }

    /// Get the path for entity pages bucket
    pub fn entity_pages_dir(&self) -> PathBuf {
        self.root_dir.join("entity-pages")
    }

    /// Store a file in a bucket and return the storage path
    pub fn store_file(
        &self,
        bucket: &str,
        file_path: &str,
        data: &[u8],
    ) -> Result<String, std::io::Error> {
        let bucket_dir = match bucket {
            "artifacts" => self.artifacts_dir(),
            "sources" => self.sources_dir(),
            "map-overlays" => self.map_overlays_dir(),
            "entity-pages" => self.entity_pages_dir(),
            _ => return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Invalid bucket name",
            )),
        };

        let full_path = bucket_dir.join(file_path);

        // Create parent directories if needed
        if let Some(parent) = full_path.parent() {
            fs::create_dir_all(parent)?;
        }

        fs::write(&full_path, data)?;

        Ok(file_path.to_string())
    }

    /// Read a file from a bucket
    pub fn read_file(&self, bucket: &str, file_path: &str) -> Result<Vec<u8>, std::io::Error> {
        let bucket_dir = match bucket {
            "artifacts" => self.artifacts_dir(),
            "sources" => self.sources_dir(),
            "map-overlays" => self.map_overlays_dir(),
            "entity-pages" => self.entity_pages_dir(),
            _ => return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Invalid bucket name",
            )),
        };

        let full_path = bucket_dir.join(file_path);
        fs::read(&full_path)
    }

    /// Delete a file from a bucket
    pub fn delete_file(&self, bucket: &str, file_path: &str) -> Result<(), std::io::Error> {
        let bucket_dir = match bucket {
            "artifacts" => self.artifacts_dir(),
            "sources" => self.sources_dir(),
            "map-overlays" => self.map_overlays_dir(),
            "entity-pages" => self.entity_pages_dir(),
            _ => return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "Invalid bucket name",
            )),
        };

        let full_path = bucket_dir.join(file_path);
        fs::remove_file(&full_path)
    }

    /// Get the full file system path for a stored file
    pub fn get_file_path(&self, bucket: &str, file_path: &str) -> PathBuf {
        let bucket_dir = match bucket {
            "artifacts" => self.artifacts_dir(),
            "sources" => self.sources_dir(),
            "map-overlays" => self.map_overlays_dir(),
            "entity-pages" => self.entity_pages_dir(),
            _ => panic!("Invalid bucket name"),
        };

        bucket_dir.join(file_path)
    }
}
