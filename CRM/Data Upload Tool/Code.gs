// LINE 18: Replace folderId with the ID of the folder where you want to store the uploaded CSV file
// LINE 40: Replace regexID with regular expression (RegEx) that matches your SIS or ID pattern
// LINE 41: Replace regexEmail with subdomains (e.g. email@faculty.institutionname.edu) and primary domain (e.g. email@institutionname.edu) of official email.
    // Recommended to user a RegEx tester to verify functionality, such as https://regex101.com/
// LINE 75: Replace file ID in sheet variable to point towards professional development spreadsheet 
function doGet(e) {
   const htmlService = HtmlService.createTemplateFromFile("index.html").evaluate().addMetaTag("viewport","width=device-width, initial-scale=1.0").setTitle('File Upload App')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
   return htmlService
}

//This lets you add in calls to html files. Saves having to scroll through a ton of HTML on main
function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function processForm(form) {
  var folderId = "ID FOR THE FOLDER";
  var folder = DriveApp.getFolderById(folderId);
  var blob = form.fileToUpload;
  var userName = form.text1
  var email = form.text2
  var csvData = Utilities.parseCsv(blob.getDataAsString());
  var header = csvData.shift();

  const jsonArray = csvData.map(subArray => ({
    date: subArray[0],
    courseName: subArray[1],
    duration: subArray[2],
    instructor: subArray[3],
    method: subArray[4],
    idNumber: subArray[5].replace(/\s/g, ''),
    email: '',
    attendeeName: '',
    newData: ''
  }));

  const badData = [];
  const goodData = [];
  const regexID = /^J00\d{6}$/;
  const regexEmail = /^[^\s@]+@(?:SUBDOMAIN\.|SUBDOMAIN\.)?PRIMARYDOMAIN\.edu$/;

  const promises = jsonArray.map(item => {
    return new Promise((resolve, reject) => {
      var idModal = item.idNumber;
      parsePD(idModal).then(pdData => {
        item.email = pdData.email;
        item.attendeeName = pdData.attendeeName;
        if(item.date === '' || item.courseName === '' || item.duration === '' || item.instructor === '' || item.method === '' || !regexID.test(item.jagNumber) || !regexEmail.test(item.email) || item.attendeeName === ''){
          Logger.log("Sent to BD")
          badData.push(item)
        } else {
          Logger.log("Sent to GD")
          goodData.push(item)
        }
        resolve();
      }).catch(err => {
        Logger.log(err);
        item.email = '';
        item.attendeeName = '';
        item.newData = 'Inspect'
        badData.push(item);
        resolve();
      });
    });
  });

  return Promise.all(promises).then(() => {
    return {goodData,badData}
    // return badData
  });

function parsePD(idModal) {
  return new Promise((resolve, reject) => {
    var sheet = SpreadsheetApp.openById("PROFESSIONAL DEVELOPMENT DATA SPREADSHEET ID").getSheetByName("UserData")
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) { //start from 1 to skip the header row
      if (data[i][0] === idModal){
        var email = data[i][1];
        var attendeeName = data[i][3] + " " + data[i][2];
        resolve({email, attendeeName});
        return;
      }
    }
    reject(new Error(`Could not find data for ID: ${idModal}`));
  });
}
}

function writeToSheet(returnData, userName, userEmail){
  // var results = JSON.stringify(returnData)
  var header2 = returnData.shift();
  // Logger.log(results)
  Logger.log(header2)

  const currentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  currentSheet.getRange(currentSheet.getLastRow()+1, 1, 1, 12).setValues([[
                                        header2.date,
                                        header2.courseName,
                                        header2.duration,
                                        header2.instructor,
                                        header2.method,
                                        header2.idNumber,
                                        header2.email,
                                        header2.attendeeName,
                                        header2.newData,
                                        userEmail,
                                        userName,
                                        new Date()
                                        ]])

  for(var i=0; i < returnData.length; i++){
  currentSheet.getRange(currentSheet.getLastRow()+1, 1, 1, 9).setValues([[
                                        returnData[i].date,
                                        returnData[i].courseName,
                                        returnData[i].duration,
                                        returnData[i].instructor,
                                        returnData[i].method,
                                        returnData[i].idNumber,
                                        returnData[i].email,
                                        returnData[i].attendeeName,
                                        returnData[i].newData
                                        ]])
  }
  // header2 = [...header2, userName, userEmail, new Date()]

  // const currentSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Data");
  // // currentSheet.getRange(currentSheet.getLastRow()+1, 1, 1, header2.length).setValues([header2]);
  // currentSheet.getRange(currentSheet.getLastRow()+1, 1, results.length, results[0].length).setValues(results);
}