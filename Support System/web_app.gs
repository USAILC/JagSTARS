//By Sean Stalley
//Debugging and testing by Jason Smith
//Created at the Innovation in Learning Center at the University of South Alabama
//2023
//Refactored with suggestions from Gemini in 2025

/**
 * ===================================================================
 * GLOBAL CONSTANTS & CONFIGURATION
 * ===================================================================
 */

// Configuration for Sheet Names and IDs
const CONFIG = {
  SHEETS: {
    LOGS: "Ticket Logs",
    PD: "dataPD",
    HISTORY: "History"
  },
  CHANNEL_ID: " ",
  DRIVE_FOLDER_ID: ' ',
  SPREADSHEET_ID_PD: ' '
};

// Slack User definitions
const SLACK_USERS = [
  { id: 'DISPLAY NAME', text: 'SLACK ID' },
	//USE ABOVE TEMPLATE TO INCLUDE MORE SLACK USERS
];

// Load Script Properties (Secrets)
const SCRIPT_PROPS = PropertiesService.getScriptProperties();
const SLACK_ACCESS_TOKEN = SCRIPT_PROPS.getProperty('SLACK_ACCESS_TOKEN');
const SLACK_POST_URL = SCRIPT_PROPS.getProperty('SLACK_POST_URL');


/**
 * ===================================================================
 * WEB APP & DATA FUNCTIONS (Called from Client-side)
 * ===================================================================
 */

function doGet() {
  const htmlService = HtmlService.createTemplateFromFile("webapp.html")
    .evaluate()
    .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
    .setTitle("JagSTARS Ticketing")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  return htmlService;
}

function getData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  const dataRange = ws.getRange("A1").getDataRegion();
  const data = dataRange.getDisplayValues();

  const headers = data.shift(); //Removes first row

  const jsdata = data.map(r => {
    const tempObject = {};
    headers.forEach((header, i) => {
      tempObject[header] = r[i];
    });
    return tempObject;
  });

  // console.log(jsdata);
  return jsdata;
}

function parsePD(jagModal) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID_PD).getSheetByName(CONFIG.SHEETS.PD);
  const data = sheet.getDataRange().getValues();
  const pdData = [];
  
  for (let i = 1; i < data.length; i++) { //start from 1 to skip the header row
    if (data[i][6] === jagModal) {
      const date = data[i][1].toLocaleDateString();
      const title = data[i][2];
      const hours = data[i][3];
      const instructor = data[i][4];
      const method = data[i][5];
      pdData.push({ date: date, title: title, hours: hours, instructor: instructor, method: method });
    }
  }
  // console.log(pdData);
  return pdData;
}

function editStatus(props) {
  Logger.log(props.field);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  
  // Find the row by ID in Column A
  const statusCellMatched = ws.getRange("A2:A").createTextFinder(props.id)
    .matchEntireCell(true)
    .matchCase(true)
    .findNext();
    
  // Find the column by Header name in Row 1
  const colCellMatch = ws.getRange("A1:1").createTextFinder(props.field)
    .matchEntireCell(true)
    .findNext();

  if (statusCellMatched === null) throw new Error("No matching record. Cannot update.");
  if (colCellMatch === null) throw new Error("Invalid field.");
  
  const recordRowNumber = statusCellMatched.getRow();
  const recordColNumber = colCellMatch.getColumn();

  ws.getRange(recordRowNumber, recordColNumber).setValue(props.val);
  
  if (props.field === "Assigned") {
    const rowData = ws.getRange(recordRowNumber, 1, 1, 11).getDisplayValues();
    sendPostMessage(rowData, props);
  }
}

function editCustomerById(id, customerInfo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);

  // Use TextFinder to find the row efficiently
  const idCell = ws.getRange("A2:A").createTextFinder(id.toString())
    .matchEntireCell(true)
    .matchCase(false) // Assuming case-insensitive matching for IDs
    .findNext();

  if (idCell === null) {
    Logger.log(`Error: Could not find record with ID ${id}. No update performed.`);
    return false;
  }
  
  const rowNumber = idCell.getRow();
  
  // Update columns B through L (2 through 12)
  ws.getRange(rowNumber, 2, 1, 11).setValues([[
    customerInfo.Date,
    customerInfo.Time,
    customerInfo.Email,
    customerInfo.Name,
    customerInfo.Phone,
    customerInfo.JagNumber,
    customerInfo.Category,
    customerInfo.Description,
    customerInfo.Status,
    customerInfo.Assigned,
    customerInfo.Comments
  ]]);
  
  return true;
}

function addNewRecord(newEmail, newName, newPhone, newJag, newCat, newAgt, newDesc, emailBool, imageURL) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  const status = 'New';

  const newID = ws.getRange(ws.getLastRow(), 1).getValue() + 1;
  const timestamp = new Date();
  const newDate = timestamp.toLocaleDateString();
  const newTime = timestamp.toLocaleTimeString();

  const newRow = [
    newID,
    newDate,
    newTime,
    newEmail,
    newName,
    newPhone,
    newJag,
    newCat,
    newDesc,
    status,
    newAgt,
    '', // Comments
    imageURL
  ];
  
  ws.appendRow(newRow);

  // Re-package for sendPostMessage (which expects a nested array)
  const rowData = [[
    Math.trunc(newID),
    newDate,
    newTime,
    newEmail,
    newName,
    newPhone,
    newJag,
    newCat,
    newDesc,
    status,
    newAgt,
    '',
    imageURL
  ], []];

  const props = { id: newID, val: newAgt };
  Logger.log(props.val);
  Logger.log(rowData);
  
  if (emailBool === true) {
    sendNewEmail(newID, newEmail, newName, newPhone, newJag, newCat, newDesc);
  }
  sendPostMessage(rowData, props);
  return true;
}

function doUpload(obj) {
  const blob = Utilities.newBlob(Utilities.base64Decode(obj.data), obj.mimeType, obj.fileName);
  const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
  const file = folder.createFile(blob);
  const fileURL = file.getUrl();
  
  const attachResponse = {
    'fileName': obj.fileName,
    'url': fileURL,
    'status': true,
    'data': JSON.stringify(obj)
  };
  return attachResponse;
}

/**
 * ===================================================================
 * EMAIL FUNCTIONS
 * ===================================================================
 */

function sendClosedEmail(props) {
  const subject = "ILC Help Desk Ticket No. " + props.recNum + " has been closed.";
  const messageCustomer = HtmlService.createTemplateFromFile('EmailTemplate.html');
  const emailBody = messageCustomer.evaluate().getContent();
  const emailTemp = props.email;
  
  GmailApp.sendEmail(emailTemp,
    subject, '', {
    htmlBody: emailBody,
    name: "ILC Support Desk"
  });
}

function sendNewEmail(newID, newEmail, newName, newPhone, newJag, newCat, newDesc) {
  const subject = "ILC Help Desk Ticket No. " + newID + " has been created.";
  let messageCustomer = HtmlService.createTemplateFromFile('NewEmail.html');
  let emailBody = messageCustomer.evaluate().getContent();
  
  // Chain replacements
  emailBody = emailBody.replace('<span id="recordNum"></span>', newID)
                       .replace('<span id="name"></span>', newName)
                       .replace('<span id="phone"></span>', newPhone)
                       .replace('<span id="jag"></span>', newJag)
                       .replace('<span id="cat"></span>', newCat)
                       .replace('<span id="desc"></span>', newDesc);
                       
  const emailTemp = newEmail;
  
  GmailApp.sendEmail(emailTemp,
    subject, '', {
    htmlBody: emailBody,
    name: "ILC Support Desk"
  });
}


/**
 * ===================================================================
 * SLACK NOTIFICATION FUNCTIONS
 * ===================================================================
 */

function sendPostMessage(rowData, props) {
  Logger.log("SendPostMessage");
  const ticketData = rowData[0];
  Logger.log(rowData[0]);
  const assignedUserName = props.val;

  if (assignedUserName === "Unassigned") {
    Logger.log("Ticket is Unassigned, no Slack message sent.");
    return;
  }
  
  const user = SLACK_USERS.find(u => u.id === assignedUserName);

  if (user) {
    Logger.log(user.id);
    sendSlack(ticketData, user);
  } else {
    Logger.log(`Error: Could not find Slack user ID for: ${assignedUserName}`);
  }
}

function sendSlack(ticketData, user) {
  const ticketNumber = ticketData[0];
  const ticketDate = ticketData[1] + " " + ticketData[2];
  const ticketEmail = ticketData[3];
  const ticketName = ticketData[4];
  const ticketCategory = ticketData[7];
  const ticketDescription = ticketData[8];
  
  const formattedDescription = ticketDescription
    .replace(/\r\n/g, "\n") // Normalize line endings
    .split("\n")
    .map(line => `> ${line}`) // Prefix every line
    .join("\n");

  const assigner = Session.getActiveUser().getEmail();
  const channelId = user.text; // This is the Slack User ID, which acts as the channel for DMs
  const userId = user.text;

  Logger.log(`Sending notification to ${user.id} (${channelId})`);

  const payload = {
    token: SLACK_ACCESS_TOKEN,
    channel: channelId,
    user: userId,
    type: "mrkdwn",
    text: `You have been assigned ticket no. *${ticketNumber}* by ${assigner}\n>Name: ${ticketName}\n>Submission date: ${ticketDate}\n>Email: ${ticketEmail}\n>Category: ${ticketCategory}\nDescription:\n${formattedDescription}`
  };

  const params = {
    method: 'post',
    payload: payload
  };

  const response = UrlFetchApp.fetch(SLACK_POST_URL, params);
  console.log(response);
}

function sendReminder(rowUser) {
  const user = SLACK_USERS.find(u => u.id === rowUser);

  if (!user) {
    Logger.log(`Could not find Slack user for reminder: ${rowUser}`);
    return;
  }

  const channelId = user.text;
  const userId = user.text;

  const payload = {
    token: SLACK_ACCESS_TOKEN,
    channel: channelId,
    user: userId,
    type: "mrkdwn",
    text: "Check <LINK TO WEBAPP ONCE DEPLOYED|JAGSTARS> for unresolved tickets. Have a great day!"
  };

  const params = {
    method: 'post',
    payload: payload
  };

  const response = UrlFetchApp.fetch(SLACK_POST_URL, params);
  // console.log(response);
}

function unassignedReminder(rowData) {
  const ticketData = rowData[0];
  const ticketNumber = ticketData[0];
  const ticketDate = ticketData[1] + " " + ticketData[2];
  const ticketEmail = ticketData[3];
  const ticketName = ticketData[4];
  const ticketCategory = ticketData[7];
  const ticketDescription = ticketData[8];

  const payload = {
    token: SLACK_ACCESS_TOKEN,
    channel: CONFIG.CHANNEL_ID,
    type: "mrkdwn",
    text: `The following ticket is unassigned in the queue: \n*${ticketNumber}*\n>Name: ${ticketName}\n>Submission date: ${ticketDate}\n>Email: ${ticketEmail}\n>Category: ${ticketCategory}\n>Description: ${ticketDescription}`
  };

  const params = {
    method: 'post',
    payload: payload
  };

  const response = UrlFetchApp.fetch(SLACK_POST_URL, params);
  console.log(response);
}


/**
 * ===================================================================
 * AUTOMATED TRIGGERS (Time-based)
 * ===================================================================
 */

function reminderNotification() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  
  // Get only the last 50 rows of data (more efficient)
  const lastRow = ws.getLastRow();
  const startRow = Math.max(2, lastRow - 49); // Don't go before row 2
  const numRows = lastRow - startRow + 1;
  
  if (numRows <= 0) {
    Logger.log("No data in sheet to check for reminders.");
    return; // No data
  }
  
  const data = ws.getRange(startRow, 1, numRows, 11).getDisplayValues(); // Get 11 columns
  
  const currentDate = new Date();
  const oneDayInMs = 86400000;
  const cutoffDate = new Date(currentDate.getTime() - oneDayInMs); // 24 hours ago
  
  const notifiedUsers = new Set();
  const validStatuses = ["New", "Open", "Processing"];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowDate = new Date(row[1]); // Column B: Date
    const rowUser = row[10]; // Column K: Assigned
    const status = row[9];   // Column J: Status
    
    // Check if ticket is older than 24 hours and has a pending status
    if (rowDate < cutoffDate && validStatuses.includes(status)) {
      // console.log(row[1] + " for " + rowUser + " is unresolved");
      if (!notifiedUsers.has(rowUser)) {
        sendReminder(rowUser); // Send the reminder
        notifiedUsers.add(rowUser);
      }
    }
  }
}

function unassignedNotification() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.SHEETS.LOGS);
  
  // Get only the last 50 rows of data
  const lastRow = ws.getLastRow();
  const startRow = Math.max(2, lastRow - 49);
  const numRows = lastRow - startRow + 1;
  
  if (numRows <= 0) {
    Logger.log("No data in sheet to check for unassigned.");
    return; // No data
  }

  const data = ws.getRange(startRow, 1, numRows, 11).getDisplayValues(); // Get 11 columns

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowAssigned = row[10]; // Column K: Assigned
    const rowStatus = row[9]; // Column J: Status

    if (rowAssigned === "Unassigned" && rowStatus === "New") {
      const rowData = [[
        row[0], row[1], row[2], row[3], row[4],
        row[5], row[6], row[7], row[8], row[9], row[10]
      ], []];
      unassignedReminder(rowData);
    }
  }
}


/**
 * ===================================================================
 * UTILITY FUNCTIONS
 * ===================================================================
 */

function getScriptURL() {
  return ScriptApp.getService().getUrl();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function logEvent(action) {
  // get the user running the script
  const theUser = Session.getActiveUser().getEmail();
  
  // get the relevant spreadsheet to output log details
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName(CONFIG.SHEETS.HISTORY);
  
  // create and format a timestamp
  const dateTime = new Date();
  // Ensure you have the correct Timezone
  const niceDateTime = Utilities.formatDate(dateTime, Session.getScriptTimeZone(), "MM/dd/yy @ hh:mm:ss");
  
  // create array of data for pasting into log sheet
  const logData = [niceDateTime, theUser, action];
  
  // append details into next row of log sheet
  logSheet.appendRow(logData);
}
