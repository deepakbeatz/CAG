var tf = require("@tensorflow/tfjs");
var genericNNModel = require("../generic-neural-network-model");
var nnModel = require("../../mongo-models/nnModel");
var traininglabel = require("../../mongo-models/trainingLabel");
var trainingdata = require("../../mongo-models/trainingData");
var modelUtils = require("../model-utils");

var componentsModel;
var newModel;
var trainingLabels;
var trainingData;

async function getNewModel() {
  let tfModel;
  try {
    trainingLabels = await traininglabel.findOne({ modelType: "components"});
    tfModel = tf.sequential({
      layers: [
        tf.layers.dense({inputDim: trainingLabels.xLabels.length, units: 64, activation: 'relu'}),
        tf.layers.dense({units: 32, activation: 'relu'}),
        tf.layers.dense({units: trainingLabels.yLabels.length, activation: 'sigmoid'}),
      ]
    });
  } catch(err) {
    console.log(err);
  }
  return tfModel;
}

async function getTestTrainingData(orgId) {
  if (!trainingLabels) {
    trainingLabels = await traininglabel.findOne({ modelType: "components"});
  }
  trainingData = await trainingdata.find({ orgId: orgId, modelType: "components"});
  const testTrainingParams = modelUtils.getTestTrainingParams(trainingData, trainingLabels);
  return testTrainingParams;
}

module.exports = {
  loadModel: async function (orgId) {
    try {
      const loadedModel = await nnModel.findOne({orgId: orgId, modelType: "components"});
      var parsedModel;
      if (loadedModel) {
        parsedModel = await tf.loadLayersModel(
          tf.io.fromMemory(
            JSON.parse(loadedModel.modelTopology),
            JSON.parse(loadedModel.weightSpecs),
            modelUtils.toArrayBuffer(loadedModel.weightData)
          )
        );
      } else {
        newModel = await getNewModel();
      }
      componentsModel = parsedModel || newModel;
      const componentsNNmodel = new genericNNModel(componentsModel);
      componentsNNmodel.setCompileOptions({
        optimizer: 'sgd',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
      });
      await componentsNNmodel.compile();
      const testTrainingData = await getTestTrainingData(orgId);
      componentsNNmodel.setTestTrainingParams(testTrainingData);
      return componentsNNmodel;
    } catch(err) {
      console.log(err);
    }
  },

  saveModel: async function (orgId, modelArtifacts) {
    try {
      await nnModel.updateOne(
        { orgId: orgId, modelType: "components" },
        {
          orgId: orgId,
          modelType: "components",
          modelTopology: JSON.stringify(modelArtifacts.modelTopology),
          weightSpecs: JSON.stringify(modelArtifacts.weightSpecs),
          weightData: modelUtils.toBuffer(modelArtifacts.weightData),
        },
        { upsert: true }
      );
      console.log("success");
    } catch (err) {
      console.log(err);
    }
  }
}
