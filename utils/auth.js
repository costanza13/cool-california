const withAuth = (req, res, next) => {
  if (!req.session.user_id) {
    if (req.originalUrl === 'login') {
      res.redirect('/login');
    } else {
      res.redirect('/login?_next=' + req.originalUrl);
    }
  } else {
    next();
  }
};

const withAuthApi = (req, res, next) => {
  if (!req.session.user_id) {
    res.json({ error: 'Access denied. You must be logged in to access this resource.'});
  } else {
    next();
  }
};

module.exports = { withAuth, withAuthApi };
