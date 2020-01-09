const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: "./config/config.env" });

const app = express();

const { PORT = 3000 } = process.env;

app.get("/", (req, res) => {
  res.send({ success: true });
});

app.listen(PORT, err => {
  if (err) {
    console.log(err);
  }
  console.log(
    `Server running in ${process.env.NODE_ENV} at http://localhost:${PORT}`
  );
});
