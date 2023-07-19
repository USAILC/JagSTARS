//LINE 106-108: Make sure that you include the appropriate IDs for the template document, temporary folder, and PDF folder from the Drive of the same account.
//Line 133-134: Be sure to change categories to the categories you plan on using for your transcripts.



function doGet(e) {
   const htmlService = HtmlService.createTemplateFromFile("index.html").evaluate().addMetaTag("viewport","width=device-width, initial-scale=1.0").setTitle('PD Database Search')
   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
   return htmlService
}

//This lets you add in calls to html files. Saves having to scroll through a ton of HTML on main
function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getScriptURL() {
  return ScriptApp.getService().getUrl();
}

function parseDataToJSON() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("dataPD");
  var data = sheet.getDataRange().getValues();

  var activeUser = Session.getActiveUser().getEmail();
  var jsonData = [];

  // PD Data
  for (var i = 1; i < data.length; i++) { //start from 1 to skip the header row
    if (data[i][7] === activeUser){
      var user = data[i][7]
      var date = data[i][1].toLocaleDateString();
      var title = data[i][2];
      var hours = data[i][3];
      var instructor = data[i][4];
      var method = data[i][5];
      jsonData.push({user: user, date: date, title: title, hours: hours, instructor: instructor, method: method});
      }
    }
      return {
        jsonData: jsonData,
        activeUser: activeUser
      };
}

function breakToJSON() {
  var sheet = SpreadsheetApp.getActive().getSheetByName("dataPD");
  var data = sheet.getDataRange().getValues();

  var theUser = Session.getActiveUser().getEmail();
  var printData = [];

  // PD Data
  for (var i = 1; i < data.length; i++) { //start from 1 to skip the header row
    if (data[i][7] === theUser){
      var date = data[i][1].toLocaleDateString();
      var title = data[i][2];
      var hours = data[i][3];
      var instructor = data[i][4];
      var method = data[i][5];
      printData.push({date: date, title: title, hours: hours, instructor: instructor, method: method});
      } 
    }
    const totalHours = printData.map(printData => printData.hours)
    const sum = totalHours.reduce((partialSum, a) => partialSum + a, 0);
    // console.log(sum)
    parseUsertoJSON(printData, theUser, sum)
}

function parseUsertoJSON(printData, theUser, sum){
  console.log("parse reached")
  var usheet = SpreadsheetApp.getActive().getSheetByName("UserData");
  var udata = usheet.getDataRange().getValues();

  // var theUser = Session.getActiveUser().getEmail();

  var userData = []

  var emailList = udata.map(function(r){ return r[1]})
  var fn = udata.map(function(r){ return r[3]})
  var ln = udata.map(function(r){ return r[2]})
  var col = udata.map(function(r){ return r[4]})
  var qual = udata.map(function(r){ return r[5]})
  var canv = udata.map(function(r){ return r[6]})

  var position = emailList.indexOf(theUser)

  if (position > -1){
    var firstName = fn[position];
    var lastName = ln[position];
    var college = col[position];
    var qm = qual[position];
    var canCert = canv[position];
    userData.push({firstName: firstName, lastName: lastName, college: college, qm: qm, canCert: canCert});
    }

    createBulkPDFs(printData, userData, theUser, sum)

}

// Creating on-Demand PDFs #########################################################################################################################################################

function createBulkPDFs(printData, userData, theUser, sum){
  console.log("bulk reached")
  console.log("createBulk invoked")
  const docFile = DriveApp.getFileById("TEMPLATE_DOCUMENT_ID");
  const tempFolder = DriveApp.getFolderById("TEMPORARY_FOLDER_ID");
  const pdfFolder = DriveApp.getFolderById("PDF_FOLDER_ID");

  createPDF(printData, userData, theUser, docFile,tempFolder,pdfFolder, sum);
}

function createPDF(printData, userData, theUser, docFile,tempFolder,pdfFolder, sum) {
  console.log("createPDF invoked")
  const tempFile = docFile.makeCopy(tempFolder);
  const tempDocFile = DocumentApp.openById(tempFile.getId());
  const body = tempDocFile.getBody();
  const today = Utilities.formatDate(new Date(), "GMT+1", "MM/dd/yyyy")
  body.replaceText("{Name}", userData[0].firstName + " " + userData[0].lastName);
  body.replaceText("{Email}", theUser);
  body.replaceText("{College}", userData[0].college);
  body.replaceText("{QM}", userData[0].qm);
  body.replaceText("{Canvas}", userData[0].canCert);
  body.replaceText("{Hours}", sum);
  body.replaceText("{Today}", today);

        var style = {};
            style[DocumentApp.Attribute.FONT_FAMILY] = 'Calibri';
            style[DocumentApp.Attribute.FONT_SIZE] = 10;
            style[DocumentApp.Attribute.BORDER_WIDTH] = 0;
        var centering = {};
            centering[DocumentApp.Attribute.HORIZONTAL_ALIGNMENT] = DocumentApp.HorizontalAlignment.CENTER;
// [["Date", "Title", "Hours", "Instructor", "Method"]]
  const table = body.appendTable([["Date", "Title", "Hours", "Instructor", "Method"]]).setColumnWidth(0,68).setColumnWidth(1, 240).setColumnWidth(2,90).setColumnWidth(3, 130).setColumnWidth(4, 75).setAttributes(style);

    for (var i = 0; i < printData.length; i++) {
      const row = table.appendTableRow().setAttributes(centering);
          row.appendTableCell(0).setText(printData[i].date);
          row.appendTableCell(1).setText(printData[i].title);
          row.appendTableCell(2).setText(printData[i].hours);
          row.appendTableCell(3).setText(printData[i].instructor);
          row.appendTableCell(4).setText(printData[i].method);
      }
    
  table.removeRow(0)

  tempDocFile.saveAndClose();
  const pdfContentBlob = tempFile.getAs(MimeType.PDF);
  const pdfFile = pdfFolder.createFile(pdfContentBlob).setName("Professional Development Transcript: " + theUser)
  // tempFolder.removeFile(tempFile);
  // tempDocFile.setTrashed(true);
  tempFile.setTrashed(true);

  sendPdfEmail(pdfFile, userData)
}


function sendPdfEmail(pdfFile, userData){
  var htmlTemplate = HtmlService.createTemplateFromFile('EmailTemplate.html');
  var email = Session.getActiveUser().getEmail();
  htmlTemplate.name = userData[0].firstName;
  var emailBody = htmlTemplate.evaluate();
  GmailApp.sendEmail(email, "Professional Development Transcript Request", '', {
    htmlBody: emailBody.getContent(),
    attachments: [pdfFile],
    name: "Innovation in Learning Center"

  });
}
