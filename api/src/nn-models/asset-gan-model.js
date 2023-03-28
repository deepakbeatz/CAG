require("@tensorflow/tfjs-node");
const tf = require("@tensorflow/tfjs");
const fs = require("fs");
var {
    textToSequence,
    padSequence,
    splitSequenceToTrainParams,
    getInputSequence,
    getWordClass,
    toWords,
} = require("./nn-model-utils");

class AssetGANModel {
    modelName;
    generator;
    discriminator;
    model;
    corpus;
    vocabMap;
    vocabSequences;
    dataset;
    modelArtifacts;
    MAX_LENGTH = 20;
    EPOCHS = 250;
    BATCH_SIZE = 10;

    constructor() {
        this.corpus = "";
        this.generator = "";
        this.discriminator = "";
        this.model = null;
        this.vocabSequences = [];
        this.vocabMap = null;
        this.dataset = null;
        this.modelArtifacts = {
            generator: {},
            discriminator: {}
        };
    }

    initCorpus(corpusPath) {
        const data = fs.readFileSync(corpusPath, "utf8");
        if (data) {
            this.corpus = data.toLowerCase();
            const { sequence, sequenceMap } = textToSequence(this.corpus);
            console.log(sequenceMap);
            this.vocabSequences = sequence;
            this.vocabMap = sequenceMap;
        }
    }

    initModel(modelName, corpusPath) {
        this.initCorpus(corpusPath);
        this.loadModel(modelName);
    }

    async loadModel(modelName, trainModel = false, trainConfig = {}) {
        this.modelName = modelName;
        const generatorPath = `./src/nn-models/__models__/${modelName.toLowerCase()}-generator`;
        const discriminatorPath = `./src/nn-models/__models__/${modelName.toLowerCase()}-discriminator`;
        const modelExists = fs.existsSync(generatorPath) && fs.existsSync(discriminatorPath);
        if (modelExists && !trainModel) {
            const generatorJSON = `file://${generatorPath}/model.json`;
            const generatorWeights = `file://${generatorPath}/weights.bin`;
            const discriminatorJSON = `file://${discriminatorPath}/model.json`;
            const discriminatorWeights = `./src/nn-models/__models__/${modelName.toLowerCase()}-discriminator/weights.bin`;
            this.generator = await tf.loadLayersModel(
                generatorJSON, {weightPathPrefix: generatorWeights});
            this.discriminator = await tf.loadLayersModel(
                discriminatorJSON, {weightPathPrefix: discriminatorWeights});
            console.log(`--NNModelLogs: loaded NNModel ${this.modelName}`);
        } else {
            this.initGAN();
            this.trainFitModel(trainConfig);
        }
    }

    saveModel() {
        this.generator.save(`file://./src/nn-models/__models__/${this.modelName.toLowerCase()}-generator`);
        this.discriminator.save(`file://./src/nn-models/__models__/${this.modelName.toLowerCase()}-discriminator`);
        console.log(`--NNModelLogs: saved NNModel ${this.modelName}`);
    }

    initGANModel(generator, discriminator) {
        const gan = tf.sequential();
        gan.add(generator);
        gan.add(discriminator);
        generator.compile({
            optimizer: tf.train.adam(),
            loss: "categoricalCrossentropy",
        });
        discriminator.compile({
            optimizer: tf.train.adam(),
            loss: "binaryCrossentropy",
        });
        gan.compile({
            optimizer: tf.train.adam(),
            loss: "binaryCrossentropy",
        });
        this.model = gan;
    }

    initGAN() {
        // generator
        const generator = tf.sequential();
        generator.add(
            tf.layers.embedding({
                inputDim: this.vocabMap.size + 1,
                outputDim: 10,
                inputLength: 11,
            })
        );
        generator.add(tf.layers.lstm({ units: 50 }));
        generator.add(tf.layers.dropout(0.2));
        generator.add(
            tf.layers.dense({ units: this.vocabMap.size + 1, activation: "softmax" })
        );
        this.generator = generator;

        // discriminator
        const discriminator = tf.sequential({
            layers: [
                tf.layers.embedding({
                    inputDim: this.vocabMap.size + 1,
                    outputDim: 10,
                }),
                tf.layers.bidirectional({
                    layer: tf.layers.lstm({ units: 50 }),
                }),
                tf.layers.dense({
                    units: 1,
                    activation: "sigmoid",
                }),
            ],
        });
        this.discriminator = discriminator;
        this.initGANModel(this.generator, this.discriminator);
    }

    createTrainDataset(sequences, trainConfig) {
        const batchSize = trainConfig.batchSize || this.BATCH_SIZE;
        const mappedSequences = sequences.map((sequence) => {
            const [x, y] = splitSequenceToTrainParams([sequence]);
            const xTrain = tf.tensor(x);
            const yTrain = tf.oneHot(tf.tensor1d(y, "int32"), this.vocabMap.size + 1);
            return { xTrain, yTrain };
        });
        this.dataset = tf.data
            .array(mappedSequences)
            .batch(batchSize);
    }

    async trainGAN(trainConfig) {
        const epochs =  trainConfig.epochs || this.EPOCHS;
        const batchSize = trainConfig.batchSize || this.BATCH_SIZE;
        let epoch;
        for (epoch = 0; epoch < epochs; epoch++) {
            let genLoss = 0;
            let discLoss = 0;
            let count = 0;
            await this.dataset.forEachAsync(async ({ xTrain, yTrain }) => {
                // Train the generator
                const xFake = tf.randomUniform(
                    [batchSize, 11],
                    1,
                    this.vocabMap.size,
                    "int32"
                );
                const yFake = this.generator.predict(xFake);
                const xTrainReshaped = xTrain.reshape([
                    xTrain.shape[0] * (this.MAX_LENGTH),
                    11,
                ]);
                const yTrainReshaped = yTrain.reshape([
                    yTrain.shape[0] * (this.MAX_LENGTH),
                    this.vocabMap.size + 1,
                ]);
                const genBatchLoss = await this.generator.trainOnBatch(
                    xTrainReshaped,
                    yTrainReshaped
                );
                genLoss += genBatchLoss;
                count++;

                // Train the discriminator on real and fake data
                const discRealLoss = await this.discriminator.trainOnBatch(
                    yTrainReshaped,
                    tf.ones([yTrain.shape[0] * (this.MAX_LENGTH), 1])
                );
                const discFakeLoss = await this.discriminator.trainOnBatch(
                    yFake,
                    tf.zeros([batchSize, 1])
                );
                const discBatchLoss = (discRealLoss + discFakeLoss) / 2;
                discLoss += discBatchLoss;
            });
            genLoss /= count;
            discLoss /= count;
            console.log(
                `Epoch:${epoch + 1}`,
                `Generator loss: ${genLoss}`,
                `Discriminator loss:${discLoss}`
            );
        }

    }

    async trainFitModel(trainConfig) {
        const paddedSequence = padSequence(this.vocabSequences, this.MAX_LENGTH);
        this.createTrainDataset(paddedSequence, trainConfig);
        await this.trainGAN(trainConfig);
        this.saveModel();
        console.log("--NNModelLogs: GAN training completed!");
    }

    generateRandomSequence(length = 3) {
        const xFake = tf.randomUniform(
            [1, 11],
            1,
            this.vocabMap.size,
            "int32"
        );
        const noise = Array.from(xFake.dataSync());
        console.log('randomSeed->', toWords([noise], this.vocabMap));
        let sequenceArr = [];
        let inputSequence = '';
        let prev = '';
        while (length > 0) {
            const xPred = inputSequence && tf.tensor(inputSequence) || xFake;
            const yPred = this.generator.predict(xPred);
            const values = yPred.dataSync();
            const yPredArr = Array.from(values);
            const word = getWordClass(this.vocabMap, yPredArr);
            inputSequence = getInputSequence(word, this.vocabMap, prev);
            sequenceArr.push(word);
            prev = toWords(inputSequence, this.vocabMap);
            length -= 1;
        }
        return toWords([noise], this.vocabMap) + ' ' + sequenceArr.join(" ");
    }

    generateSequence(input, length = 3) {
        const inputData = input.toLowerCase();
        let inputSequence = getInputSequence(inputData, this.vocabMap);
        let sequenceArr = [];
        while (length > 0 && inputSequence.length > 0) {
            const xPred = tf.tensor(inputSequence);
            const yPred = this.generator.predict(xPred);
            const values = yPred.dataSync();
            const yPredArr = Array.from(values);
            const { word, key: prev } = getWordClass(this.vocabMap, yPredArr);
            inputSequence = inputSequence[0].slice(1);
            inputSequence.push(prev);
            inputSequence = [inputSequence];
            sequenceArr.push(word);
            length -= 1;
        }
        return sequenceArr.join(' ');
    }
}

module.exports = AssetGANModel;
