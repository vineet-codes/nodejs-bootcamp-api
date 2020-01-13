const advanceResults = (model, populate) => async (req, res, next) => {
  //   console.log(req.query);
  let query;

  const reqQuery = {
    ...req.query
  };

  // Fields to exclude
  // Loop over removeFields and delete then from reqQuery
  const removeFields = ["select", "sort", "page", "limit"];
  removeFields.forEach(param => delete reqQuery[param]);
  //   console.log(reqQuery);

  // mongoose advanced filtering
  // create a query string
  // less than, less than equal to, greater than, greater than equal to, in
  let queryStr = JSON.stringify(reqQuery);
  queryStr = JSON.parse(
    queryStr.replace(/\b(gt|gte|lte|lt|in)\b/g, match => `$${match}`)
  );
  // console.log(queryStr);

  // Finding resources
  query = model.find(queryStr);

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort: deault sort by createdAt
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  //Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = { page: page + 1, limit: limit };
  }

  if (startIndex > 0) {
    pagination.prev = { page: page - 1, limit: limit };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  };

  next();
};

module.exports = advanceResults;
