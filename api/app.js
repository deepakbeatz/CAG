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
assetGANModel.initModel("generic-asset-model", "./src/nn-models/__data__/corpus/generic-corpus.txt");

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
  const body = req.body;
  const trainConfig = {
    epochs: body.epochs || 50,
    batchSize: body.batchSize || 10
  };
  await assetGANModel.loadModel("generic-asset-model", true, trainConfig);
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

app.post("/api/test/preprocess", async (req, res) => {
  const body = req.body;
  nlpUtils.contextualGrouping(body.prompt, assetClassifierModel.classify(body.prompt));
  res.send({
    prompt: body.prompt,
    classifiedAsset: assetClassifierModel.classify(body.prompt),
    preprocessed: nlpUtils.preprocess(body.prompt, assetClassifierModel.classify(body.prompt)),
  });
})

// Server
app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`));
