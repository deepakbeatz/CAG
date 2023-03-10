// Requirements
var express = require("express"),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  cors = require("cors"),
  layoutsFactory = require("./src/layouts-factory");
  modelUtils = require("./src/model-utils");
  beUtils = require("./src/business-entity/be-utils");

// Models
var componentsModel = require("./src/components-model/model");
var characteristicsModel = require("./src/characteristics-model/model");

// Mongo Collections
var layout = require("./mongo-models/layout");
var traininglabel = require("./mongo-models/trainingLabel");

// Configurations
const app = express();
app.use(cors());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// Mongo Connection
mongoose.connect(
  "mongodb+srv://teamalpha:infa123@cluster0.j2df9.mongodb.net/AIDesigner?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

// Variables
var PORT = process.env.PORT || 5000;
var componentsNNModel;
var characteristicsNNModel;

// End Points
app.get("/api/layout", async (req, res) => {
  layout.find({}, (err, layouts) => {
    res.send({ layouts: layouts });
  });
});

app.get("/api/layout/:id", async (req, res) => {
  layout.findOne({ id: req.params.id }, (err, layout) => {
    res.send({ layout: layout });
  });
});

app.post("/api/layout/persist", async (req, res) => {
  res.send({ status: "success" });
});

app.post("/api/model/components/predict", async (req, res) => {
  var body = req.body;
  try {
    if (!componentsNNModel) {
      componentsNNModel = await componentsModel.loadModel(body.orgId);
    }
    const trainingLabels = await traininglabel.findOne({ modelType: "components"});
    const inputData = modelUtils.getInputTensor(trainingLabels.xLabels, body.selectedFields);
    const predictedComponents = await componentsNNModel.predict(inputData);
    const outputData = modelUtils.getOutputLabels(trainingLabels.yLabels, predictedComponents.dataSync());
    res.send({ components: outputData });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/model/components/train", async (req, res) => {
  var body = req.body;
  try {
    if (!componentsNNModel) {
      componentsNNModel = await componentsModel.loadModel(body.orgId);
    }
    const trainConfig = {epochs: 1000, batchSize: 32};
    await componentsNNModel.train(trainConfig);
    await componentsModel.saveModel(body.orgId, componentsNNModel.getModelArtifacts());
    console.log("success");
    res.send({ status: "success" });
  } catch(err) {
    console.log(err);
    res.send({ status: "error" });
  }
});

app.post("/api/model/characteristics/predict", async (req, res) => {
  var body = req.body;
  try {
    if (!characteristicsNNModel) {
      characteristicsNNModel = await characteristicsModel.loadModel(body.orgId);
    }
    const componentLabels = await traininglabel.findOne({ modelType: "components"});
    const characteristicsLabels = await traininglabel.findOne({ modelType: "characteristics"});
    const componentData = modelUtils.getInputData(componentLabels.yLabels, body.selectedComponents);
    const entityData = beUtils.getEntityData(body.selectedFields);
    const inputData = modelUtils.getCombinedTensor(componentData, entityData);
    const predictedCharacteristics = await characteristicsNNModel.predict(inputData);
    const characteristicsData = modelUtils.getOutputData(characteristicsLabels.yLabels, predictedCharacteristics.dataSync());
    res.send({ characteristics: characteristicsData });
  } catch (err) {
    console.log(err);
  }
});

app.post("/api/model/characteristics/train", async (req, res) => {
  var body = req.body;
  try {
    if (!characteristicsNNModel) {
      characteristicsNNModel = await characteristicsModel.loadModel(body.orgId);
    }
    const trainConfig = {epochs: 500, batchSize: 30};
    await characteristicsNNModel.train(trainConfig);
    await characteristicsModel.saveModel(body.orgId, characteristicsNNModel.getModelArtifacts());
    console.log("success");
    res.send({ status: "success" });
  } catch(err) {
    console.log(err);
    res.send({ status: "error" });
  }
});

app.post("/api/model/layouts/predict", async (req, res) => {
  var body = req.body;
  try {
    if (!characteristicsNNModel) {
      characteristicsNNModel = await characteristicsModel.loadModel(body.orgId);
    }
    const componentLabels = await traininglabel.findOne({ modelType: "components"});
    const characteristicsLabels = await traininglabel.findOne({ modelType: "characteristics"});
    const componentData = modelUtils.getInputData(componentLabels.yLabels, body.selectedComponents);
    const entityData = beUtils.getEntityData(body.selectedFields);
    const inputData = modelUtils.getCombinedTensor(componentData, entityData);
    const predictedCharacteristics = await characteristicsNNModel.predict(inputData);
    const characteristicsData = modelUtils.getOutputData(characteristicsLabels.yLabels, predictedCharacteristics.dataSync());
    const suggestedLayouts = await layoutsFactory.getLayouts(characteristicsData, body.count);
    res.send({ layouts: suggestedLayouts });
  } catch (err) {
    console.log(err);
  }
});

// Server
app.listen(PORT, () => console.log(`Server started on localhost:${PORT}`));
