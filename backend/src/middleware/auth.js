// DEV_SKIP_AUTH lets you run and test the whole system locally before a
// Firebase project exists. It must be unset (or "false") anywhere but your
// own machine — never deploy to Render with this on.
const DEV_SKIP_AUTH = process.env.DEV_SKIP_AUTH === "true";
const admin = DEV_SKIP_AUTH ? null : require("../config/firebase").admin;

// Verifies the Firebase ID token sent as "Authorization: Bearer <token>".
// On success, attaches the decoded token (uid, role custom claim, etc.) to req.user.
async function requireAuth(req, res, next) {
  if (DEV_SKIP_AUTH) {
    // Fake a signed-in front-desk staff member so protected routes are
    // reachable during local testing, without needing Firebase yet.
    req.user = { uid: "dev-local-user", role: req.headers["x-dev-role"] || "front_desk" };
    return next();
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing authentication token" });
  }

  try {
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Restricts a route to specific roles, set via Firebase custom claims
// (e.g. { role: "front_desk" }, { role: "management" }).
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
