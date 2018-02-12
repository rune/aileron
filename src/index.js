const urlParser = require("url")

let removeTrailingSlash = (urlArray) => {
  if (urlArray[urlArray.length - 1] == "") {
    return urlArray.slice(0,-1)
  } else {
    return urlArray
  }
}

let processUrl = (url) => {
  return(
    removeTrailingSlash(
      urlParser.parse(url).pathname.split("/")
    )
  )
}


let router = (url, controller, strict = false) => {
  url = url.split("/")
  let parsedUrl = []

  url = removeTrailingSlash(url)

  let index = 0
  for (let item of url) {
    if (item.substring(0,1) == ":") {
      parsedUrl[index] = {
        type: "id",
        name: item.substring(1)
      }
    } else if (item == "") {
      parsedUrl[index] = {
        type: "blank",
        name: item
      }
    } else {
      parsedUrl[index] = {
        type: "resource",
        name: item
      }
    }
    index += 1
  }

  let routerMiddleware = (req, res, next) => {
    let match = true
    let data = {}
    let cleanPathName = processUrl(req.url)

    if (strict && cleanPathName.length != parsedUrl.length) {
      // Check for an exact match in strict mode
      next()
      return
    } else if (cleanPathName.length != parsedUrl.length) {
      // Check for an almost exact match otherwise (missing id allowed)
      if (!(parsedUrl[parsedUrl.length - 1].type == "id" && cleanPathName.length == parsedUrl.length - 1)) {
        next()
        return
      }
    }

    let index = 0
    for (let item of cleanPathName) {
      if (item == "") { /* Do nothing */}
      else if (!parsedUrl[index]) {
        match = false
        next()
        return
      } else if (parsedUrl[index].type == "resource" && item != parsedUrl[index].name) {
        match = false
        next()
        return
      } else if (parsedUrl[index].type == "id") {
        data[parsedUrl[index-1].name] = {}
        data[parsedUrl[index-1].name][parsedUrl[index].name] = item
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

module.exports = router
