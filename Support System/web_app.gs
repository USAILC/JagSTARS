//By Sean Stalley
//Debugging and testing by Jason Smith
//Created at the Innovation in Learning Center at the University of South Alabama
//2023

//LINE 44: Include the spreadsheet ID for the professional development data. This can be the same one used for the JagSTARS CRM tool. 
//LINE 173-202: Be sure to change any of the text areas here to include your department name (e.g. subject = "Department Name Support System")
//
//
//
//
//

function doGet() {
  const htmlService = HtmlService.createTemplateFromFile("webapp.html").evaluate().addMetaTag("viewport","width=device-width, initial-scale=1.0").setTitle("JagSTARS Support System").setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
   return htmlService
}

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const ws = ss.getSheetByName("Ticket Logs")
  const dataRange = ws.getRange("A1").getDataRegion()
  const data = dataRange.getDisplayValues()
  
  const headers = data.shift()

  const jsdata = data.map(r => {
    const tempObject = {}

    headers.forEach((header, i) => {
      tempObject[header] = r[i]
    })
    return tempObject
  })

  //console.log(jsdata) //in case you want to see it logged

  return jsdata

} //end of getData function


function parsePD(idModal) {
  var sheet = SpreadsheetApp.openById("SPREADSHEET_ID").getSheetByName("dataPD")
  var data = sheet.getDataRange().getValues();
  var pdData = [];
  for (var i = 1; i < data.length; i++) { //start from 1 to skip the header row
    if (data[i][6] === idModal){
      var date = data[i][1].toLocaleDateString();
      var title = data[i][2];
      var hours = data[i][3];
      var instructor = data[i][4];
      var method = data[i][5];
      pdData.push({date: date, title: title, hours: hours, instructor: instructor, method: method});
      } 
    }
      // console.log(pdData);
      return pdData
}

function editStatus(props){
  Logger.log(props.field)
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const ws = ss.getSheetByName("Ticket Logs")
  const statusCellMatched = ws.getRange("A2:A").createTextFinder(props.id).matchEntireCell(true).matchCase(true).findNext()
  const colCellMatch = ws.getRange("A1:1").createTextFinder(props.field).matchEntireCell(true).findNext()

  if(statusCellMatched === null) throw new Error("No matching record. Cannot update.")
  if(colCellMatch === null) throw new Error("Invalid field.")
  const recordRowNumber = statusCellMatched.getRow()
  const recordColNumber = colCellMatch.getColumn()

  ws.getRange(recordRowNumber,recordColNumber).setValue(props.val)
  if (props.field === "Assigned"){
    const rowData = ws.getRange(recordRowNumber,1,1,11).getDisplayValues()
    sendPostMessage(rowData,props)
  }
}

function getScriptURL() {
  return ScriptApp.getService().getUrl();
}

//This lets you add in calls to html files. Saves having to scroll through a ton of HTML on main
function include(filename){
  return HtmlService.createHtmlOutputFromFile(filename).getContent();

}

// Might be a mismatch in column size vs range
// Had to add one to RowNumber? Not entirely sure why. NEVER DELETE RECORDS
function editCustomerById(id,customerInfo){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName("Ticket Logs");
  const custIds = ws.getRange(2,1,ws.getLastRow()-1,11).getDisplayValues().map(r => r[0].toString().toLowerCase());
  const posIndex = custIds.indexOf(id.toString().toLowerCase());
  const rowNumber = posIndex === -1 ? 0 : posIndex + 1
  
  ws.getRange(rowNumber+1,2,1,11).setValues([[
                                        // customerInfo.RecordNumber,
                                        customerInfo.Date,
                                        customerInfo.Time,
                                        customerInfo.Email,
                                        customerInfo.Name,
                                        customerInfo.Phone,
                                        customerInfo.IdNumber,
                                        customerInfo.Category,
                                        customerInfo.Description,
                                        customerInfo.Status,
                                        customerInfo.Assigned,
                                        customerInfo.Comments
                                        ]])
  return true;

};

function addCloseStamp(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName("Ticket Logs");
  const custIds = ws.getRange(2,1,ws.getLastRow()-1,11).getDisplayValues().map(r => r[0].toString().toLowerCase());
  const posIndex = custIds.indexOf(id.toString().toLowerCase());
  const rowNumber = posIndex === -1 ? 0 : posIndex + 1
}

function addNewRecord(newEmail,newName,newPhone,newID,newCat,newAgt,newDesc,emailBool){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName("Ticket Logs");
  const status = 'New';

  const newRec = ws.getRange(ws.getLastRow(), 1).getValue()+1
  const timestamp=new Date();
  var newDate=timestamp.toLocaleDateString()
  var newTime=timestamp.toLocaleTimeString()

  ws.appendRow([
                  newRec,
                  newDate,
                  newTime,
                  newEmail,
                  newName,
                  newPhone,
                  newID,
                  newCat,
                  newDesc,
                  status,
                  newAgt
  ])

  const rowData = [[
                  Math.trunc(newRec),
                  newDate,
                  newTime,
                  newEmail,
                  newName,
                  newPhone,
                  newID,
                  newCat,
                  newDesc,
                  status,
                  newAgt
  ],[]]

  const props = {id: newRec, val: newAgt}
  Logger.log(props.val)
  Logger.log(rowData)
  if(emailBool === true){
    sendNewEmail(newRec,newEmail,newName,newPhone,newID,newCat,newDesc)
  }
  sendPostMessage(rowData,props)
  return true;
}

function sendClosedEmail(props){
  var subject="Help Desk Ticket No. "+ props.recNum + " has been closed."
  var messageCustomer= HtmlService.createTemplateFromFile('EmailTemplate.html');
  var emailBody = messageCustomer.evaluate().getContent();
  var emailTemp = email
  // var emailBody = emailBody.replace('<span id="RecordNum"></span>', recordNumber);
  // var messageHelpDesk="This email has been automatically generated by the Help Desk system. This email serves as a record of ticket " +recordNumber+ " created by " +email+"."
  GmailApp.sendEmail(emailTemp, 
      subject, '', {
      htmlBody: emailBody,
      name: "Support Desk"})
}

function sendNewEmail(newRec,newEmail,newName,newPhone,newID,newCat,newDesc){
  var subject="Help Desk Ticket No. "+ newRec + " has been created."
  var messageCustomer= HtmlService.createTemplateFromFile('NewEmail.html');
  var emailBody = messageCustomer.evaluate().getContent();
  var emailBody = emailBody.replace('<span id="recordNum"></span>', newRec);
  var emailBody = emailBody.replace('<span id="name"></span>', newName);
  var emailBody = emailBody.replace('<span id="phone"></span>', newPhone);
  var emailBody = emailBody.replace('<span id="IDNum"></span>', newID);
  var emailBody = emailBody.replace('<span id="cat"></span>', newCat);
  var emailBody = emailBody.replace('<span id="desc"></span>', newDesc);
  var emailTemp = newEmail;
  // var messageHelpDesk="This email has been automatically generated by the Help Desk system. This email serves as a record of ticket " +recordNumber+ " created by " +email+"."
  GmailApp.sendEmail(emailTemp, 
      subject, '', {
      htmlBody: emailBody,
      name: "Support Desk"})
}

function logEvent(action) {
  
  // get the user running the script
  var theUser = Session.getActiveUser().getEmail();
  
  // get the relevant spreadsheet to output log details
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName('History');
  
  // create and format a timestamp
  var dateTime = new Date();
  var niceDateTime = Utilities.formatDate(dateTime, "CST", "MM/dd/yy @ hh:mm:ss");
  
  // create array of data for pasting into log sheet
  var logData = [niceDateTime, theUser, action];
  
  // append details into next row of log sheet
  logSheet.appendRow(logData);
  
}

//This part of the tool sends automatic slack messages. If you are not using Slack, then you can delete this function and the sendSlack() function. Be sure to remove the function sendPostMessage() from the addNewRecord() function in line 169 above.

function sendPostMessage(rowData,props){
  Logger.log("SendPostMEssagE")
  var ticketData = rowData[0]
  Logger.log(rowData[0])
  var ticketID = props.val
  const findUser = (users, id) => users.find(user => user.id === id)

  const usersExample = [
    {
      id: 'INCLUDE USER NAME',
      text: 'INCLUDE USER ID'
    },
    {
      id: 'INCLUDE USER NAME',
      text: 'INCLUDE USER ID'
    },
    {
      id: 'INCLUDE USER NAME',
      text: 'INCLUDE USER ID'
    },
    {
      id: 'INCLUDE USER NAME',
      text: 'INCLUDE USER ID'
    }
  ]

  if(ticketID === "Unassigned"){
    Logger.log("Nevermind")
  } else {
    const user = findUser(usersExample, ticketID)
    Logger.log(user.id)

    sendSlack(ticketData, user)
  }
}

function sendSlack(ticketData, user){

  var ticketNumber = ticketData[0]
  var ticketDate = ticketData[1] + " " + ticketData[2]
  var ticketEmail = ticketData[3]
  var ticketName = ticketData[4]
  var ticketCategory = ticketData[7]
  var ticketDescription = ticketData[8]

  var accessToken = "INCLUDE SLACK API ACCESS TOKEN"
  //See: https://api.slack.com/bot-users

  var channelId = user.text
  var userId = user.text

  Logger.log(channelId && userId)

  var url = "https://slack.com/api/chat.postMessage";
  
  var payload = {
    token: accessToken,
    channel: channelId,
    user: userId,
		type: "mrkdwn",
		text: "You have been assigned ticket no. " + ticketNumber + "\n>Name: " + ticketName + "\n>Submission date: " + ticketDate + "\n>Email: " + ticketEmail + "\n>Category: " + ticketCategory + "\n>Description: " + ticketDescription
    };

  var params = {
    method : 'post',
    payload : payload
  };

  var response = UrlFetchApp.fetch(url, params)
  console.log(response);
}

