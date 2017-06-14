connect = require "connect"
request = require "request"
quip = require "quip"
chai = require "chai"
router = require "../src/index"
should = chai.should()

url = require "url"
qs = require "querystring"
bodyParser = require "body-parser"

pr = {}

# Automatically parse query string, pathname and attach to req object
pr.url = (req, res, next) ->
  parsedUrl = url.parse req.url
  req.query = qs.parse parsedUrl.query
  req.pathName = parsedUrl.pathname.split "/"
  next()

# Middleware to parse post requests into req.body
pr.post = bodyParser.urlencoded {extended: false}

# Middleware to parse JSON requests into req.body
pr.json = bodyParser.json {limit: "5mb"}


# Create a temporary server for tests
testServer = connect()

controller1 =
  get: (req, res, next, data) ->
    console.log "controller1"
    res.json {cowId: parseInt(data.cow.id)}

controller2 =
  get: (req, res, next, data) ->
    console.log "controller2"
    if data.complex?.id
      res.ok().json {cowId: parseInt(data.cow.id), complexId: parseInt(data.complex.id)}
    else
      res.ok().json {cowId: parseInt(data.cow.id), complexId: 365}
  post: (req, res, next, data) ->
    console.log "controller2"
    res.ok().json {cowId: parseInt(data.cow.id), complexId: parseInt(data.complex.id) + 1}
  patch: (req, res, next, data) ->
    console.log "controller2"
    res.ok().json {cowId: parseInt(data.cow.id), complexId: parseInt(data.complex.id) + 2}
  put: (req, res, next, data) ->
    console.log "controller2"
    res.ok().json {cowId: parseInt(data.cow.id), complexId: parseInt(data.complex.id) + 3}
  delete: (req, res, next, data) ->
    console.log "controller2"
    res.ok().json {cowId: parseInt(data.cow.id), complexId: parseInt(data.complex.id) + 4}

controller3 =
  patch: (req, res, next, data) ->
    console.log "controller3"
    res.ok().json {monkeyCode: data.monkey.code, complexId: parseInt(data.complex.id) + 4}

controller4 =
  patch: (req, res, next, data) ->
    console.log "controller4"
    res.ok().json {monkeyCode: data.monkey.code, complexId: parseInt(data.complex.id) + 6}

passthrough =
  get: (req, res, next, data) ->
    console.log "passthrough"
    next()

strictModeController =
  get: (req, res, next, data) ->
    console.log "If you see this, it passed through `/strict` which is NORMAL"
    next()

strictModeController2 =
  get: (req, res, next, data) ->
    console.log "If you see this, it passed through `/strict/:id` which is BAD"
    res.ok().json {strictId: parseInt(data.strict.id)}

errorController =
  get: (req, res, next, data) ->
    console.log "errorController"
    res.ok().json {assessmentId: data.assessments.id}

testServer
  .use quip
  .use pr.url
  .use pr.post
  .use pr.json
  .use router "/cow/:id/abc", controller1
  .use router "/app/assessments/:id", passthrough
  .use router "/app/assessments/:id/respondents/:id/questionnaire", errorController
  .use router "/monkey/:code/complex/:id", controller3
  .use router "/cow/:id/complex/:id", controller2
  .use router "/monkey/:code/complex/:id/abc", controller4
  .use router "/cow/:id/def/", controller1
  .use router "/strict", strictModeController
  .use router "/strict/:id", strictModeController2, true
  .use (req, res, next) ->
    res.notFound "Help"
  .listen 3020

reqHost = "http://localhost:3020"

describe "Router", () ->
  it "should handle get requests if supported", (done) ->
    request
      .get "#{reqHost}/cow/12/complex/23", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 23
        done()
  it "should handle get requests without id", (done) ->
    request
      .get "#{reqHost}/cow/12/complex", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 365
        done()
  it "should handle post requests if supported", (done) ->
    request
      .post "#{reqHost}/cow/12/complex/23", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 24
        done()
  it "should handle patch requests if supported", (done) ->
    request
      .patch "#{reqHost}/cow/12/complex/23", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 25
        done()
  it "should handle put requests if supported", (done) ->
    request
      .put "#{reqHost}/cow/12/complex/23", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 26
        done()
  it "should handle delete requests if supported", (done) ->
    request
      .del "#{reqHost}/cow/12/complex/23", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 12
        data.complexId.should.equal 27
        done()
  it "should activate the right controller", (done) ->
    request
      .get "#{reqHost}/cow/15/abc", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 15
        should.not.exist data.complexId
        done()
  it "should ignore trailing slashes", (done) ->
    request
      .get "#{reqHost}/cow/15/def", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 15
        should.not.exist data.complexId
        done()
  it "should ignore trailing slashes", (done) ->
    request
      .get "#{reqHost}/cow/15/def/", (err, response, body) ->
        data = JSON.parse body
        data.cowId.should.equal 15
        should.not.exist data.complexId
        done()
  it "should send a 404 if the request method is not supported", (done) ->
    @timeout 10000
    request
      .patch "#{reqHost}/cow/15/abc", (err, response, body) ->
        response.statusCode.should.equal 404
        done()
  it "should handle string IDs", (done) ->
    request
      .patch "#{reqHost}/monkey/all/complex/27", (err, response, body) ->
        data = JSON.parse body
        data.monkeyCode.should.equal "all"
        data.complexId.should.equal 31
        done()
  it "should not match subset urls", (done) ->
    request
      .get "#{reqHost}/app/assessments/13", (err, response, body) ->
        response.statusCode.should.equal 404
        done()
  it "should pass forward superset urls", (done) ->
    request
      .patch "#{reqHost}/monkey/123/complex/27/abc", (err, response, body) ->
        data = JSON.parse body
        data.monkeyCode.should.equal "123"
        data.complexId.should.equal 33
        done()
  it "should ignore unmatched superset urls", (done) ->
    request
      .get "#{reqHost}/cow/12/complex/12/divi/12", (err, response, body) ->
        response.statusCode.should.equal 404
        done()
  it "should handle trailing slashes correctly", (done) ->
    request
      .patch "#{reqHost}/monkey/all/complex/27/", (err, response, body) ->
        response.statusCode.should.equal 200
        data = JSON.parse body
        data.monkeyCode.should.equal "all"
        data.complexId.should.equal 31
        done()
  it "should not accept subset URLs without id in strict mode", (done) ->
    request
      .get "#{reqHost}/strict", (err, response, body) ->
        response.statusCode.should.equal 404
        done()
