// Requirements
var express = require("express"),
  bodyParser = require("body-parser"),
  cors = require("cors"),
  nlpUtils = require("./src/nlp/nlp-utils");

var AssetClassifierModel = require("./src/nn-models/asset-classifier-model"),
  AssetGANModel = require("./src/nn-models/asset-gan-model");

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
const assetClassifierModel = new AssetClassifierModel();
assetClassifierModel.initModel(
  "./src/nn-models/__data__/asset-classifier-model-data.xlsx"
);
const assetGANModel = new AssetGANModel();
assetGANModel.initModel("generic-asset-model", "./src/nn-models/__data__/data.txt");

// End Points
app.get("/api/test", async (req, res) => {
  const tokens = nlpUtils.tokenize("hello, welcome to CAG app!");
  const prompt = "sc with actions";
  res.send({
    tokens: tokens,
    prompt,
    classifiedAsset: assetClassifierModel.classify(prompt),
  });
});

app.post("/api/test/train", async (req, res) => {
  await assetGANModel.loadModel("generic-asset-model", true);
  res.send({ status: "training started" });
});

app.post("/api/test/generateSequence", async (req, res) => {
  const body = req.body;
  res.send({
    generatedSequence: assetGANModel.generateSequence(
      body.input || '',
      body.length || 5
    ),
  });
});

app.post("/api/test/generateRandom", async (req, res) => {
  const body = req.body;
  res.send({
    generatedSequence: assetGANModel.generateRandomSequence(
      body.length || 5
    ),
  });
});

// Server
app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`));
