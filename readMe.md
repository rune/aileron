# Aileron

[![Build Status](https://travis-ci.org/sanjaypojo/aileron.svg?branch=master)](https://travis-ci.org/sanjaypojo/aileron)

Tiny (<100 SLOC) and minimal URL parsing for NodeJS. Designed as a middleware for connect. Matches URLs to paths, supports wildcards (useful for IDs in REST APIs) and specifies request types for an endpoint (GET, POST, PUT, PATCH, DELETE). I use this extensively when creating API servers.

## Typical Use
```javascript
const connect = require("connect")
const router = require("aileron")
const queryDb = require("magical-db-query-lib")

let app = connect()

app
  .use(router("/team/:id", {
    get: (req, res, next, urlData) => {
      if (urlData.team.id) {
        res.send(teamDetails(urlData.team.id))
      } else {
        res.send(teamList())
      }
    },
    put: (req, res, next, urlData) => {
      updateTeamDetails(urlData.team.id, (err, result) => {
        if (err) {
          // Add error headers and stuff
          res.send(err)
        } else {
          res.send(result)
        }
      })
    }
  }))
```
