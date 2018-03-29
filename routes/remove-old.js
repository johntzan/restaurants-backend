var request = require("request");
var Promise = require("promise");
var admin = require("../config/firebase-config");

let db = admin.firestore();
let reportsDoc = db.collection("reports");

const today = new Date();
const thirtyDaysAgoDate = new Date().setDate(today.getDate() - 30);

function removeOld() {
  reportsDoc
    .where("timeOfReport", "<=", thirtyDaysAgoDate)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        console.log("Deleting: ", doc.id);
        reportsDoc.doc(doc.id).delete();
      });
    })
    .catch(error => {
      console.log(
        "Error getting reports by timeOfReport for deleting: ",
        error
      );
    });

  console.log("FINISHED REMOVING OLD");
}

module.exports.remove = removeOld;
