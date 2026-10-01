const mongoose = require("mongoose");

const CATEGORIES = ["Meetup", "Workshop", "Conference", "Tour", "Music", "Sports"];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 80 },
    description: { type: String, required: true, trim: true, minlength: 15, maxlength: 2000 },
    location: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    date: { type: Date, required: true },
    category: { type: String, enum: CATEGORIES, default: "Meetup" },
    // 0 means unlimited
    capacity: { type: Number, min: 0, max: 100000, default: 0 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ attendees: 1 });

eventSchema.virtual("isPast").get(function () {
  return this.date < new Date();
});

eventSchema.virtual("isFull").get(function () {
  return this.capacity > 0 && this.attendees.length >= this.capacity;
});

eventSchema.virtual("spotsLeft").get(function () {
  return this.capacity > 0 ? Math.max(this.capacity - this.attendees.length, 0) : null;
});

eventSchema.methods.isOrganizedBy = function (user) {
  if (!user) return false;
  const organizerId = this.organizer._id || this.organizer;
  return organizerId.equals(user._id);
};

eventSchema.methods.hasAttendee = function (user) {
  if (!user) return false;
  return this.attendees.some((a) => (a._id || a).equals(user._id));
};

const Event = mongoose.model("Event", eventSchema);
Event.CATEGORIES = CATEGORIES;

module.exports = Event;
