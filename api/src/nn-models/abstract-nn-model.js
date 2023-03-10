var tf = require("@tensorflow/tfjs");

class AbstractNNModel {
  constructor(model) {
    this.model = model;
    this.modelArtifacts = {};
  }

  setModelArtifacts(artifacts) {
    if (artifacts.length) {
      this.modelArtifacts = {
        modelTopology: artifacts[0].modelTopology,
        weightSpecs: artifacts[0].weightSpecs,
        weightData: artifacts[0].weightData,
      };
    }
  }

  getModelArtifacts() {
    return this.modelArtifacts;
  }

  setTestTrainingParams(trainingParams) {
    this.xTrain = trainingParams.xTrain;
    this.yTrain = trainingParams.yTrain;
    this.xTest = trainingParams.xTest;
    this.yTest = trainingParams.yTest;
  }

  setCompileOptions(compileOptions) {
    this.compileOptions = compileOptions;
  }

  async compile() {
    try {
      await this.model.compile(this.compileOptions);
    } catch (e) {
      console.log(e);
    }
  }

  async train(trainConfig) {
    const artifactsArray = [];
    try {
      await this.model.fit(this.xTrain, this.yTrain, {
        epochs: trainConfig.epochs,
        batchSize: trainConfig.batchSize,
        validationData: [this.xTest, this.yTest],
      });
      await this.model.save(
        tf.io.withSaveHandler((artifacts) => {
          artifactsArray.push(artifacts);
        })
      );
      this.setModelArtifacts(artifactsArray);
      console.log("Training Completed!");
    } catch (e) {
      console.log(e);
    }
  }

  /**
   *
   * @param {*} xData
   * @returns predicted data
   * method to predict the data
   */
  predict(xData) {
    const yData = this.model.predict(xData);
    return yData;
  }
}

module.exports = AbstractNNModel;
