# JAGSTARS
Just a Google Sheet Tracking and Reporting System

## Description

JAGSTARS comprises a suite of web-based applications built on Google Workspace tools, including Sheets and Docs, with additional functionality provided by the Javascript-based Google Apps Script platform. The applications encompass:

   * Client Relationship Management (CRM) Database: Maintains professional development records.
   * Data Upload Tool: Easily adds event data to the CRM, validated before inclusion.
       * A demo version of the application is available at [this link](https://script.google.com/a/macros/southalabama.edu/s/AKfycbx81MWKcgoJnsRvMfAbL6ZhGGoF3HUXAP07pmvDgXQsldxbqpmbecXeFWxfO_6E1V0A8g/exec). Be sure to use the [demo CSV](https://github.com/USAILC/JagSTARS/blob/main/CRM/Data%20Upload%20Tool/DemoCSVforDataEntry.csv) to see the error-catching and autofill features.
   * Report Generation Tool: Provides insights into individual and departmental participation.
       * The College/Department report generator is still a spreadsheet application. Plans for the future include converting this to a web application, much like the individual transcript generators. Here is the [Google Sheets template link](https://docs.google.com/spreadsheets/d/1n7EATBvJHe01wUsn_Lx-_RoWitr9PxCfe4nHg-PZX8U/template/preview).
       * Individual report generators include a self-service generator based on email identification, but there is also a manual input version (see demo at [this link](https://script.google.com/macros/s/AKfycbzQ4BvVgmTYkuOEIyG4NjsB1eQXh6ZUdeYM0RriZbCm1CjtfqSrpncwOZwpcn2gyVr7/exec)).
   * Support Ticket Application: Tracks day-to-day staff interactions with clients [Link to Demo](https://script.google.com/a/macros/southalabama.edu/s/AKfycbzTfYO66qLZPQ_QnS-NNZFJH3bp3H4af5XKsBVMuvp3Ms7n88NMcx4Tk8bQyVtMLhrQ/exec).

JAGSTARS employs relational Google Sheets for data storage, associating user records with specific professional development events or support requests through email addresses or unique employee IDs. The support ticket system, designed as a single-page web application, implements different workflow stages, filtering, and notification features, streamlining ticket processing and communication.

### Installation

The primary CRM database uses a spreadsheet with the following columns: Record Number, Date, Title, CEU Hours, Instructor, Instructional Method, idNumber, emailAddress.
You can choose to have a separate sheet that houses staff/faculty information, which can then be used in the primary professional development spreadsheet to automatically match and copy idNumbers and email addresses using standard spreadsheet formulae.

<details>
<summary>Data Upload Tool</summary>
<br>

 1. List item
 2. Open a Google Sheet
 3. Go to Extensions
 4. Select 'Apps Script'
 5. Rename Apps Script file to a descriptive name
 6. Copy in Code.gs
 7. Create an HTML entry
 8. Create a folder to store uploaded CSV files
 9. Add the folder ID to the value 'folderID' line 18 (ID is the last part of folder url, e.g. https://drive.google.com/drive/folders/3fe6viWOaClMzpm-5D4EsBdlpk_T1hEs)
 10. Replace the value 'regexID' in line 40 with a regular expression (RegEx) that matches your SIS or ID pattern (recommend using regex101.com)
 11. Replace value 'regexEmail' in line 41 with your email subdomains (e.g. health. or faculty.) and your primary subdomain (e.g. exampleuniversity.com). This filters allowed email addresses.
 12. Replace value 'fileID' in line 75 with the spreadsheet that holds your professional development data (ID is the part of the url with a string of numbers and letters, similar to the folder ID above).
 13. Select 'Deploy' to open a testing URL, or publish a version of the app to get a stable URL.
</details>

<details>
<summary>Self Search/Staff Search Tool</summary>
<br>

1. Create a folder to house the template document and necessary folders.
2. Create a Google Doc and style it how you please. Create replaceable entries by adding brackets (e.g. {Name} to have a replaceable value for the person's name)
3. Create a folder to house the PDFs.
4. Create a folder to serve as a temporary folder for the transcript creation process.
5. Create a Google Sheet
6. Go to Extensions
7. Select 'Apps Script' and rename the Apps Script file to a descriptive title.
8. Copy the file code.gs from the repository into the .gs script file.
9. Create four HTML files (EmailTemplate, css, index, and table) and copy the appropriate HTML code into each one from the repository. 
10. In code.gs on lines 106-108, replace the values corresponding to the template document, the pdf folder, and the temporary folder with the folder IDs (ID is the last part of folder url, e.g. https://drive.google.com/drive/folders/3fe6viWOaClMzpm-5D4EsBdlpk_T1hEs)
11. In code.gs on lines 133-134, be sure to add the categories that you want to include on your transcript (be sure these are present in the actual spreadsheet)
12. In the EmailTemplate.html file, be sure to add the text that you want to be included in automatic emails.
13. In the index.html file on line 164, be sure to add the name of your department/institution.
14. Select 'Deploy' to open a testing URL, or publish a version of the app to get a stable URL.

</details>


<details>
<summary>Support System Tool (Ticketing)</summary>
<br>

Create a Google Sheet and create columns in the following order: RecordNumber, Date, Time, Email, Name, Phone, idNumber, Category, Description, Status, Assigned, Comments.
2. Go to Extensions
3. Select 'Apps Script'
4. Rename Apps Script file to a descriptive name
5. Copy web_app.gs into the .gs script file.
6. Create seven html files (for EmailTemplatee, NewEmail, etc.) and copy the corresponding HTML into each one from the repository.
7. In the web_app.gs (or code.gs) script file on line 44, include a spreadsheet ID for the separate professional development data spreadsheet (ID is the part of the url with a string of numbers and letters, similar to the folder ID above).
8. In the web_app.gs (or code.gs) script file on line 173-202, be sure to change any values to correspond to your department/college name.
9. In the webapp.html file on lines 39-58, be sure to update the dropdown lists with your support services (e.g. Canvas, Zoom) and support staff (e.g. 'Agent 1' will be changed to 'Sally' in all instances. THESE MUST MATCH THE VALUES IN LINES 157-174 EXACTLY).
10. In the webapp.html file on line 168, be sure to add your support staff names (these must be the same as those in step 9).
11. In customAdd.html on line 23, the title and required pattern must match institutional emails.
12. In customAdd.html on line 33, use a regular expression (RegEx) to match your SIS ID (you can optionally remove the required pattern)
13. In customAdd.html on lines 38-46, be sure to change the dropdown options to the support services you offer.
14. In customAdd.html on lines 52-56, be sure to change the dropdown options to the support staff members names.
15. In the email templates, be sure to update the text to reflect what you would like to be displayed in automatic emails.
16. To deploy, select 'Deploy' in the Apps Script editor to open a testing URL, or publish a version of the app to get a stable URL.

</details>


### Customization

Coming Soon

## Help

Any issues can be directed to this Github page.

## Authors

Contributors names and contact info

## Version History

This project is currently being developed. This is a repo for the demo version.

## License

This project is licensed under the BSD-1-Clause License - see the LICENSE.txt file for details
