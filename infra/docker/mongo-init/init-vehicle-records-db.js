db = db.getSiblingDB("vehicle-records-db");

db.createCollection("vehicles");
db.createCollection("parkingrecords");

db.vehicles.createIndex({ clientId: 1, licensePlate: 1 }, { unique: true });
db.parkingrecords.createIndex({ clientId: 1, status: 1 });
db.parkingrecords.createIndex({ clientId: 1, slotId: 1 });
db.parkingrecords.createIndex({ clientId: 1, vehicleId: 1 });
