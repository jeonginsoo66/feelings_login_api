import express from "express";
import path from "path";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { request } from "http";

dotenv.config();

const app = express();
const PORT = 4100;

// Database
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
});

const db = mongoose.connection;
db.once("open", () => {
  console.log("DB Connected");
});

db.on("error", (err) => {
  console.log("DB ERROR:", err);
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "content-type, x-access-token"); //1
  next();
});

// API
app.use("/api/users", require("./api/users"));
app.use("/api/auth", require("./api/auth"));

// Server
app.listen(PORT, () => {
  console.log("Listening on port:", PORT);
});
