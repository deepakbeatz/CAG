var tf = require("@tensorflow/tfjs");

function shuffleData(unshuffled) {
    const shuffled = unshuffled
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    return shuffled;
  }

function getTestTrainingParams(trainingData, trainingLabels, splitRatio = 0.75, skipLabelsMatch = false, shuffle = false) {
    const xData = [], yData = [];
    const xLabels = trainingLabels.xLabels;
    const yLabels = trainingLabels.yLabels;
    let shuffledTrainingData = [...trainingData];
    if (shuffle) {
        shuffledTrainingData = shuffleData(trainingData);
    }
    shuffledTrainingData.forEach((trainingDataMember) => {
        let xTrainData = [...new Array(xLabels.length)].fill(0,0,xLabels.length);
        let yTrainData = [...new Array(yLabels.length)].fill(0,0,yLabels.length);
        if(!skipLabelsMatch) {
            trainingDataMember.xData.forEach((xDataValue) => {
                const index = xLabels.indexOf(xDataValue);
                if(index!==-1) {
                    xTrainData[index] = 1;
                }
            });
            trainingDataMember.yData.forEach((yDataValue) => {
                const index = yLabels.indexOf(yDataValue);
                if(index!==-1) {
                    yTrainData[index] = 1;
                }
            });
            xData.push(xTrainData);
            yData.push(yTrainData);
        } else {
            xData.push(trainingDataMember.xData);
            yData.push(trainingDataMember.yData);
        }
    });
    const splitIndex = Math.floor(trainingData.length*splitRatio);
    const xTrain = xData.slice(0, splitIndex);
    const xTest = xData.slice(splitIndex, xData.length);
    const yTrain = yData.slice(0, splitIndex);
    const yTest = yData.slice(splitIndex, yData.length);
    return { xTrain: tf.tensor(xTrain), yTrain: tf.tensor(yTrain), xTest: tf.tensor(xTest), yTest: tf.tensor(yTest) };
}

function toArrayBuffer(buf) {
    var ab = new ArrayBuffer(buf.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
}

function toBuffer(ab) {
    var buf = Buffer.alloc(ab.byteLength);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}
function getInputTensor(xLabels, xPred) {
    const xData = [...new Array(0)];
    let xPredData = [...new Array(xLabels.length)].fill(0,0,xLabels.length);
    xPred.forEach((xPredLabel) => {
        const index = xLabels.indexOf(xPredLabel);
        if(index!==-1) {
            xPredData[index] = 1;
        }
    });
    xData.push(xPredData);
    return tf.tensor(xData);
}

function getInputData(xLabels, xPred) {
    let xPredData = [...new Array(xLabels.length)].fill(0,0,xLabels.length);
    xPred.forEach((xPredLabel) => {
        const index = xLabels.indexOf(xPredLabel);
        if(index!==-1) {
            xPredData[index] = 1;
        }
    });
    return xPredData;
}
function getOutputLabels(ylabels, yPred, threshold = 0.5) {
    ypredLabels = [];
    yPred.forEach((yPredValue, index) => {
        if(yPredValue > threshold) {
            ypredLabels.push(ylabels[index]);
        }
    });
    return ypredLabels;
}

function getOutputData(ylabels, yPred) {
    const outputData = {};
    yPred.forEach((yPredValue, index) => {
        outputData[ylabels[index]] = yPredValue;
    });
    return outputData;
}

function getCombinedTensor(array1, array2) {
    return tf.tensor([[...array1,...array2]]);
}

module.exports = {
    getTestTrainingParams: getTestTrainingParams,
    toArrayBuffer: toArrayBuffer,
    toBuffer: toBuffer,
    getInputTensor: getInputTensor,
    getOutputLabels: getOutputLabels,
    getCombinedTensor: getCombinedTensor,
    getInputData: getInputData,
    getOutputData: getOutputData,
    shuffleData: shuffleData
}