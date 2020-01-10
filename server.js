const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");

//Routers
const bootcamps = require("./routes/bootcamps");

//load configfile
dotenv.config({ path: "./config/config.env" });

const { environment = "development", PORT = 3000 } = process.env;

const app = express();

if (environment === "development") {
  app.use(morgan("dev"));
}

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);

//start the server
app.listen(PORT, err => {
  if (err) {
    console.log(err);
  }
  console.log(`Server running in ${environment} at http://localhost:${PORT}`);
});
