// /server/middleware/adminOnly.js
//
// Role-based access control middleware
// Restricts access to admin users only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware: Verify user has admin role
 * Must be chained after authenticate middleware
 *
 * Usage: router.post('/users', authenticate, adminOnly, controller)
 *
 * Returns:
 *   403 Forbidden (with error message) if not admin
 *   Calls next() to proceed if admin
 */
const adminOnly = (req, res, next) => {
  // Check user object exists and is authenticated
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Check role is admin
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden: Admin access required",
      userRole: req.user.role,
    });
  }

  // User is admin, proceed
  next();
};

export default adminOnly;
