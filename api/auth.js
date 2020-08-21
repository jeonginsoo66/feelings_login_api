import express from "express";
import User from "../models/user";
import util from "../util";
import jwt from "jsonwebtoken";
import request from "request";

const authRouter = express.Router();

// login
authRouter.post(
  "/login",
  (req, res, next) => {
    const isValid = true;
    const validationError = {
      name: "ValidationError",
      errors: {},
    };

    if (!req.body.username) {
      isValid = false;
      validationError.errors.username = { message: "Username is required!" };
    }

    if (!req.body.password) {
      isValid = false;
      validationError.errors.password = { message: "Password is required!" };
    }

    if (!isValid) {
      return res.json(util.successFalse(validationError));
    } else {
      next();
    }
  },
  (req, res) => {
    User.findOne({ username: req.body.username })
      .select({ password: 1, username: 1, name: 1 })
      .exec((err, user) => {
        if (err) {
          return res.json(util.successFalse(err));
        } else if (!user || !user.authenticate(req.body.password)) {
          return res.json(
            util.successFalse(null, "Username or Password is invalid")
          );
        } else {
          const payload = {
            _id: user._id,
            username: user.username,
          };

          const secretOrPrivateKey = process.env.JWT_SECRET;
          const options = { expiresIn: 60 * 60 * 24 };
          jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
            if (err) {
              return res.json(util.successFalse(err));
            }

            res.json(util.successTrue(token));
          });
        }
      });
  }
);

// me
authRouter.get("/me", util.isLoggedin, (req, res) => {
  //console.log(req.decoded);
  User.findById(req.decoded._id).exec((err, user) => {
    if (err || !user) {
      return res.json(util.successFalse(err));
    }
    res.json(util.successTrue(user));
  });
});

// refresh
authRouter.get("/refresh", util.isLoggedin, (req, res) => {
  User.findById(req.decoed._id).exec((err, user) => {
    if (err || !user) {
      return res.json(util.successFalse(err));
    } else {
      const payload = {
        _id: user._id,
        username: user.username,
      };

      const secretOrPrivateKey = process.env.JWT_SECRET;
      const options = { expiresIn: 60 * 60 * 24 };
      jwt.sign(payload, secretOrPrivateKey, options, (err, token) => {
        if (err) {
          return res.json(util.successFalse(err));
        }

        res.json(util.successTrue(token));
      });
    }
  });
});

// 외부에서 사용할 때
const loginResult = (id, pw) => {
  const getToken = new Promise((resolve, reject) => {
    request(
      {
        url: "http://localhost:4100/api/auth/login",
        form: {
          username: id,
          password: pw,
        },
        method: "post",
        json: true,
      },
      (e, r, body) => {
        resolve(body);
      }
    );
  });

  return getToken;
};

let getToken = null;

authRouter.get("/login-test", (req, res) => {
  getToken = loginResult("test1", "Password1");
  console.log(getToken);
});

authRouter.get("/me-test", (req, res) => {
  getToken
    .then((t) => {
      console.log(t);
      return new Promise((resolve, reject) => {
        request(
          {
            headers: {
              "x-access-token": t.data,
            },
            url: "http://localhost:4100/api/auth/me",
            json: true,
          },
          (e, r, body) => {
            resolve(body);
          }
        );
      });
    })
    .then((userData) => {
      if (userData.success === false) {
        console.log("로그인 필요!");
      }
      console.log(userData);
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = authRouter;
