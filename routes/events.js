const express = require("express");
const Event = require("../models/Event");
const { ensureAuthenticated, loadEvent, ensureOrganizer } = require("../middleware/auth");
const { eventRules, validationErrors } = require("../middleware/validators");

const router = express.Router();
const PAGE_SIZE = 6;

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Only whitelisted fields ever reach the database.
const eventFields = ({ title, description, location, date, category, capacity }) => ({
  title,
  description,
  location,
  date,
  category,
  capacity: capacity || 0,
});

// List: search, category filter, upcoming/past tabs, pagination
router.get("/", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 60);
    const category = Event.CATEGORIES.includes(req.query.category) ? req.query.category : "";
    const when = req.query.when === "past" ? "past" : "upcoming";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const filter = { date: when === "past" ? { $lt: new Date() } : { $gte: new Date() } };
    if (category) filter.category = category;
    if (q) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: pattern }, { location: pattern }];
    }

    const [total, events] = await Promise.all([
      Event.countDocuments(filter),
      Event.find(filter)
        .sort({ date: when === "past" ? -1 : 1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .populate("organizer", "name avatar"),
    ]);

    res.render("events/index", {
      title: "Events",
      events,
      total,
      page,
      pages: Math.max(Math.ceil(total / PAGE_SIZE), 1),
      filters: { q, category, when },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/new", ensureAuthenticated, (req, res) => {
  res.render("events/form", { title: "New event", event: {}, errors: [], isEdit: false });
});

router.post("/", ensureAuthenticated, eventRules, async (req, res, next) => {
  try {
    const errors = validationErrors(req);
    if (errors) {
      return res.status(422).render("events/form", {
        title: "New event",
        event: req.body,
        errors,
        isEdit: false,
      });
    }
    const event = await Event.create({ ...eventFields(req.body), organizer: req.user._id });
    req.flash("success", "Your event is live!");
    res.redirect(`/events/${event.id}`);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", loadEvent, (req, res) => {
  res.render("events/show", { title: req.event.title, event: req.event });
});

router.get("/:id/edit", ensureAuthenticated, loadEvent, ensureOrganizer, (req, res) => {
  res.render("events/form", {
    title: "Edit event",
    event: req.event,
    errors: [],
    isEdit: true,
  });
});

router.put("/:id", ensureAuthenticated, loadEvent, ensureOrganizer, eventRules, async (req, res, next) => {
  try {
    const errors = validationErrors(req);
    if (errors) {
      return res.status(422).render("events/form", {
        title: "Edit event",
        event: { ...req.body, id: req.event.id },
        errors,
        isEdit: true,
      });
    }
    req.event.set(eventFields(req.body));
    await req.event.save();
    req.flash("success", "Event updated.");
    res.redirect(`/events/${req.event.id}`);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", ensureAuthenticated, loadEvent, ensureOrganizer, async (req, res, next) => {
  try {
    await req.event.deleteOne();
    req.flash("success", "Event deleted.");
    res.redirect("/events");
  } catch (err) {
    next(err);
  }
});

// RSVP toggle. The capacity check and the write happen in one atomic update,
// so two people can't both take the last spot.
router.post("/:id/attend", ensureAuthenticated, loadEvent, async (req, res, next) => {
  try {
    const { event, user } = req;

    if (event.isPast) {
      req.flash("error", "This event has already taken place.");
    } else if (event.hasAttendee(user)) {
      await Event.updateOne({ _id: event._id }, { $pull: { attendees: user._id } });
      req.flash("success", "You're no longer attending.");
    } else {
      const hasRoom =
        event.capacity > 0
          ? { $expr: { $lt: [{ $size: "$attendees" }, "$capacity"] } }
          : {};
      const result = await Event.updateOne(
        { _id: event._id, attendees: { $ne: user._id }, ...hasRoom },
        { $addToSet: { attendees: user._id } }
      );
      if (result.modifiedCount) req.flash("success", "You're in! See you there.");
      else req.flash("error", "Sorry, this event is full.");
    }

    res.redirect(`/events/${event.id}`);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
