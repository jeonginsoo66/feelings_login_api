import jwt from "jsonwebtoken";

let util = {};

util.parseError = function (errors) {
  let parsed = {};

  if (errors.name == "ValidationError") {
    for (let name in errors.errors) {
      let ValidationError = errors.errors[name];
      parsed[name] = { message: ValidationError.message };
    }
  } else if (errors.code == "11000" && errors.errmsg.indexOf("username") > 0) {
    parsed.username = { message: "This username already exists!" };
  } else {
    parsed.unhandled = errors;
  }

  return parsed;
};

util.successTrue = function (data) {
  return {
    success: true,
    message: null,
    errors: null,
    data: data,
  };
};

util.successFalse = function (err, message) {
  if (!err && !message) {
    message = "data not found";
  }
  return {
    success: false,
    message: message,
    errors: err ? util.parseError(err) : null,
    data: null,
  };
};

// middlewares
util.isLoggedin = (req, res, next) => {
  let token = null;

  token = req.headers["x-access-token"];

  if (!token) {
    return res.json(util.successFalse(null, "token is required!"));
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.json(util.successFalse(err));
      } else {
        req.decoded = decoded;
        next();
      }
    });
  }
};

module.exports = util;
