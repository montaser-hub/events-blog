const express = require("express");
const passport = require("passport");
const User = require("../models/User");
const Event = require("../models/Event");
const { ensureAuthenticated, ensureGuest, isSafePath } = require("../middleware/auth");
const { verifyCsrf } = require("../middleware/csrf");
const { avatarUpload, saveAvatar, removeAvatar } = require("../middleware/upload");
const { signupRules, profileRules, validationErrors } = require("../middleware/validators");

const router = express.Router();

// Upcoming events first (soonest at the top), then past ones (most recent first).
const upcomingFirst = (events) => {
  const now = new Date();
  const upcoming = events.filter((e) => e.date >= now).sort((a, b) => a.date - b.date);
  const past = events.filter((e) => e.date < now).sort((a, b) => b.date - a.date);
  return [...upcoming, ...past];
};

// Where to go after logging in: the page the visitor originally asked for.
const takeReturnTo = (req) => {
  const { returnTo } = req.session;
  delete req.session.returnTo;
  return isSafePath(returnTo) ? returnTo : "/users/profile";
};

router.get("/login", ensureGuest, (req, res) => {
  res.render("users/login", { title: "Log in", email: "" });
});

router.post("/login", ensureGuest, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash("error", info.message);
      return res.redirect("/users/login");
    }
    const destination = takeReturnTo(req);
    // logIn() regenerates the session id (prevents session fixation).
    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      req.flash("success", `Welcome back, ${user.name.split(" ")[0]}!`);
      res.redirect(destination);
    });
  })(req, res, next);
});

router.get("/signup", ensureGuest, (req, res) => {
  res.render("users/signup", { title: "Sign up", form: {}, errors: [] });
});

router.post("/signup", ensureGuest, signupRules, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const errors = validationErrors(req) || [];
    if (!errors.length && (await User.exists({ email }))) {
      errors.push("An account with that email already exists.");
    }
    if (errors.length) {
      return res.status(422).render("users/signup", {
        title: "Sign up",
        form: { name, email },
        errors,
      });
    }

    const user = await User.create({ name, email, password });
    const destination = takeReturnTo(req);
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.flash("success", `Welcome, ${user.name.split(" ")[0]}! Your account is ready.`);
      res.redirect(destination);
    });
  } catch (err) {
    next(err);
  }
});

// POST (with CSRF token), so another site can't log you out with an <img>.
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/events");
  });
});

router.get("/profile", ensureAuthenticated, async (req, res, next) => {
  try {
    const [organizing, attending] = await Promise.all([
      Event.find({ organizer: req.user._id }),
      Event.find({ attendees: req.user._id }).populate("organizer", "name"),
    ]);
    res.render("users/profile", {
      title: "Your profile",
      organizing: upcomingFirst(organizing),
      attending: upcomingFirst(attending),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/profile", ensureAuthenticated, profileRules, async (req, res, next) => {
  try {
    const errors = validationErrors(req);
    if (errors) {
      req.flash("error", errors[0]);
    } else {
      req.user.name = req.body.name;
      await req.user.save();
      req.flash("success", "Profile updated.");
    }
    res.redirect("/users/profile");
  } catch (err) {
    next(err);
  }
});

router.post("/avatar", ensureAuthenticated, avatarUpload, verifyCsrf, async (req, res, next) => {
  try {
    if (!req.file) {
      req.flash("error", "Please choose an image to upload.");
      return res.redirect("/users/profile");
    }
    let filename;
    try {
      filename = await saveAvatar(req.file.buffer);
    } catch {
      // sharp couldn't decode it: not a real image, whatever the MIME type said
      req.flash("error", "That file doesn't look like a valid image.");
      return res.redirect("/users/profile");
    }
    const previous = req.user.avatar;
    req.user.avatar = filename;
    await req.user.save();
    await removeAvatar(previous);
    req.flash("success", "Profile picture updated.");
    res.redirect("/users/profile");
  } catch (err) {
    next(err);
  }
});

module.exports = router;
