var { tokenize } = require("../nlp/nlp-utils");
var stringSimilarity = require("string-similarity");

const padSequence = (sequences, maxLength) => {
  return sequences.map((sequence) => {
    if (sequence.length > maxLength) {
      sequence.slice(parseInt(`-${maxLength}`));
    }
    while (sequence.length <= maxLength) {
      sequence.push(0);
    }
    return sequence;
  });
};

const textToSequence = (vocab) => {
  const tokens = vocab.split(/\r?\n/).join(',').split(",").map((token) => token.split("##")).flat();
  const sequenceMap = new Map();
  let newVal = 1;
  tokens.forEach((token) => {
    if (!sequenceMap.has(token)) {
      sequenceMap.set(token, newVal);
      newVal += 1;
    }
  });
  const sequences = vocab
    .split(/\r?\n/)
    .map((sequenceVal) => sequenceVal.split(",").map((token) => token.split("##")).flat());

  const sequence = sequences.map((sequenceVal) =>
    sequenceVal.map((token) => sequenceMap.get(token) || 0)
  );
  return {
    sequence,
    sequenceMap,
  };
};

const splitSequenceToTrainParams = (sequences) => {
  const xTrain = [];
  const yTrain = [];
  sequences.forEach((sequence) => {
    for (let i = 2; i < sequence.length; i++) {
      xTrain.push([sequence[i - 2], sequence[i - 1]]);
      yTrain.push(sequence[i]);
    }
  });
  return [xTrain, yTrain];
};

const getTokenVector = (sequenceMap, token) => {
  if (sequenceMap.has(token.toLowerCase())) {
    return sequenceMap.get(token.toLowerCase());
  }
  let maxSimilarity = {
    word: '',
    value: -1
  };
  for (let [key, value] of sequenceMap.entries()) {
    const similarity = stringSimilarity.compareTwoStrings(key.toLowerCase(), token.toLowerCase());
    if (similarity > maxSimilarity.value) {
        maxSimilarity = {
            word: key.toLowerCase(),
            value: similarity
        }
    }
  }
  if (maxSimilarity.value > 0.75) {
    return sequenceMap.get(maxSimilarity.word);
  }
  return 0;
}

const getInputSequence = (input, sequenceMap, prev) => {
  let xPred = [];
  const tokens = input.split(",").map((token) => token.split("##")).flat();
  if (tokens.length === 1) {
    xPred = [getTokenVector(sequenceMap, tokens[0]), 0];
    if (prev) {
      const prevTokens = prev.split(",").map((token) => token.split("##")).flat();
      xPred = [getTokenVector(sequenceMap, prevTokens[prevTokens.length - 1]), getTokenVector(sequenceMap, tokens[0])];
    }
  } else if (tokens.length > 1) {
    xPred = [
      getTokenVector(sequenceMap, tokens[tokens.length - 2]) || 0,
      getTokenVector(sequenceMap, tokens[tokens.length - 1]) || 0,
    ];
  }
  return [xPred];
};

function getByValue(map, searchValue) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue) return key;
  }
  return "";
}

const getWordClass = (sequenceMap, yPredArr) => {
  let maxDetails = {
    index: 0,
    value: -1,
  };
  yPredArr.forEach((yValue, index) => {
    if (yValue > maxDetails.value && index !== 0) {
      maxDetails.value = yValue;
      maxDetails.index = index;
    }
  });
  return getByValue(sequenceMap, maxDetails.index);
};

const toWords = (inputSequence, sequenceMap) => {
  let words = '';
  inputSequence.forEach((sequence) => {
    if (sequence.length > 0) {
      words = sequence.map((data) => getByValue(sequenceMap, data)).join(',');
    }
  });
  return words;
}
const randomIntFromInterval = (min, max) => { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function toBuffer(ab) {
  var buf = Buffer.alloc(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
  }
  return buf;
}

function toArrayBuffer(buf) {
  var ab = new ArrayBuffer(buf.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
      view[i] = buf[i];
  }
  return ab;
}

module.exports = {
  padSequence: padSequence,
  textToSequence: textToSequence,
  splitSequenceToTrainParams: splitSequenceToTrainParams,
  getInputSequence: getInputSequence,
  getWordClass: getWordClass,
  randomIntFromInterval: randomIntFromInterval,
  toWords:toWords,
  toBuffer: toBuffer,
  toArrayBuffer: toArrayBuffer,
};
