'use strict'

const constants = require('../util/constants');
const myEffort = require('../services/effort');
const Should = require('should');
const utils = require('../util/utils');

const Config = require('config');
const Log4js = require('log4js');

Log4js.configure('config/log4js_config.json', {});
const logger = Log4js.getLogger();
logger.setLevel(Config.get('log-level'));

const PROJECTNAME = 'UNITESTEFFORT';
const GOODPROJECT = 10284278;
const GOODSOURCE = 'Harvest';

const EFFORTINFO = {
  source: GOODSOURCE,
  url: 'https://builditglobal.harvestapp.com',
  project: GOODPROJECT,
  authPolicy: 'Basic',
  userData: 'cGF1bC5rYXJzdGVuQHdpcHJvLmNvbTpXaDFwSXRHMDBk',
  role: []};

const COMMONDATA = [
  {
    day: '2015-10-21',
    role: 'Delivery',
    effort: 8
  },
  {
    day: '2015-10-22',
    role: 'Delivery',
    effort: 8
  }
];

const EXPECTEDSUMMARYEFFORT = [
  { projectDate: '2015-10-21', activity: { 'Delivery': 8 } },
  { projectDate: '2015-10-22', activity: { 'Delivery': 8 } }
];

describe('configure Processing info', function() {
  var originalInfo = null;

  before('setup', function() {
    originalInfo = new utils.ProcessingInfo(utils.dbProjectPath(PROJECTNAME));
    originalInfo.rawLocation = constants.RAWEFFORT;
    originalInfo.commonLocation = constants.COMMONEFFORT;
    originalInfo.summaryLocation = constants.SUMMARYEFFORT;
    originalInfo.eventSection = constants.EFFORTSECTION;
  });

  it('Call effort function - should not effect the original object', function() {
    var effortInfo = myEffort.configureProcessingInstructions(originalInfo);

    Should(effortInfo).not.deepEqual(originalInfo);
    Should(effortInfo.rawLocation).equal(constants.RAWEFFORT);
  });
});

describe('determine effort processing system', function() {
  it('Should decode Harvest', function() {
    var systemClass = myEffort.rawDataProcessor(EFFORTINFO);
    Should(systemClass).not.equal(null);
  });

  it('Should NOT decode not Harvest', function() {
    var badEffort = JSON.parse(JSON.stringify(EFFORTINFO));
    badEffort.source = GOODSOURCE + 'BADMAN';
    var systemClass = myEffort.rawDataProcessor(badEffort);
    Should(systemClass).equal(null);
  });
});

describe('convert common to summary', function() {

  it('Should translate', function() {
    var summaryData = myEffort.transformCommonToSummary(COMMONDATA);
    Should(summaryData).deepEqual(EXPECTEDSUMMARYEFFORT);
  });
});
