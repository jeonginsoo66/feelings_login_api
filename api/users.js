import express from "express";
import User from "../models/user";
import util from "../util";

const userRouter = express.Router();

// private functions
function checkPermission(req, res, next) {
  const { username } = req.params;

  User.findOne({ username }, (err, user) => {
    if (err || !user) {
      return res.json(util.successFalse(err));
    } else if (!req.decoded || user._id != req.decoded._id) {
      return res.json(util.successFalse(null, "You don't have permission!"));
    } else {
      next();
    }
  });
}

// index
userRouter.get("/", util.isLoggedin, (req, res) => {
  User.find({})
    .sort({ username: 1 })
    .exec((err, users) => {
      res.json(
        err || !users ? util.successFalse(err) : util.successTrue(users)
      );
    });
});

// create
userRouter.post("/", (req, res) => {
  let newUser = new User(req.body);

  newUser.save((err, user) => {
    res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
  });
});

// show
userRouter.get("/:username", util.isLoggedin, (req, res) => {
  const { username } = req.params;

  User.findOne({ username }).exec((err, user) => {
    res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
  });
});

// update
userRouter.put("/:username", util.isLoggedin, checkPermission, (req, res) => {
  const { username } = req.params;

  User.findOne({ username })
    .select({ password: 1 })
    .exec((err, user) => {
      if (err || !user) {
        return res.json(util.successFalse(err));
      }

      // update user object
      user.originalPassword = user.password;
      user.password = req.body.newPassword
        ? req.body.newPassword
        : user.password;
      for (let p in req.body) {
        user[p] = req.body[p];
      }

      // save updated user
      user.save((err, user) => {
        if (err || !user) {
          return res.json(util.successFalse(err));
        } else {
          user.password = undefined;
          res.json(util.successTrue(user));
        }
      });
    });
});

// destroy
userRouter.delete(
  "/:username",
  util.isLoggedin,
  checkPermission,
  (req, res) => {
    const { username } = req.params;

    User.findOneAndRemove({ username }).exec((err, user) => {
      res.json(err || !user ? util.successFalse(err) : util.successTrue(user));
    });
  }
);

module.exports = userRouter;
