const jwt = require('jsonwebtoken');
const redis = require('redis');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = redis.createClient({ url: REDIS_URL });
redisClient.connect().catch(console.error);

function authMiddleware(req, res, next) {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    redisClient.get(token).then((result) => {
      if (!result) {
        return res.status(401).json({ message: 'Session expired or invalid' });
      }
      req.user = decoded;
      next();
    }).catch((err) => {
      return res.status(500).json({ message: 'Redis error', error: err.message });
    });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== role && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, redisClient }; 