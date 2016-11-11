'use strict'

const constants = require('../util/constants');
const dataLoader = require('../services/dataLoader');
const HttpMocks = require('node-mocks-http');
const HttpStatus = require('http-status-codes');
const loadEvent = require('../services/v1/loadEvent');
const mongoDB = require('../services/datastore/mongodb');
const Should = require('should');
const Sinon = require('sinon');
require('sinon-as-promised');
const utils = require('../util/utils');

const Config = require('config');
const Log4js = require('log4js');

Log4js.configure('config/log4js_config.json', {});
const logger = Log4js.getLogger();
logger.setLevel(Config.get('log-level'));

const NOPROJECT = 'ShouldNotExistProject';
const UNITTESTPROJECT = 'EventUnitTestProject';

const ERRORRETURN = {error: {status: 'BAD', message: 'FAILED'}};

function buildResponse() {
  return HttpMocks.createResponse({eventEmitter: require('events').EventEmitter})
}

describe('Test GET of Events', function() {
  var anEvent = {};
  var anotherEvent = {};

  before('Create Test Events', function() {
    anEvent = new utils.DataEvent(constants.LOADEVENT);
    anotherEvent = new utils.DataEvent(constants.UPDATEEVENT);
    var events = [anEvent, anotherEvent];
    return mongoDB.insertData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION, events );
  });

  after('Delete Project Details', function() {
    return mongoDB.clearData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION)
  });

  it('Test getting load events', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.OK);
      var body = response._getData();
      Should(body.length).equal(2);
      done();
    });

    loadEvent.listEvents(request, response);
  });

  it('Test getting load events for an invalid project', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': NOPROJECT}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.NOT_FOUND);
      var body = response._getData();
      Should(body.error.statusCode).equal(HttpStatus.NOT_FOUND);
      done();
    });

    loadEvent.listEvents(request, response);
  });
});

describe('Test GET of AN Event', function() {
  var anEvent = {};
  var anotherEvent = {};

  before('Create Test Events', function() {
    anEvent = new utils.DataEvent(constants.LOADEVENT);
    anotherEvent = new utils.DataEvent(constants.UPDATEEVENT);
    var events = [anEvent, anotherEvent];
    return mongoDB.insertData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION, events );
  });

  after('Delete Project Details', function() {
    return mongoDB.clearData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION)
  });

  it('Test getting a single load event', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT, 'id': anotherEvent._id}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.OK);
      var body = response._getData();
      Should(body._id).equal(anotherEvent._id);
      done();
    });

    loadEvent.listAnEvent(request, response);
  });

  it('Test getting an events for an invalid id', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT, 'id': 7}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.NOT_FOUND);
      var body = response._getData();
      Should(body.error.statusCode).equal(HttpStatus.NOT_FOUND);
      done();
    });

    loadEvent.listAnEvent(request, response);
  });

});

describe('Project Load Event Error Path Tests', function() {

  before('Create Test Project', function() {
    const projectData = [{
        name: UNITTESTPROJECT,
        program: "Projection Test Data",
        portfolio: "Unit Test Data",
        description: "A set of basic test data to be used to validate behavior of client systems.",
        startDate: null,
        endDate: null,
        demand: {},
        defect: {},
        effort: {},
        projection: {}}];

    var anEvent = new utils.DataEvent(constants.LOADEVENT);
    var events = [anEvent];
    return mongoDB.insertData(utils.dbCorePath(), constants.PROJECTCOLLECTION, projectData )
      .then( function() {
        return mongoDB.insertData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION, events );
      });
  });

  after('Delete Project Details', function() {
    return mongoDB.clearData(utils.dbCorePath(), constants.PROJECTCOLLECTION)
      .then(function() {
        return mongoDB.clearData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION)
      });
  });

  it('Create an invalid load event type', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': NOPROJECT},
      query: {'type': constants.LOADEVENT + 'FAIL'}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.BAD_REQUEST);
      var body = response._getData();
      Should(body.error.statusCode).equal(HttpStatus.BAD_REQUEST);
      done();
    });

    loadEvent.createNewEvent(request, response);
  });

  it('Create a load event for a non-existant project', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': NOPROJECT},
      query: {'type': constants.LOADEVENT}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.NOT_FOUND);
      var body = response._getData();
      Should(body.error.statusCode).equal(HttpStatus.NOT_FOUND);
      done();
    });

    loadEvent.createNewEvent(request, response);
  });

  it('Try to create a load event when there is an existing open event', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT},
      query: {'type': constants.LOADEVENT}
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.CONFLICT);
      var body = response._getData();
      Should(body.error.statusCode).equal(HttpStatus.CONFLICT);
      done();
    });

    loadEvent.createNewEvent(request, response);
  });
});

describe('Test getting the most recent event', function() {
  var anEvent = {};
  var anotherEvent = {};
  var aThirdEvent = {};
  var eventArray = [];

  before('Create Test Events', function() {
    anEvent = new utils.DataEvent(constants.LOADEVENT);
    anEvent.startTime = new Date(2000, 1, 1, 12, 30, 30);
    anotherEvent = new utils.DataEvent(constants.UPDATEEVENT);
    anotherEvent.startTime = new Date(2000, 2, 2, 12, 30, 30);
    aThirdEvent = new utils.DataEvent(constants.UPDATEEVENT);
    aThirdEvent.startTime = new Date(2000, 3, 3, 12, 30, 30);
    eventArray = [aThirdEvent, anEvent, anotherEvent];

    this.getAllData = Sinon.stub(mongoDB, 'getAllData');
    this.getAllData.onCall(0).resolves(eventArray);
    this.getAllData.onCall(1).resolves([]);
    this.getAllData.onCall(2).rejects(ERRORRETURN);
  });

  after('Delete Project Details', function() {
    mongoDB.getAllData.restore();
  });

  it('Get Most recent Event of many', function() {
    return loadEvent.getMostRecentEvent(UNITTESTPROJECT)
    .then (function(anEvent) {
      Should(anEvent).match(aThirdEvent);
    }).catch ( function(error) {
      logger.debug(error);
      Should.ok(false);
    });
  });

  it('get undefined if no events', function() {
    return loadEvent.getMostRecentEvent(UNITTESTPROJECT)
    .then (function(anEvent) {
      Should(anEvent).equal(null);
    }).catch ( function(error) {
      logger.debug(error);
      Should.ok(false);
    });
  });

  it('test the error path', function() {
    return loadEvent.getMostRecentEvent(UNITTESTPROJECT)
    .then (function(anEvent) {
      logger.debug(anEvent);
      Should.ok(false);
    }).catch ( function(error) {
      logger.debug(error);
      Should(error).match(ERRORRETURN);
    });
  });
});

describe('Testing load and update events SINCE time properties', function() {
  var anEvent = {};
  var eventArray = [];
  const expectedSinceTime = '2015-03-26+12:00';

  before('Create Test Events', function() {
    anEvent = new utils.DataEvent(constants.LOADEVENT);
    anEvent.startTime = new Date('2015-03-25T12:00:00');
    anEvent.endTime = new Date('2015-03-26T12:00:00');
    eventArray = [anEvent];

    this.processProjectData = Sinon.stub(dataLoader, 'processProjectData');
    this.getDocumentByName = Sinon.stub(mongoDB, 'getDocumentByName').resolves(UNITTESTPROJECT);
    this.getAllData = Sinon.stub(mongoDB, 'getAllData').resolves(eventArray);
  });

  after('Delete Project Details', function() {
    mongoDB.getDocumentByName.restore();
    dataLoader.processProjectData.restore();
    return mongoDB.clearData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION)
  });

  it('create an update event', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT},
      query: {'type': constants.UPDATEEVENT}
    });
    dataLoader.processProjectData.returns({
      on:Sinon.stub().yields(null)
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.CREATED);
      var body = response._getData();
      Should(body).have.property('url');
      done();
    });

    loadEvent.createNewEvent(request, response);
  });

  // this is cheating - I made the getMostRecentEvent function public so I
  // could test it - now I'm going to use it to test other things instead
  // of having to re-write that logic.
  it('make sure the update event has the right since time', function() {
    mongoDB.getAllData.restore();

    return loadEvent.getMostRecentEvent(UNITTESTPROJECT)
    .then (function(anEvent) {
      Should(anEvent.since).match(expectedSinceTime);
    }).catch ( function(error) {
      logger.debug(error);
      Should.ok(false);
    });
  });

});

describe('Basic Project Load Event - create', function() {

  before('Create Test Project', function() {
    const projectData = [{
        name: UNITTESTPROJECT,
        program: "Projection Test Data",
        portfolio: "Unit Test Data",
        description: "A set of basic test data to be used to validate behavior of client systems.",
        startDate: null,
        endDate: null,
        demand: {},
        defect: {},
        effort: {},
        projection: {}}];

    return mongoDB.insertData(utils.dbCorePath(), constants.PROJECTCOLLECTION, projectData );
  });

  after('Delete Project Details', function() {
    return mongoDB.clearData(utils.dbCorePath(), constants.PROJECTCOLLECTION)
      .then(function() {
        return mongoDB.clearData(utils.dbProjectPath(UNITTESTPROJECT), constants.EVENTCOLLECTION)
      });
  });

  beforeEach(function() {
    this.processProjectData = Sinon.stub(dataLoader, 'processProjectData');
  });

  afterEach(function() {
    dataLoader.processProjectData.restore();
  })

  it('create a load event', function(done) {
    var response = buildResponse();
    var request  = HttpMocks.createRequest({
      params: {'name': UNITTESTPROJECT},
      query: {'type': constants.LOADEVENT}
    });
    dataLoader.processProjectData.returns({
      on:Sinon.stub().yields(null)
    });

    response.on('end', function() {
      Should(response.statusCode).equal(HttpStatus.CREATED);
      var body = response._getData();
      Should(body).have.property('url');
      done();
    });

    loadEvent.createNewEvent(request, response);
  });
});
