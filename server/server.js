const express = require("express");
const cors = require("cors");
//const { connectDB } = require("./dbConfig");

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/api", (req, res) => {
  res.json({ users: ["Alice", "Bob", "Charlie"] });
});

app.get("/status", (req, res) => {
  res.json({ status: "Running" });
});
