const crypto = require("crypto");

// Synchroniser-token CSRF protection: one random token per session, rendered
// into every form as a hidden `_csrf` field and checked on every
// state-changing request.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const tokenFor = (req) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
};

const tokensMatch = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

const reject = (res) => {
  const err = new Error("Your form expired or was submitted from another site. Please try again.");
  err.status = 403;
  throw err;
};

// Exposes csrfToken() to views (lazily, so anonymous page views that render
// no form don't create a session).
const csrfToken = (req, res, next) => {
  res.locals.csrfToken = () => tokenFor(req);
  next();
};

const verifyCsrf = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();
  const sent = (req.body && req.body._csrf) || req.get("x-csrf-token");
  if (!tokensMatch(sent, req.session.csrfToken)) reject(res);
  next();
};

// Multipart bodies are parsed by multer inside the route, so those routes
// call verifyCsrf themselves after the upload middleware.
const verifyCsrfUnlessMultipart = (req, res, next) =>
  req.is("multipart/form-data") ? next() : verifyCsrf(req, res, next);

module.exports = { csrfToken, verifyCsrf, verifyCsrfUnlessMultipart };
