// Small formatting helpers exposed to every view as `h`.

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" }); // always 3 letters

const pad = (n) => String(n).padStart(2, "0");

module.exports = {
  date: (d) => dateFmt.format(d),
  time: (d) => timeFmt.format(d),
  month: (d) => monthFmt.format(d).toUpperCase(),
  day: (d) => d.getDate(),

  // Value for <input type="datetime-local"> (local time, no timezone suffix)
  inputDateTime: (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  },

  slug: (text) => String(text).toLowerCase(),

  initials: (name) =>
    String(name || "?")
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase(),

  // Builds a query string for pagination/filter links, dropping empty values.
  query: (params) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null && !(key === "page" && value === 1)) {
        search.set(key, value);
      }
    });
    const text = search.toString();
    return text ? `?${text}` : "";
  },

  plural: (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`,
};
