const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const multer = require("multer");
const sharp = require("sharp");

const AVATAR_DIR = path.join(__dirname, "..", "uploads", "avatars");
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// Keep the upload in memory: nothing touches the disk until it has passed
// the CSRF check and been re-encoded by sharp.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    const err = new Error("Please upload a JPG, PNG, WebP or GIF image.");
    err.code = "INVALID_FILE_TYPE";
    cb(err);
  },
});

// Wraps multer so upload errors become flash messages instead of 500s.
const avatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (!err) return next();
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Image is too large (max 2 MB)." : err.message;
    req.flash("error", message);
    res.redirect("/users/profile");
  });
};

// Re-encodes the image (drops metadata, proves it really is an image) and
// stores it under a server-generated name. Returns the filename.
const saveAvatar = async (buffer) => {
  const filename = `${crypto.randomUUID()}.webp`;
  await fs.mkdir(AVATAR_DIR, { recursive: true });
  await sharp(buffer)
    .rotate() // respect EXIF orientation
    .resize(256, 256, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(path.join(AVATAR_DIR, filename));
  return filename;
};

const removeAvatar = async (filename) => {
  if (!filename) return;
  // basename(): never let a stored value escape the avatars directory
  await fs.rm(path.join(AVATAR_DIR, path.basename(filename)), { force: true });
};

module.exports = { avatarUpload, saveAvatar, removeAvatar };
