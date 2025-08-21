const { nanoid } = require('nanoid');

const requestId = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || nanoid();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

module.exports = { requestId };
