const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const morgan = require("morgan");
const colors = require("colors");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const errorhandler = require("./middleware/error");

const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
var xss = require("xss-clean");
const cors = require("cors");

const rateLimit = require("express-rate-limit");
const hpp = require("hpp");

//load configfile
dotenv.config({ path: "./config/config.env" });

// connect to the database
connectDB();

// Routers
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

// destructure environment variables
const {
  NODE_ENV: environment = "development",
  apiVersion = "v1",
  PORT = 3000
} = process.env;

// Instantiate an express app
const app = express();

// security: set security headers
app.use(helmet());

// prevent cross site scripting
app.use(xss());

// Rate limiting
const limiter = rateLimit({ windowms: 10 * 60 * 1000, max: 100 });
app.use(limiter);

// prevent http param pollution
app.use(hpp());

// enable cors
app.use(cors());

//middlewares
app.use(express.json());

// To prevent nosql injection
app.use(mongoSanitize());

// cookie parser
app.use(cookieParser());

// logging
if (environment === "development") {
  app.use(morgan("short"));
}

// File Upload
app.use(fileUpload());

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers on app
app.use(`/api/${apiVersion}/bootcamps`, bootcamps);
app.use(`/api/${apiVersion}/courses`, courses);
app.use(`/api/${apiVersion}/auth`, auth);
app.use(`/api/${apiVersion}/users`, users);
app.use(`/api/${apiVersion}/reviews`, reviews);

// if we use it above the mount it will not catch errors for the routes mounted after it
app.use(errorhandler);

//start the app server
const server = app.listen(PORT, err => {
  if (err) {
    console.log(err);
  }
  console.log(
    `Server running in ${environment} at http://localhost:${PORT}`.yellow.bold
  );
});

// handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  //close server and exit process
  server.close(() => {
    process.exit(1);
  });
});
