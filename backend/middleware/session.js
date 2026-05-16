import session from 'express-session';

// Simple memory store for development (we'll upgrade later)
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'steeze-super-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax',
  },
});
