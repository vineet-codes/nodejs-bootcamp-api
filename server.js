const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const connectDB = require("./config/db");

//load configfile
dotenv.config({ path: "./config/config.env" });

// connect to the database
connectDB();

//Routers
const bootcamps = require("./routes/bootcamps");

// destructure environment variables
const {
  NODE_ENV: environment = "development",
  apiVersion = "v1",
  PORT = 3000
} = process.env;

// Instantiate an express app
const app = express();

// logging
if (environment === "development") {
  app.use(morgan("dev"));
}

// Mount routers on app
app.use(`/api/${apiVersion}/bootcamps`, bootcamps);

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
