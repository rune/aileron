# Aileron

[![Build Status](https://travis-ci.org/rune/aileron.svg?branch=master)](https://travis-ci.org/rune/aileron.svg?branch=master)

Aileron simplifies an API server to these steps:

- The connect server maps `URL pattern` strings to `handler` functions.
- If the `handler` returns a value (typically a JSON object), this is sent as a 200 response.
- If the `handler` throws an error, this is sent as a 500 response.

Additional features:

- `URL pattern` strings support `:wildcards`, which are useful for specifying IDs in the URL string for example.
- You can specify different `handler` functions for different request methods (GET, POST, PUT, PATCH, DELETE).
- You can customize the centralized `successHandler` and `errHandler` functions to perform tasks like logging, specifying different status codes etc.
- You can specify type definitions for `inputs` to APIs. Aileron will check requests and reject incorrect inputs with a 409 response. This response can also be customized through a centralized `badInputHandler` function.

Middlewares:

- For tasks like authentication, we require a way to create a "gatekeeper" functions, that allow only some requests through.
- For this, aileron allows you to define a `middleware`.
- Middleware are different from normal routes in two ways:
  - You can use `middleware` when you only want to match against the beginning of the URL, rather than exact matches.
  - When a middleware `handler` function returns, we don't send a response, we call `next()`, sending the request forward along the connect server chain.

## Typical Use

```javascript
const connect = require("connect")
const aileron = require("aileron")

const { router, middleware } = aileron()

const teamDetails = {
  get: {
    errMsg: "Unable to retrieve team details"
    handler: async (req, data) => {
      const teamDetails = await getTeamDetails(data.teamId)
      return { id: data.teamId, teamDetails }
    }
  },
  put: {
    errMsg: "Unable to update team details"
    handler: async (req, data) => {
      const result = await updateTeamDetails(data.teamId, data.teamList)
      return result
    }
  }
}

const authMiddleware = {
  errMsg: "Unauthorized request",
  handler: (req, data) => {
    const isAuthorized = await authorize(req)
  }
}

let app = connect()

app
  .use(middleware("/api/:apiVersion"), authMiddleware)
  .use(router("/api/:apiVersion/team/:teamId", teamDetails))
```

## Router

```javascript
router(urlFormat, routeConfig)
```

- `urlFormat` is a string URL, where you can have `:wildcard` placeholders by prefixing a `:`
  ```javascript
  // urlFormatExample
  "/api/:apiVersion/authenticate"
  ```
- `routeConfig` is an object containing a handler for each supported request method.
  ```javascript
  // route config example
  const routeConfig = {
    post: // Request method
      {
        inputs: // Input type definitions,
        errMsg: // Error message string,
        handler: (req, data) => {
          // Function that returns a value.
          // Returned value is passed to the successHandler which sends a response
          // If an err is thrown, it is passed errHandler which sends a response
        }
      }
  }
  ```
- Each handler receives `(req, data)`
- If the URL exactly matches the `urlFormat`, the handler for the corresponding `req.method` is called.
- If the matching fails, `next()` is called.
- Each route allows you to specify the `inputs` it receives and their types. If inputs are missing / incorrect, aileron will automatically invoke `badInputHandler` with a detailed error object. For advanced input validation, see the `Input Checking` section.
- Each handler function is passed a `data` parameter. This will contain the wildcard values and the parsed inputs, ready for use.

For example:

```javascript
const loginApi = {
  post: {
    inputs: { username: "String", password: "String" },
    errMsg: "Unable to login. Please try again!",
    handler: async (req, data) => {
      const userDetails = await loginUser(data.username, data.password, data.apiVersion)
      return {message: "Login successful", userDetails}
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

- Note that the URL format that you provide decides the key (`apiVersion`) under which the variable is made available to the handler function.

## Middleware

```javascript
middleware(urlFormat, routeConfig)
```

Very similar to router, so we only explain the differences:

- If the beginning of the URL matches the provided `urlFormat`, the middleware function is called.
- If the `handler` function returns, `next()` is called.
- If the `handler` function throws, the `errHandler` is called.

For example:

```javascript
const printRequestInfo = (req, data) => {
  console.log(req.method, req.url, data.apiVersion)
}

let app = connect()

app
  .use(middleware("/api/:apiVersion", printVersionNumber))
  // other middleware / routes follow
  .use(...)
  .use(...)
```

- Note that the URL format that you provide decides the key (`apiVersion`) under which the variable is made available to the middleware function.

### Input checking

- As mentioned above, aileron supports input checking by simply configuring an "inputs" object and an error message.
- Aileron uses the [type-check](https://www.npmjs.com/package/type-check) library to validate inputs. Check the library docs for a list of valid type definitions.
- For advanced input checking, aileron allows you to define an `inputCheck` function. This function receives all the parsed inputs specified in your `inputs` object. Simply throw an error inside this function and `badInputHandler` will be called with the thrown error.
- For optional inputs, you can use `?` to specify they're optional. `{age: "Number | Undefined"}` can be written as `{age: "Number?"}`

```javascript
const inputCheckingController = {
  post: {
    inputs: { name: "String", age: "Number" },
    inputCheck: parsedInputs => {
      // Custom check to disallow the name "Jon Snow"
      if (parsedInputs.name === "Jon Snow") {
        throw "You know nothing, Jon Snow"
      }
    },
    errMsg: "Unable to process your request.",
    handler: (req, res, next, data) => {
      const { name, age } = data
      res.ok().json({ name, age })
    }
  }
}
```

## Error handling

- Aileron automatically wraps all your middlewares / handlers in a try-catch block and sends an error response if an uncaught error occurs.
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
