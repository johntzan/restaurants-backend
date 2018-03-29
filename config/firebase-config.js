var admin = require("firebase-admin");

var serviceAccount = require("../firebase-service.json");
serviceAccount.private_key_id = process.env.FIREBASE_PRIVATE_KEY_ID;
serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY.replace(
  /\\n/g,
  "\n"
);
serviceAccount.client_id = process.env.FIREBASE_CLIENT_ID;

module.exports = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://restaurants-app-1515723626029.firebaseio.com"
});
