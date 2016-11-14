'use strict';

const constants = require('../../util/constants');
const Config = require('config');
const errorHelper = require('../errors');
const HttpStatus = require('http-status-codes');
const Log4js = require('log4js');
//const R = require('ramda');
const Rest = require('restler');
const utils = require('../../util/utils');

Log4js.configure('config/log4js_config.json', {});
const logger = Log4js.getLogger();
logger.setLevel(Config.get('log-level'));

//
//  SAMPLE JIRA DATA HEADER
//
// {
//     "expand": "schema,names",
//     "startAt": 0,
//     "maxResults": 50,
//     "total": 355,
//     "issues":
//     [
//
//
//  SAMPLE JIRA ITEM DATA
// {
//     "expand": "operations,versionedRepresentations,editmeta,changelog,renderedFields",
//     "id": "16204",
//     "self": "https://digitalrig.atlassian.net/rest/api/latest/issue/16204",
//     "key": "CIT-1055",
//     "changelog":
//     {
//         "startAt": 0,
//         "maxResults": 4,
//         "total": 4,
//         "histories":
//         [
//             {
//                 "id": "32317",
//                 "author":
//                 {
//                     "self": "https://digitalrig.atlassian.net/rest/api/2/user?username=amit.sarkar",
//                     "name": "amit.sarkar",
//                     "key": "amit.sarkar",
//                     "emailAddress": "amit.sarkar5@wipro.com",
//                     "avatarUrls":
//                     {
//                         "48x48": "https://digitalrig.atlassian.net/secure/useravatar?avatarId=11529",
//                         "24x24": "https://digitalrig.atlassian.net/secure/useravatar?size=small&avatarId=11529",
//                         "16x16": "https://digitalrig.atlassian.net/secure/useravatar?size=xsmall&avatarId=11529",
//                         "32x32": "https://digitalrig.atlassian.net/secure/useravatar?size=medium&avatarId=11529"
//                     },
//                     "displayName": "Amit Sarkar",
//                     "active": true,
//                     "timeZone": "Asia/Kolkata"
//                 },
//                 "created": "2016-03-22T02:59:01.278-0600",
//                 "items":
//                 [
//                     {
//                         "field": "assignee",
//                         "fieldtype": "jira",
//                         "from": "amit.sarkar",
//                         "fromString": "Amit Sarkar",
//                         "to": "darpan.36",
//                         "toString": "Darpan"
//                     }
//                 ]
//             },
//             {
//                 "id": "32327",
//                 "author":
//                 {
//                     "self": "https://digitalrig.atlassian.net/rest/api/2/user?username=darpan.36",
//                     "name": "darpan.36",
//                     "key": "darpan.36",
//                     "emailAddress": "darpan.36@wipro.com",
//                     "avatarUrls":
//                     {
//                         "48x48": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=48",
//                         "24x24": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=24",
//                         "16x16": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=16",
//                         "32x32": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=32"
//                     },
//                     "displayName": "Darpan",
//                     "active": false,
//                     "timeZone": "America/Denver"
//                 },
//                 "created": "2016-03-22T04:40:55.652-0600",
//                 "items":
//                 [
//                     {
//                         "field": "status",
//                         "fieldtype": "jira",
//                         "from": "10000",
//                         "fromString": "Backlog",
//                         "to": "10700",
//                         "toString": "UX Review"
//                     }
//                 ]
//             },
//             {
//                 "id": "32372",
//                 "author":
//                 {
//                     "self": "https://digitalrig.atlassian.net/rest/api/2/user?username=ashok.chockalingam",
//                     "name": "ashok.chockalingam",
//                     "key": "ashok.chockalingam",
//                     "emailAddress": "ashok.chockalingam@wipro.com",
//                     "avatarUrls":
//                     {
//                         "48x48": "https://secure.gravatar.com/avatar/ca496c8ecf18d8aa471b3353c4db250b?d=mm&s=48",
//                         "24x24": "https://secure.gravatar.com/avatar/ca496c8ecf18d8aa471b3353c4db250b?d=mm&s=24",
//                         "16x16": "https://secure.gravatar.com/avatar/ca496c8ecf18d8aa471b3353c4db250b?d=mm&s=16",
//                         "32x32": "https://secure.gravatar.com/avatar/ca496c8ecf18d8aa471b3353c4db250b?d=mm&s=32"
//                     },
//                     "displayName": "Ashok Bharathi Chockalingam",
//                     "active": false,
//                     "timeZone": "America/Denver"
//                 },
//                 "created": "2016-03-22T23:27:04.360-0600",
//                 "items":
//                 [
//                     {
//                         "field": "status",
//                         "fieldtype": "jira",
//                         "from": "10700",
//                         "fromString": "UX Review",
//                         "to": "10501",
//                         "toString": "In Progress"
//                     }
//                 ]
//             },
//             {
//                 "id": "32530",
//                 "author":
//                 {
//                     "self": "https://digitalrig.atlassian.net/rest/api/2/user?username=darpan.36",
//                     "name": "darpan.36",
//                     "key": "darpan.36",
//                     "emailAddress": "darpan.36@wipro.com",
//                     "avatarUrls":
//                     {
//                         "48x48": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=48",
//                         "24x24": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=24",
//                         "16x16": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=16",
//                         "32x32": "https://secure.gravatar.com/avatar/885cc62992c29993fa7389fb7c00ea70?d=mm&s=32"
//                     },
//                     "displayName": "Darpan",
//                     "active": false,
//                     "timeZone": "America/Denver"
//                 },
//                 "created": "2016-03-24T03:39:03.178-0600",
//                 "items":
//                 [
//                     {
//                         "field": "status",
//                         "fieldtype": "jira",
//                         "from": "10501",
//                         "fromString": "In Progress",
//                         "to": "10700",
//                         "toString": "UX Review"
//                     }
//                 ]
//             }
//         ]
//     },
//     "fields":
//     {
//         "summary": "Select Meeting Screen Changes..",
//         "issuetype":
//         {
//             "self": "https://digitalrig.atlassian.net/rest/api/2/issuetype/10001",
//             "id": "10001",
//             "description": "A user story. Created by JIRA Software - do not edit or delete.",
//             "iconUrl": "https://digitalrig.atlassian.net/secure/viewavatar?size=xsmall&avatarId=10315&avatarType=issuetype",
//             "name": "Story",
//             "subtask": false,
//             "avatarId": 10315
//         },
//         "created": "2016-03-22T02:46:19.000-0600",
//         "reporter":
//         {
//             "self": "https://digitalrig.atlassian.net/rest/api/2/user?username=murugaraj.arjunamurthy",
//             "name": "murugaraj.arjunamurthy",
//             "key": "murugaraj.arjunamurthy",
//             "emailAddress": "murugaraj.arjunamurthy@wipro.com",
//             "avatarUrls":
//             {
//                 "48x48": "https://secure.gravatar.com/avatar/253d32d0af4451e7c56a0914b0ca38eb?d=mm&s=48",
//                 "24x24": "https://secure.gravatar.com/avatar/253d32d0af4451e7c56a0914b0ca38eb?d=mm&s=24",
//                 "16x16": "https://secure.gravatar.com/avatar/253d32d0af4451e7c56a0914b0ca38eb?d=mm&s=16",
//                 "32x32": "https://secure.gravatar.com/avatar/253d32d0af4451e7c56a0914b0ca38eb?d=mm&s=32"
//             },
//             "displayName": "Murugaraj Arjunamurthy",
//             "active": true,
//             "timeZone": "America/Denver"
//         },
//         "priority":
//         {
//             "self": "https://digitalrig.atlassian.net/rest/api/2/priority/3",
//             "iconUrl": "https://digitalrig.atlassian.net/images/icons/priorities/medium.svg",
//             "name": "Medium",
//             "id": "3"
//         },
//         "updated": "2016-03-24T03:39:03.000-0600",
//         "status":
//         {
//             "self": "https://digitalrig.atlassian.net/rest/api/2/status/10700",
//             "description": "",
//             "iconUrl": "https://digitalrig.atlassian.net/images/icons/statuses/generic.png",
//             "name": "UX Review",
//             "id": "10700",
//             "statusCategory":
//             {
//                 "self": "https://digitalrig.atlassian.net/rest/api/2/statuscategory/4",
//                 "id": 4,
//                 "key": "indeterminate",
//                 "colorName": "yellow",
//                 "name": "In Progress"
//             }
//         }
//     }
// }

exports.loadRawData = function(demandInfo, processingInfo, sinceTime) {
  logger.info(`loadBugEntries for ${demandInfo.project} updated since [${sinceTime}]`);

  return new Promise(function (resolve, reject) {
    module.exports.loadJiraDemand(demandInfo, [], sinceTime)
    .then( function (stories) {
      logger.debug(`total stories read - ${stories.length}`);
      if (stories.length < 1) {
        resolve(stories);
      }

      var enhancedStories = module.exports.fixHistoryData(stories);
      processingInfo.storageFunction(processingInfo.dbUrl, processingInfo.rawLocation, enhancedStories)
      .then (function (allRawData) {
        resolve(allRawData);
      })
      .catch(function (reason) {
        reject(reason);
      });

    })
    .catch( function(reason) {
      reject(reason);
    });
  });
}

exports.transformRawToCommon = function(issueData, initialStatus) {
  logger.info('mapJiraDefect into a common format');

  var commonDataFormat = [];

  issueData.forEach(function (aStory) {
    var commonDemandEntry = new utils.CommonDemandEntry(aStory.id);
    var historyEntry = new utils.DemandHistoryEntry(initialStatus, aStory.fields.created);

    aStory.changelog.histories.forEach(function (history) {
      if (history.items.field === 'status') {
        historyEntry.changeDate = utils.dateFormatIWant(history.created);
        commonDemandEntry.history.push(historyEntry);
        historyEntry = new utils.DemandHistoryEntry(history.items.toString, history.created);
      }
    });
    commonDemandEntry.history.push(historyEntry);
    commonDataFormat.push(commonDemandEntry);
  });

  return commonDataFormat;
}

function buildJQL(project, startPosition, since) {
  const expand = ['changelog', 'history', 'items'];
  const fields = ['issuetype', 'created', 'updated', 'status', 'key', 'summary'];
  const jqlData = `search?jql=project=${project} AND issueType=${constants.JIRADEFECTTYPE} AND updated>=${since}`;
  const queryString = `${jqlData}&startAt=${startPosition}&expand=${expand.toString()}&fields=${fields.toString()}`;

  logger.debug(`queryString:[${queryString}]`);
  return queryString;
}

exports.loadJiraDemand = function(demandInfo, issuesSoFar, sinceTime) {
  logger.info(`loadJiraDemand() for JIRA project ${demandInfo.project}.  Start Pos ${issuesSoFar.length}`);

  return new Promise(function (resolve, reject) {
    Rest.get(demandInfo.url + buildJQL(demandInfo.project, issuesSoFar.length, sinceTime),
      {headers: utils.createBasicAuthHeader(demandInfo.userData)}
      ).on('complete', function (data, response) {
        if (response.statusCode === HttpStatus.OK) {
          logger.info(`Success reading demand from [${data.startAt}] count [${data.issues.length}] of [${data.total}]`);

          var issues = issuesSoFar.concat(data.issues);
          if ((data.issues.length > 0) && (issues.length < data.total)) {
            module.exports.loadJiraDemand(demandInfo, issues, sinceTime)
            .then( function(issues) {  // unwind the promise chain
              resolve(issues);
            })
          } else {
            resolve(issues);
          }
        } else {
          logger.error("FAIL: " + response.statusCode + " MESSAGE " + response.statusMessage);
          reject(errorHelper.errorBody(response.statusCode, 'Error retrieving stories from Jira'));
        }
      }).on('fail', function (data, response) {
        logger.error("FAIL: " + response.statusCode + " MESSAGE " + response.statusMessage);
        reject(errorHelper.errorBody(response.statusCode, 'Error retrieving stories from Jira'));
      }).on('error', function (data, response) {
        logger.error("ERROR: " + data.message + " / " + response);
        reject(errorHelper.errorBody(response.statusCode, 'Error retrieving stories from Jira'));
      });
  });
}


// Just what the heck is going on here?
// For whatever reason, when I searialze a Jira Issue,
// the history item array turns into [Object] which isn't helpful at all
// given that the array is always contains 1 element this essentially
// turns the array of 1 element into an object so that it can be stored "correctly"
exports.fixHistoryData = function(stories) {
  logger.info(`fixHistoryData for ${stories.length} stories`);

  stories.forEach(function (aStory) {
    aStory['_id'] = aStory.id;
    aStory.changelog.histories.forEach(function (history) {
      history.items = JSON.parse(JSON.stringify(history.items[0]));
    });
  });

  return(stories);
}
