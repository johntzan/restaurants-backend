var request = require("request");
var Promise = require("promise");
var admin = require("firebase-admin");

var serviceAccount = require("../firebase-service.json");
serviceAccount.private_key_id = process.env.FIREBASE_PRIVATE_KEY_ID;
serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY.replace(
  /\\n/g,
  "\n"
);
serviceAccount.client_id = process.env.FIREBASE_CLIENT_ID;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://restaurants-app-1515723626029.firebaseio.com"
});

var db = admin.firestore();
let reportsDoc = db.collection("reports");

var googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyDlO8tHzryoJEylH6jkQblJJucD2EtwekA",
  rate: {
    limit: 50,
    period: 10000
  },
  Promise: Promise
});

var headers = {
  Origin: "http://a816-restaurantinspection.nyc.gov",
  "Accept-Encoding": "gzip, deflate",
  "Accept-Language": "en-US,en;q=0.9",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36",
  "Content-Type": "text/plain",
  Accept: "*/*",
  Referer:
    "http://a816-restaurantinspection.nyc.gov/RestaurantInspection/SearchResults.do",
  Connection: "keep-alive",
  DNT: "1",
  Cookie:
    "JSESSIONID=63521C7975469AD52AC6DDCA945FE273.tomcat2; WT_FPC=id=c756c42d-4244-4a76-bb5c-ff51a49c7709:lv=1519265011162:ss=1519264993250"
};

var dataString =
  "callCount=1\npage=/RestaurantInspection/SearchResults.do\nhttpSessionId=\nscriptSessionId=${scriptSessionId}220\nc0-scriptName=RestaurantSpringService\nc0-methodName=getResultsSrchCriteria\nc0-id=0\nc0-param0=string:boroughCode%20%3A_1\nc0-param1=string:restaurantInspectionPK.inspectionDate\nc0-param2=boolean:false\nc0-param3=number:1\nc0-param4=number:99\nbatchId=2";

var options = {
  url:
    "http://a816-restaurantinspection.nyc.gov/RestaurantInspection/dwr/call/plaincall/RestaurantSpringService.getResultsSrchCriteria.dwr",
  method: "POST",
  headers: headers,
  body: dataString
};

function callback(error, response, body) {
  // console.log("ERROR:", error);
  // console.log("RESPONSE:", response);
  // console.log("BODY: ", body);
  if (!error && response.statusCode == 200) {
    var bodySplit = body.substring(28);
    bodySplit = bodySplit.split(";");
    // console.log("body: ", bodySplit);

    let r1 = getRestaurants(bodySplit);
    getReports(r1);
  }
}

function getRestaurants(body) {
  let restaurantArray = [];
  let threeDaysAgo = new Date().getTime();
  threeDaysAgo -= 86400000 * 3;

  for (let index = 0; index < 99; index++) {
    let lastInspected = body.find(a =>
      a.includes("s" + index + ".lastInspectedDate")
    );
    lastInspected = lastInspected.substring(
      lastInspected.indexOf('"') + 1,
      lastInspected.lastIndexOf('"')
    );

    let restaurantName = body.find(a =>
      a.includes("s" + index + ".restaurantName")
    );
    restaurantName = restaurantName.substring(
      restaurantName.indexOf('"') + 1,
      restaurantName.lastIndexOf('"')
    );

    let restaurantZipCode = body.find(a =>
      a.includes("s" + index + ".restZipCode")
    );
    restaurantZipCode = restaurantZipCode.substring(
      restaurantZipCode.indexOf('"') + 1,
      restaurantZipCode.lastIndexOf('"')
    );

    let restaurantStreetName = body.find(a =>
      a.includes("s" + index + ".stName")
    );
    restaurantStreetName = restaurantStreetName.substring(
      restaurantStreetName.indexOf('"') + 1,
      restaurantStreetName.lastIndexOf('"')
    );

    let restaurantDate = new Date(lastInspected).getTime();
    if (restaurantDate > threeDaysAgo) {
      let restaurant = {
        timeOfReport: restaurantDate,
        restName: restaurantName,
        restZip: restaurantZipCode,
        restStreet: restaurantStreetName
      };
      restaurantArray.push(restaurant);
    }
  }
  // console.log("return restaurant array:", restaurantArray);
  return restaurantArray;
}

function getReports(restaurantArray) {
  console.log("GETTING REPORTS SIZE: " + restaurantArray.length);
  let reportsArray = [];
  let fixedSize = restaurantArray.length;

  for (let index = 0; index < restaurantArray.length; index++) {
    let restaurant = restaurantArray[index];
    //   console.log(restaurant);
    googleMapsClient
      .places({
        language: "en",
        location: [40.766331, -73.977545],
        radius: 1000,
        query:
          restaurant.restName +
          " " +
          restaurant.restStreet +
          " " +
          restaurant.restZip
      })
      .asPromise()
      .then(response => {
        let result = response.json.results;
        if (result[0] === undefined) {
          fixedSize--;
          console.error("ERROR WITH: ", restaurant);
        } else {
          let report = {
            timeOfReport: restaurant.timeOfReport,
            place_id: result[0].place_id,
            type: "hd",
            location: {
              latitude: result[0].geometry.location.lat,
              longitude: result[0].geometry.location.lng
            }
          };

          reportsArray.push(report);
          if (reportsArray.length === fixedSize) {
            setReports(reportsArray);
          }
        }
      })
      .catch(err => {
        console.log("Places Error: ", err);
        res.send(err);
      });
  }
}

function setReports(reportsArray) {
  reportsArray.forEach(report => {
    let exists = false;
    reportsDoc
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(doc => {
          // doc.data() is never undefined for query doc snapshots
          // console.log(doc.id, " => ", doc.data().place_id);
          let existingDocPlaceID = doc.data().place_id;
          if (report.place_id === existingDocPlaceID) {
            exists = true;
          }
        });

        if (!exists) {
          reportsDoc
            .add(report)
            .then(success => {
              console.log("SUCCESS");
            })
            .catch(error => {
              console.log("ERROR: ", error);
            });
        } else {
          console.log("Report exists already!");
        }
      })
      .catch(function(error) {
        console.log("Getting reports failed.");
      });
  });
  console.log("FINISHED");
}

function requestReports() {
  request(options, callback);
}

module.exports.request = requestReports;
