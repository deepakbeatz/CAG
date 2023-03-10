// Requirements
var express = require("express"),
  bodyParser = require("body-parser"),
  cors = require("cors"),
  nlpUtils = require("./src/nlp/nlp-utils");
AssetClassifierModel = require("./src/nn-models/asset-classifier-model");

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
var AssetClassifierModel = new AssetClassifierModel();
AssetClassifierModel.initModel(
  "./src/nn-models/__data__/asset-classifier-model-data.xlsx"
);

// End Points
app.get("/api/test", async (req, res) => {
  const tokens = nlpUtils.tokenize("hello, welcome to CAG app!");
  const prompt = "sc with actions";
  res.send({
    tokens: tokens,
    prompt,
    classifiedAsset: AssetClassifierModel.classify(prompt),
  });
});

// Server
app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`));
