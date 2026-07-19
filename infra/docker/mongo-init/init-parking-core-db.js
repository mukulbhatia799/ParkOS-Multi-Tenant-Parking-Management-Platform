db = db.getSiblingDB("parking-core-db");

db.createCollection("parkinglots");
db.createCollection("parkingzones");
db.createCollection("parkingslots");

db.parkinglots.createIndex({ clientId: 1, _id: 1 });
db.parkingzones.createIndex({ clientId: 1, lotId: 1 });
db.parkingzones.createIndex({ clientId: 1, lotId: 1, type: 1 });
db.parkingslots.createIndex({ clientId: 1, lotId: 1, status: 1 });
db.parkingslots.createIndex({ clientId: 1, lotId: 1, slotNumber: 1 }, { unique: true });
