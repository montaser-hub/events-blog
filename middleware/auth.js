const mongoose = require("mongoose");
const Event = require("../models/Event");

// Only same-site relative paths are allowed as a post-login destination.
const isSafePath = (path) =>
  typeof path === "string" && path.startsWith("/") && !path.startsWith("//");

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  if (req.method === "GET" && isSafePath(req.originalUrl)) {
    req.session.returnTo = req.originalUrl;
  }
  req.flash("error", "Please log in to continue.");
  res.redirect("/users/login");
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.redirect("/users/profile");
};

// Loads :id into req.event, or renders a 404 for bad/missing ids.
const loadEvent = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return next("route");
    const event = await Event.findById(req.params.id)
      .populate("organizer", "name avatar")
      .populate("attendees", "name avatar");
    if (!event) return next("route");
    req.event = event;
    next();
  } catch (err) {
    next(err);
  }
};

// Server-side ownership check: hiding the buttons in the UI is not enough.
const ensureOrganizer = (req, res, next) => {
  if (req.event.isOrganizedBy(req.user)) return next();
  req.flash("error", "Only the organiser can change this event.");
  res.redirect(`/events/${req.event.id}`);
};

module.exports = { ensureAuthenticated, ensureGuest, loadEvent, ensureOrganizer, isSafePath };
