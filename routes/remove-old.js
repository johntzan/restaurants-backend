var request = require("request");
var Promise = require("promise");
var admin = require("../config/firebase-config");

let db = admin.firestore();
let reportsDoc = db.collection("reports");

let reportsHistoryDoc = db.collection("reports_history");

const today = new Date();
const thirtyDaysAgoDate = new Date().setDate(today.getDate() - 30);

async function removeOld() {
  reportsDoc
    .where("timeOfReport", "<=", thirtyDaysAgoDate)
    .get()
    .then(querySnapshot => {
      querySnapshot.forEach(doc => {
        await moveDoc(doc.data());
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

function moveDoc(doc){
        reportsHistoryDoc
          .add(doc)
          .then(success => {
            console.log("Added to History");
          })
          .catch(error => {
            console.log("ERROR: ", error);
          });
}

module.exports.remove = removeOld;
