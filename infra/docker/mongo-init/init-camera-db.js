db = db.getSiblingDB("camera-db");

db.createCollection("cameras");
db.createCollection("detectionlogs");

db.cameras.createIndex({ clientId: 1, lotId: 1 });
db.detectionlogs.createIndex({ clientId: 1, cameraId: 1 });
db.detectionlogs.createIndex({ clientId: 1, createdAt: 1 });
