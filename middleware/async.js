//Concept borrowed from: https://www.acuriousanimal.com/blog/2018/03/15/express-async-middleware
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;

// now we can wrap every async route controller to catch if anything goes wrong while processing asynchronous work
