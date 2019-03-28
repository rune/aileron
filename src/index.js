const urlParser = require("url")

const removeTrailingSlash = urlArray => {
  if (urlArray[urlArray.length - 1] == "") {
    return urlArray.slice(0, -1)
  } else {
    return urlArray
  }
}

const processUrl = url => {
  return removeTrailingSlash(urlParser.parse(url).pathname.split("/"))
}

const processUrlFormat = urlFormat => {
  let parsedUrlFormat = []

  const urlFormatArray = removeTrailingSlash(urlFormat.split("/"))

  let index = 0
  for (let item of urlFormatArray) {
    if (item.substring(0, 1) == ":") {
      parsedUrlFormat[index] = {
        type: "id",
        name: item.substring(1)
      }
    } else if (item == "") {
      parsedUrlFormat[index] = {
        type: "blank",
        name: item
      }
    } else {
      parsedUrlFormat[index] = {
        type: "resource",
        name: item
      }
    }
    index += 1
  }

  return parsedUrlFormat
}

const router = (urlFormat, controller, strict = false) => {
  const parsedUrlFormat = processUrlFormat(urlFormat)
  let routerMiddleware = (req, res, next) => {
    let match = true
    let data = {}
    const cleanUrlArray = processUrl(req.url)

    if (strict && cleanUrlArray.length != parsedUrlFormat.length) {
      // Check for an exact match in strict mode
      next()
      return
    } else if (cleanUrlArray.length != parsedUrlFormat.length) {
      // Check for an almost exact match otherwise (missing id allowed)
      if (
        !(
          parsedUrlFormat[parsedUrlFormat.length - 1].type == "id" &&
          cleanUrlArray.length == parsedUrlFormat.length - 1
        )
      ) {
        next()
        return
      }
    }

    let index = 0
    for (let item of cleanUrlArray) {
      if (item == "") {
        /* Do nothing */
      } else if (!parsedUrlFormat[index]) {
        match = false
        next()
        return
      } else if (
        parsedUrlFormat[index].type == "resource" &&
        item != parsedUrlFormat[index].name
      ) {
        match = false
        next()
        return
      } else if (parsedUrlFormat[index].type == "id") {
        data[parsedUrlFormat[index].name] = item
      }
      index += 1
    }

    if (req.method == "GET" && controller.get && match) {
      controller.get(req, res, next, data)
    } else if (req.method == "POST" && controller.post && match) {
      controller.post(req, res, next, data)
    } else if (req.method == "DELETE" && controller.delete && match) {
      controller.delete(req, res, next, data)
    } else if (req.method == "PUT" && controller.put && match) {
      controller.put(req, res, next, data)
    } else if (req.method == "PATCH" && controller.patch && match) {
      controller.patch(req, res, next, data)
    } else {
      next()
    }
  }

  return routerMiddleware
}

// Middleware that can process wildcards
const middleware = (urlFormat, middlewareFunction) => {
  const parsedUrlFormat = processUrlFormat(urlFormat)

  let routerMiddleware = (req, res, next) => {
    let data = {}
    const cleanUrlArray = processUrl(req.url)

    if (cleanUrlArray.length < parsedUrlFormat.length) {
      // Url cannot be shorter than the url format, except for an optional id
      // The one corner case is that it is shorter by exactly 1 unit (the optional id)
      if (
        !(
          parsedUrlFormat[parsedUrlFormat.length - 1].type === "id" &&
          cleanUrlArray.length === parsedUrlFormat.length - 1
        )
      ) {
        next()
        return
      }
    }

    let index = 0
    for (let item of cleanUrlArray) {
      if (index > parsedUrlFormat.length - 1) {
        // Only check the part of the URL in the url format
        break
      }
      if (item == "") {
        /* Do nothing */
      } else if (
        parsedUrlFormat[index].type === "resource" &&
        item !== parsedUrlFormat[index].name
      ) {
        next()
        return
      } else if (parsedUrlFormat[index].type === "id") {
        data[parsedUrlFormat[index].name] = item
      }
      index += 1
    }

    middlewareFunction(req, res, next, data)
  }

  return routerMiddleware
}

exports.middleware = middleware

exports.router = router
