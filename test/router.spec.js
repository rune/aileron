const connect = require("connect")
const request = require("request")
const quip = require("quip")
const chai = require("chai")
const router = require("../src/index")
const should = chai.should()

// Create a temporary server for tests
let testServer = connect()

const controller1 = {
  get: (req, res, next, data) => {
    console.log("controller1")
    res.json({cowId: parseInt(data.cow.id)})
  }
}

const controller2 = {
  get: (req, res, next, data) => {
    console.log("controller2")
    if (data.complex && data.complex.id) {
      res.ok().json({
        cowId: parseInt(data.cow.id),
        complexId: parseInt(data.complex.id)
      })
    } else {
      res.ok().json({
        cowId: parseInt(data.cow.id),
        complexId: 365
      })
    }
  },
  post: (req, res, next, data) => {
    console.log("controller2")
    res.ok().json({
      cowId: parseInt(data.cow.id),
      complexId: parseInt(data.complex.id) + 1
    })
  },
  patch: (req, res, next, data) => {
    console.log("controller2")
    res.ok().json({
      cowId: parseInt(data.cow.id),
      complexId: parseInt(data.complex.id) + 2
    })
  },
  put: (req, res, next, data) => {
    console.log("controller2")
    res.ok().json({
      cowId: parseInt(data.cow.id),
      complexId: parseInt(data.complex.id) + 3
    })
  },
  delete: (req, res, next, data) => {
    console.log("controller2")
    res.ok().json({
      cowId: parseInt(data.cow.id),
      complexId: parseInt(data.complex.id) + 4
    })
  }
}

const controller3 = {
  patch: (req, res, next, data) => {
    console.log("controller3")
    res.ok().json({
      monkeyCode: data.monkey.code,
      complexId: parseInt(data.complex.id) + 4
    })
  }
}

const controller4 = {
  patch: (req, res, next, data) => {
    console.log("controller4")
    res.ok().json({
      monkeyCode: data.monkey.code,
      complexId: parseInt(data.complex.id) + 6
    })
  }
}

const passthrough = {
  get: (req, res, next, data) => {
    console.log("passthrough")
    next()
  }
}

const strictModeController = {
  get: (req, res, next, data) => {
    console.log("If you see this, it passed through `/strict` which is NORMAL")
    next()
  }
}

const strictModeController2 = {
  get: (req, res, next, data) => {
    console.log("If you see this, it passed through `/strict/:id` which is BAD")
    res.ok().json({strictId: parseInt(data.strict.id)})
  }
}

const errorController = {
  get: (req, res, next, data) => {
    console.log("errorController")
    res.ok().json({assessmentId: data.assessments.id})
  }
}

let runningServer = testServer
  .use(quip)
  .use(router("/cow/:id/abc", controller1))
  .use(router("/app/assessments/:id", passthrough))
  .use(router("/app/assessments/:id/respondents/:id/questionnaire", errorController))
  .use(router("/monkey/:code/complex/:id", controller3))
  .use(router("/cow/:id/complex/:id", controller2))
  .use(router("/monkey/:code/complex/:id/abc", controller4))
  .use(router("/cow/:id/def/", controller1))
  .use(router("/strict", strictModeController))
  .use(router("/strict/:id", strictModeController2, true))
  .use((req, res, next) => res.notFound("Help"))
  .listen(3000)

let reqHost = "http://localhost:3000"

describe ("Router", () => {

  after(() => {
    runningServer.close()
  })

  it("should handle get requests if supported", (done) => {
    request
      .get(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(23)
        done()
      })
  })
  it("should handle get requests without id", (done) => {
    request
      .get(`${reqHost}/cow/12/complex`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(365)
        done()
      })
  })
  it("should handle post requests if supported", (done) => {
    request
      .post(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(24)
        done()
      })
  })
  it("should handle patch(requests if supported", (done) => {
    request
      .patch(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(25)
        done()
      })
  })
  it("should handle put requests if supported", (done) => {
    request
      .put(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(26)
        done()
      })
  })
  it("should handle delete requests if supported", (done) => {
    request
      .del(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(27)
        done()
      })
  })
  it("should activate the right controller", (done) => {
    request
      .get(`${reqHost}/cow/15/abc`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
  })
  it("should ignore trailing slashes", (done) => {
    request
      .get(`${reqHost}/cow/15/def`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
  })
  it("should ignore trailing slashes", (done) => {
    request
      .get(`${reqHost}/cow/15/def/`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
  })
  it("should send a 404 if the request method is not supported", (done) => {
    request
      .patch(`${reqHost}/cow/15/abc`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
  })
  it("should handle string IDs", (done) => {
    request
      .patch(`${reqHost}/monkey/all/complex/27`, (err, response, body) => {
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("all")
        data.complexId.should.equal(31)
        done()
      })
  })
  it("should not match subset urls", (done) => {
    request
      .get(`${reqHost}/app/assessments/13`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
  })
  it("should pass forward superset urls", (done) => {
    request
      .patch(`${reqHost}/monkey/123/complex/27/abc`, (err, response, body) => {
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("123")
        data.complexId.should.equal(33)
        done()
      })
  })
  it("should ignore unmatched superset urls", (done) => {
    request
      .get(`${reqHost}/cow/12/complex/12/divi/12`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
  })
  it("should handle trailing slashes correctly", (done) => {
    request
      .patch(`${reqHost}/monkey/all/complex/27/`, (err, response, body) => {
        response.statusCode.should.equal(200)
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("all")
        data.complexId.should.equal(31)
        done()
      })
  })
  it("should not accept subset URLs without id in strict mode", (done) => {
    request
      .get(`${reqHost}/strict`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
    }
  )
})
