/* Sample data for local development: `npm run seed`
 * Wipes users, events and sessions, then inserts fictional people and
 * events with dates relative to today (so there are always upcoming ones). */
const mongoose = require("mongoose");
const { mongoUri } = require("../config/env");
const User = require("../models/User");
const Event = require("../models/Event");

const PASSWORD = "test1234";

const people = [
  { key: "demo", name: "Demo User", email: "demo@events.dev" },
  { key: "nour", name: "Nour Hassan", email: "nour@events.dev" },
  { key: "omar", name: "Omar Farouk", email: "omar@events.dev" },
  { key: "salma", name: "Salma Adel", email: "salma@events.dev" },
  { key: "karim", name: "Karim Mostafa", email: "karim@events.dev" },
  { key: "laila", name: "Laila Samir", email: "laila@events.dev" },
  { key: "youssef", name: "Youssef Nabil", email: "youssef@events.dev" },
  { key: "hana", name: "Hana Tarek", email: "hana@events.dev" },
];

// days: offset from today (negative = past) · hour: local start time
const events = [
  {
    title: "Cairo JavaScript Meetup",
    category: "Meetup",
    location: "The GrEEK Campus, Cairo",
    days: 4, hour: 18, capacity: 60, by: "demo",
    going: ["nour", "omar", "salma", "karim", "laila"],
    description:
      "An evening of lightning talks on modern JavaScript: server components, edge runtimes and what's new in Node.\nDoors open at 6 pm. Pizza and drinks are provided, and there's time for networking afterwards.",
  },
  {
    title: "Sunrise at the Pyramids of Giza",
    category: "Tour",
    location: "Giza Plateau, Giza",
    days: 9, hour: 5, capacity: 6, by: "nour",
    going: ["demo", "omar", "salma", "karim", "laila", "hana"],
    description:
      "A small-group guided walk around the Great Pyramids and the Sphinx as the sun comes up, before the crowds arrive.\nWe meet at the main gate at 5 am sharp. Comfortable shoes and water are a must.",
  },
  {
    title: "Hands-on Docker Workshop",
    category: "Workshop",
    location: "Makers Lab, Alexandria",
    days: 12, hour: 10, capacity: 25, by: "omar",
    going: ["demo", "karim", "youssef"],
    description:
      "Go from zero to shipping a containerised Node.js app in one morning. We'll cover images, volumes, networks and Compose.\nBring a laptop with Docker Desktop installed.",
  },
  {
    title: "Nile Sunset Felucca Ride",
    category: "Tour",
    location: "Maadi Corniche, Cairo",
    days: 15, hour: 17, capacity: 12, by: "salma",
    going: ["nour", "laila", "hana", "youssef"],
    description:
      "Two relaxed hours sailing the Nile on a traditional felucca, with tea and snacks on board.\nA lovely way to end the week, and a great chance to meet new people.",
  },
  {
    title: "Indie Night at Cairo Jazz Club",
    category: "Music",
    location: "Cairo Jazz Club, Agouza",
    days: 18, hour: 21, capacity: 0, by: "laila",
    going: ["demo", "nour", "omar", "salma", "karim", "youssef", "hana"],
    description:
      "Three local indie bands take the stage for a night of original music.\nTickets are available at the door. The first set starts at 9:30 pm.",
  },
  {
    title: "Friday Morning 5K by the Sea",
    category: "Sports",
    location: "Stanley Bridge, Alexandria",
    days: 21, hour: 7, capacity: 0, by: "karim",
    going: ["omar", "hana"],
    description:
      "A friendly, all-paces 5K run along the Corniche followed by breakfast together.\nNo registration fee and no timing chips; just show up and run.",
  },
  {
    title: "Product Design Critique Circle",
    category: "Meetup",
    location: "Consoleya, Downtown Cairo",
    days: 25, hour: 19, capacity: 15, by: "hana",
    going: ["salma", "laila"],
    description:
      "Bring a work-in-progress screen, flow or prototype and get structured feedback from fellow designers.\nEach presenter gets ten minutes; spots are limited to keep it useful.",
  },
  {
    title: "DevFest Egypt",
    category: "Conference",
    location: "Egypt International Exhibition Center, Cairo",
    days: 33, hour: 9, capacity: 400, by: "youssef",
    going: ["demo", "nour", "omar", "karim", "laila", "hana"],
    description:
      "A full-day community conference with three tracks: web, mobile and cloud. Over thirty speakers and plenty of hallway conversations.\nLunch and a conference t-shirt are included.",
  },
  {
    title: "Luxor Temples by Night",
    category: "Tour",
    location: "Luxor Temple, Luxor",
    days: 40, hour: 19, capacity: 20, by: "nour",
    going: ["salma", "youssef"],
    description:
      "See Luxor Temple lit up after dark with an Egyptologist guide, then walk the restored Avenue of Sphinxes towards Karnak.\nThe tour lasts about two and a half hours.",
  },
  {
    title: "Intro to MongoDB Aggregations",
    category: "Workshop",
    location: "Online (Google Meet)",
    days: 47, hour: 20, capacity: 100, by: "demo",
    going: ["omar", "karim", "hana"],
    description:
      "A practical online session on the aggregation pipeline: $match, $group, $lookup and when to reach for each.\nWe'll work through real queries together; a sample dataset is provided.",
  },
  {
    title: "Rooftop Oud & Qanun Evening",
    category: "Music",
    location: "Darb 1718, Old Cairo",
    days: 55, hour: 20, capacity: 80, by: "laila",
    going: ["nour", "salma"],
    description:
      "An intimate rooftop concert of classical Arabic music performed on oud and qanun.\nSeating is on floor cushions; arrive early for the best spots.",
  },
  {
    title: "Wadi Degla Beginners' Hike",
    category: "Sports",
    location: "Wadi Degla Protectorate, Cairo",
    days: 62, hour: 7, capacity: 30, by: "karim",
    going: ["demo", "youssef"],
    description:
      "An easy eight-kilometre hike through the canyon, suitable for complete beginners.\nBring at least two litres of water, a hat and sunscreen.",
  },
  {
    title: "Women in Tech Breakfast",
    category: "Meetup",
    location: "Zamalek, Cairo",
    days: 70, hour: 9, capacity: 40, by: "salma",
    going: ["nour", "laila", "hana"],
    description:
      "A relaxed breakfast for women working in or curious about tech: short talks, mentoring tables and good coffee.\nAllies are welcome.",
  },
  // Past events
  {
    title: "React Performance Deep Dive",
    category: "Workshop",
    location: "The GrEEK Campus, Cairo",
    days: -12, hour: 18, capacity: 50, by: "omar",
    going: ["demo", "nour", "karim"],
    description:
      "We profiled a slow dashboard live and fixed it step by step: memoisation, virtualised lists and smarter data fetching.\nSlides and the demo repository were shared with attendees.",
  },
  {
    title: "Aswan & Abu Simbel Weekend",
    category: "Tour",
    location: "Aswan",
    days: -30, hour: 6, capacity: 16, by: "nour",
    going: ["salma", "laila", "hana"],
    description:
      "Two days exploring Philae Temple, the High Dam and the temples of Ramses II at Abu Simbel.\nAn unforgettable trip with a wonderful group.",
  },
  {
    title: "Alexandria Startup Mixer",
    category: "Meetup",
    location: "Bibliotheca Alexandrina, Alexandria",
    days: -55, hour: 19, capacity: 0, by: "youssef",
    going: ["demo", "omar"],
    description:
      "Founders, engineers and investors from across the city met for an evening of introductions and short pitches.\nThanks to everyone who came along.",
  },
];

const dateFor = (days, hour) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

(async () => {
  try {
    await mongoose.connect(mongoUri);
    await Promise.all([
      User.deleteMany(),
      Event.deleteMany(),
      mongoose.connection.collection("sessions").deleteMany({}),
    ]);

    // create() so the pre-save hook hashes each password
    const ids = {};
    await Promise.all(
      people.map(async ({ key, ...person }) => {
        const user = await User.create({ ...person, password: PASSWORD });
        ids[key] = user._id;
      })
    );

    await Event.insertMany(
      events.map(({ days, hour, by, going, ...event }) => ({
        ...event,
        date: dateFor(days, hour),
        organizer: ids[by],
        attendees: going.map((key) => ids[key]),
      }))
    );

    console.log(`Seeded ${people.length} users and ${events.length} events.`);
    console.log(`\n  Demo login: demo@events.dev / ${PASSWORD}\n`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
