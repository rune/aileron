# Aileron

[![Build Status](https://travis-ci.org/sanjaypojo/aileron.svg?branch=master)](https://travis-ci.org/sanjaypojo/aileron)

Tiny (~150 SLOC) and minimal URL parsing for NodeJS. Designed as a middleware for connect. Matches URLs to paths, supports `:wildcards` (useful for IDs in REST APIs) and specifies request types for an endpoint (GET, POST, PUT, PATCH, DELETE). I use this extensively when creating API servers.

- Use `router` when specifying an exact route.
- Use `middleware` when you only want to match against the beginning of the URL, rather than exact matches.
- Both support `:wildcards` for variables in the URL.

## Typical Use

```javascript
const connect = require("connect")
const { router, middleware } = require("aileron")
const queryDb = require("magical-db-query-lib")

const teamApi = {
  get: (req, res, next, data) => {
    if (data.teamId) {
      res.send(teamDetails(data.teamId))
    } else {
      res.send(teamList())
    }
  },
  put: async (req, res, next, data) => {
    try {
      const result = await updateTeamDetails(data.teamId)
      res.send(result)
    } catch (err) {
      res.send(err)
    }
  }
}

const authMiddleware = (req, res, next, data) => {
  if (isAuthorized(req)) {
    next()
  } else {
    res.send("Unauthorized")
  }
}

let app = connect()

app
  .use(middleware("/api/:apiVersion"), authMiddleware)
  .use(router("/api/:apiVersion/team/:teamId", teamApi))
```

## Middleware

```javascript
middleware(urlFormat, middlewareFunction)
```

- `urlFormat` is a string URL, where you can have `:wildcard` placeholders by prefixing a `:`
- `middlewareFunction` is a function that receives `(req, res, next, data)`.
- If the beginning of the URL matches the provided `urlFormat`, the middleware function is called.
- If the matching fails, `next()` is called.
- The middleware function is passed a `data` parameter, containing the wildcard values.

For example:

```javascript
const printRequestInfo = (req, res, next, data) => {
  console.log(req.method, req.url, data.apiVersion)
  next()
}

let app = connect()

app
  .use(middleware("/api/:apiVersion", printVersionNumber))
  // other middleware / routes follow
  .use(...)
  .use(...)
```

- Note that the URL format that you provide decides the key (`apiVersion`) under which the variable is made available to the middleware function.

## Router

```javascript
router(urlFormat, routerObject)
```

- `urlFormat` is a string URL, where you can have `:wildcard` placeholders by prefixing a `:`
- `routerObject` is an object containing a middleware function for each supported request method `{get: getMiddlewareFunction, post: postMiddlewareFunction}`.
- Each middleware function receives `(req, res, next, data)`
- If the URL exactly matches the `urlFormat`, the middleware function corresponding to the `req.method` is called.
- If the matching fails, `next()` is called.
- Each middleware function is passed a `data` parameter, containing the wildcard values.

For example:

```javascript
const teamApi = {
  get: (req, res, next, data) => {
    if (data.teamId) {
      res.send(teamDetails(data.teamId))
    } else {
      res.send(teamList())
    }
  },
  put: async (req, res, next, data) => {
    try {
      const result = await updateTeamDetails(data.teamId)
      res.send(result)
    } catch (err) {
      res.send(err)
    }
  }
}

let app = connect()

app
  // Other routes and middlewares
  .use(...)
  .use(...)
  // The team route
  .use(router("/api/:apiVersion/team/:teamId", teamApi))
  // Other routes and middlewares
  .use(...)
  .use(...)
```

- Note that the URL format that you provide decides the key (`apiVersion`) under which the variable is made available to the middleware function.
