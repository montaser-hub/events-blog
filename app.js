const path = require("path");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const methodOverride = require("method-override");

const { isProduction, sessionSecret } = require("./config/env");
const passport = require("./config/passport");
const { csrfToken, verifyCsrfUnlessMultipart } = require("./middleware/csrf");
const helpers = require("./views/helpers");
const Event = require("./models/Event");

// `clientPromise` resolves to the MongoClient shared with Mongoose.
module.exports = (clientPromise) => {
  const app = express();

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));
  app.set("trust proxy", 1); // correct req.ip / secure cookies behind a proxy
  app.disable("x-powered-by");

  // Security headers. The CSP only allows our own files plus the pinned CDN
  // assets (Bootstrap, Bootstrap Icons, Google Fonts) — no inline scripts.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:"],
          formAction: ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
    })
  );

  // Static files: only /public and processed avatars. (node_modules is never served.)
  app.use(express.static(path.join(__dirname, "public")));
  app.use(
    "/uploads/avatars",
    express.static(path.join(__dirname, "uploads", "avatars"), {
      setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
    })
  );

  app.use(express.urlencoded({ extended: false, limit: "20kb" }));

  app.use(
    session({
      name: "sid",
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ clientPromise, ttl: 7 * 24 * 60 * 60 }),
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );
  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF: check the token on every non-GET request, then allow HTML forms to
  // send PUT/DELETE through a hidden `_method` field.
  app.use(csrfToken);
  app.use(verifyCsrfUnlessMultipart);
  app.use(
    methodOverride((req) => {
      const method = req.body && req.body._method;
      if (["PUT", "DELETE"].includes(method)) {
        delete req.body._method;
        return method;
      }
      return undefined;
    })
  );

  // Values every view can use
  app.use((req, res, next) => {
    res.locals.user = req.user || null;
    res.locals.currentPath = req.path;
    res.locals.categories = Event.CATEGORIES;
    res.locals.h = helpers;
    // Read flash lazily so messages aren't consumed by requests that don't render.
    res.locals.flashMessages = () => ({
      success: req.flash("success"),
      error: req.flash("error"),
    });
    next();
  });

  // Slow down password guessing and signup spam.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: (req) => req.method !== "POST",
    message: "Too many attempts. Please try again in a few minutes.",
  });
  app.use(["/users/login", "/users/signup"], authLimiter);

  app.get("/", (req, res) => res.redirect("/events"));
  app.use("/events", require("./routes/events"));
  app.use("/users", require("./routes/users"));

  // 404
  app.use((req, res) => {
    res.status(404).render("error", {
      title: "Page not found",
      status: 404,
      message: "We couldn't find the page you were looking for.",
    });
  });

  // Error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).render("error", {
      title: status === 403 ? "Request blocked" : "Something went wrong",
      status,
      message:
        status < 500 ? err.message : "Something went wrong on our side. Please try again.",
    });
  });

  return app;
};
