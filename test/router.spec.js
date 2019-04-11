const connect = require("connect")
const request = require("request")
const quip = require("quip")
const chai = require("chai")
const aileron = require("../src/index")
const should = chai.should()

const { router, middleware } = aileron()

// Create a temporary server for tests
let testServer = connect()

const controller1 = {
  get: {
    handler: (req, res, next, data) => {
      res.json({ cowId: parseInt(data.cowId) })
    }
  }
}

const controller2 = {
  get: {
    handler: (req, res, next, data) => {
      if (data.complexId) {
        res.ok().json({
          cowId: parseInt(data.cowId),
          complexId: parseInt(data.complexId)
        })
      } else {
        res.ok().json({
          cowId: parseInt(data.cowId),
          complexId: 365
        })
      }
    }
  },
  post: {
    handler: (req, res, next, data) => {
      res.ok().json({
        cowId: parseInt(data.cowId),
        complexId: parseInt(data.complexId) + 1
      })
    }
  },
  patch: {
    handler: (req, res, next, data) => {
      res.ok().json({
        cowId: parseInt(data.cowId),
        complexId: parseInt(data.complexId) + 2
      })
    }
  },
  put: {
    handler: (req, res, next, data) => {
      res.ok().json({
        cowId: parseInt(data.cowId),
        complexId: parseInt(data.complexId) + 3
      })
    }
  },
  delete: {
    handler: (req, res, next, data) => {
      res.ok().json({
        cowId: parseInt(data.cowId),
        complexId: parseInt(data.complexId) + 4
      })
    }
  }
}

const controller3 = {
  patch: {
    handler: (req, res, next, data) => {
      res.ok().json({
        monkeyCode: data.monkeyCode,
        complexId: parseInt(data.complexId) + 4
      })
    }
  }
}

const controller4 = {
  patch: {
    handler: (req, res, next, data) => {
      res.ok().json({
        monkeyCode: data.monkeyCode,
        complexId: parseInt(data.complexId) + 6
      })
    }
  }
}

const passthrough = {
  get: {
    handler: (req, res, next, data) => {
      next()
    }
  }
}

const strictModeController = {
  get: {
    handler: (req, res, next, data) => {
      console.log("If you see this, it passed through `/strict` which is NORMAL")
      next()
    }
  }
}

const strictModeController2 = {
  get: {
    handler: (req, res, next, data) => {
      console.log("If you see this, it passed through `/strict/:strictId` which is BAD")
      res.ok().json({ strictId: parseInt(data.strictId) })
    }
  }
}

const errorController = {
  get: {
    handler: (req, res, next, data) => {
      res.ok().json({ assessmentId: data.assessmentId })
    }
  }
}

const middleware1 = (req, res, next, data) => {
  res.ok().json({ middlewareCode: data.middlewareCode })
}

const middleware2 = (req, res, next, data) => {
  res.ok().json({ optionalCode: data.optionalCode })
}

let runningServer = testServer
  .use(quip)
  .use(middleware("/middleware/:middlewareCode/middleware1", middleware1))
  .use(middleware("/middleware/:id/middleware2/:optionalCode", middleware2))
  .use(router("/cow/:cowId/abc", controller1))
  .use(router("/app/assessments/:assessmentId", passthrough))
  .use(
    router(
      "/app/assessments/:assessmentId/respondents/:respondentId/questionnaire",
      errorController
    )
  )
  .use(router("/monkey/:monkeyCode/complex/:complexId", controller3))
  .use(router("/cow/:cowId/complex/:complexId", controller2))
  .use(router("/monkey/:monkeyCode/complex/:complexId/abc", controller4))
  .use(router("/cow/:cowId/def/", controller1))
  .use(router("/strict", strictModeController))
  .use(router("/strict/:strictId", strictModeController2, true))
  .use((req, res, next) => res.notFound("Help"))
  .listen(3003)

let reqHost = "http://localhost:3003"

describe("Router and Middleware Tests", () => {
  after(() => {
    runningServer.close()
  })

  describe("Router", () => {
    it("should handle get requests if supported", done => {
      request.get(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(23)
        done()
      })
    })
    it("should handle get requests without id", done => {
      request.get(`${reqHost}/cow/12/complex`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(365)
        done()
      })
    })
    it("should handle post requests if supported", done => {
      request.post(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(24)
        done()
      })
    })
    it("should handle patch requests if supported", done => {
      request.patch(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(25)
        done()
      })
    })
    it("should handle put requests if supported", done => {
      request.put(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(26)
        done()
      })
    })
    it("should handle delete requests if supported", done => {
      request.del(`${reqHost}/cow/12/complex/23`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(12)
        data.complexId.should.equal(27)
        done()
      })
    })
    it("should activate the right controller", done => {
      request.get(`${reqHost}/cow/15/abc`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
    })
    it("should ignore trailing slashes", done => {
      request.get(`${reqHost}/cow/15/def`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
    })
    it("should ignore trailing slashes", done => {
      request.get(`${reqHost}/cow/15/def/`, (err, response, body) => {
        let data = JSON.parse(body)
        data.cowId.should.equal(15)
        should.not.exist(data.complexId)
        done()
      })
    })
    it("should send a 404 if the request method is not supported", done => {
      request.patch(`${reqHost}/cow/15/abc`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
    })
    it("should handle string IDs", done => {
      request.patch(`${reqHost}/monkey/all/complex/27`, (err, response, body) => {
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("all")
        data.complexId.should.equal(31)
        done()
      })
    })
    it("should not match subset urls", done => {
      request.get(`${reqHost}/app/assessments/13`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
    })
    it("should pass forward superset urls", done => {
      request.patch(`${reqHost}/monkey/123/complex/27/abc`, (err, response, body) => {
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("123")
        data.complexId.should.equal(33)
        done()
      })
    })
    it("should ignore unmatched superset urls", done => {
      request.get(`${reqHost}/cow/12/complex/12/divi/12`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
    })
    it("should handle trailing slashes correctly", done => {
      request.patch(`${reqHost}/monkey/all/complex/27/`, (err, response, body) => {
        response.statusCode.should.equal(200)
        let data = JSON.parse(body)
        data.monkeyCode.should.equal("all")
        data.complexId.should.equal(31)
        done()
      })
    })
    it("should not accept subset URLs without id in strict mode", done => {
      request.get(`${reqHost}/strict`, (err, response, body) => {
        response.statusCode.should.equal(404)
        done()
      })
    })
  })

  describe("Middleware", () => {
    it("should work for partial matches", done => {
      request.post(
        `${reqHost}/middleware/77/middleware1/any/paths/allowed/here`,
        (err, response, body) => {
          response.statusCode.should.equal(200)
          const data = JSON.parse(body)
          data.middlewareCode.should.equal("77")
          done()
        }
      )
    })
    it("should work for partial matches with an ID at the end", done => {
      request.post(
        `${reqHost}/middleware/77/middleware2/12/paths/allowed/here`,
        (err, response, body) => {
          response.statusCode.should.equal(200)
          const data = JSON.parse(body)
          data.optionalCode.should.equal("12")
          done()
        }
      )
    })
    it("should work for partial matches with missing ID at the end", done => {
      request.post(`${reqHost}/middleware/77/middleware2`, (err, response, body) => {
        response.statusCode.should.equal(200)
        const data = JSON.parse(body)
        should.not.exist(data.optionalCode)
        done()
      })
    })
  })
})
