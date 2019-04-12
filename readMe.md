# Aileron

[![Build Status](https://travis-ci.org/sanjaypojo/aileron.svg?branch=master)](https://travis-ci.org/sanjaypojo/aileron)

URL parsing, routing and input checks for NodeJS APIs. Designed as a middleware for connect. Matches URLs to paths, supports `:wildcards` (useful for IDs in REST APIs) and specifies request types for an endpoint (GET, POST, PUT, PATCH, DELETE). Also allows you to specify type checks for inputs and automatically throw errors for incorrect inputs. I use this extensively when creating API servers.

- Use `router` when specifying an exact route.
- Use `middleware` when you only want to match against the beginning of the URL, rather than exact matches.
- Both support `:wildcards` for variables in the URL.

## Typical Use

```javascript
const connect = require("connect")
const aileron = require("aileron")
const queryDb = require("magical-db-query-lib")

const { router, middleware } = aileron()

const teamApi = {
  get: {
    handler: (req, res, next, data) => {
      if (data.teamId) {
        res.send(teamDetails(data.teamId))
      } else {
        res.send(teamList())
      }
    }
  },
  put: {
    handler: async (req, res, next, data) => {
      try {
        const result = await updateTeamDetails(data.teamId)
        res.send(result)
      } catch (err) {
        res.send(err)
      }
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
router(urlFormat, routeConfig)
```

- `urlFormat` is a string URL, where you can have `:wildcard` placeholders by prefixing a `:`
  ```javascript
  // urlFormatExample
  "/api/:apiVersion/authenticate"
  ```
- `routeConfig` is an object containing a middleware function for each supported request method.
  ```javascript
  // route config example
  const routeConfig = {
    post: {
      inputs: { username: "String", password: "String" },
      errMsg: "Unable to login. Please try again!",
      handler: (req, res, next, data) => {
        // Log user in and send a response!
      }
    }
  }
  ```
- Each handler receives `(req, res, next, data)`
- If the URL exactly matches the `urlFormat`, the handler for the corresponding `req.method` is called.
- If the matching fails, `next()` is called.
- Each route allows you to specify the `inputs` it receives and their types. If inputs are missing / incorrect, aileron will automatically respond with an error (409).
- Each handler function is passed a `data` parameter. This will contain the wildcard values and the parsed inputs, ready for use.

For example:

```javascript
const loginApi = {
  post: {
    inputs: { username: "String", password: "String" },
    errMsg: "Unable to login. Please try again!",
    handler: (req, res, next, data) => {
      if (data.apiVersion === "v2") {
        res.send(loginUser(data.username, data.password))
      } else {
        res.send({err: "Legacy API is deprecated. Upgrade to v2"})
      }
    }
  }
}

let app = connect()

app
  // Other routes and middleware
  .use(...)
  .use(...)
  // The team route
  .use(router("/api/:apiVersion/team/:teamId", teamApi))
  // Other routes and middleware
  .use(...)
  .use(...)
```

- Note that the URL format that you provide decides the key (`apiVersion`) under which the variable is made available to the middleware function.

### Input checking

- As mentioned above, aileron supports input checking by simply configuring an "inputs" object and an error message.
- Aileron uses the [type-check](https://www.npmjs.com/package/type-check) library to validate inputs. Check the library docs for a list of valid type definitions.

## Error handling

- Aileron automatically wraps all your handlers in a try-catch block and sends an error response if an uncaught error occurs.
- This prevents your node server from crashing :)
- Aileron allows you customize these error handlers.
- You can supply an `errHandler` and a `badInputHandler` when you initialize Aileron.
- Here is an example:

```javascript
// MyCoolProject
const { router, middleware } = aileron({
  badInputHandler: (req, res, err, errMsg) =>
    res.forbidden().json({ err, message: "Bad Input: " + errMsg }),
  errHandler: (req, res, err, errMsg) =>
    res.error().json({ err, message: "Uncaught error!!" })
})
```

## Strict Mode

- Aileron allows a strict mode, where it will force you to provide `inputs` and `errMsg` for all handlers.
- Strict mode will also complain if you have not supplied custom error handlers.
- This ensures that error handling code is always supplied for every API in your project.
- To enable strict mode, simply supply it as an option when you initialize aileron.

```javascript
// MyCoolProject
const { router, middleware } = aileron({
  strict: true,
  badInputHandler: (req, res, err, errMsg) =>
    res.forbidden().json({ err, message: "Bad Input: " + errMsg }),
  errHandler: (req, res, err, errMsg) =>
    res.error().json({ err, message: "Uncaught error!!" })
})
```
