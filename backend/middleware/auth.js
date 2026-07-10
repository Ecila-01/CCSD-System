const jwt = require('jsonwebtoken');

// Verify the JWT from the Authorization header and attach { id, role } to req.user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Login signs the payload as { user: { id, role } }
    req.user = decoded.user || decoded;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Restrict a route to one or more roles. Use AFTER requireAuth.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }
    return next();
  };
}

module.exports = { requireAuth, requireRole };
