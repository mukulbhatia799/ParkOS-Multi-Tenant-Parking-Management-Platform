db = db.getSiblingDB("auth-db");

db.createCollection("clients");
db.createCollection("users");
db.createCollection("refreshtokens");

db.clients.createIndex({ slug: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ clientId: 1, role: 1 });
