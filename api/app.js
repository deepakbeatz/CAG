// Requirements
var express = require("express"),
  bodyParser = require("body-parser"),
  cors = require("cors");

// Configurations
const app = express();
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// Variables
var PORT = process.env.PORT || 5000;

// End Points
app.get("/api/test", async (req, res) => {
  res.send({});
});

// Server
app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`));
