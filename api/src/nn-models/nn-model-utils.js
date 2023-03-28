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
  sequenceMap.set('<any>', 1);
  let newVal = 2;
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
    for (let i = 0; i < sequence.length - 1; i++) {
      const seqClone = [...sequence];
      const seqVal = seqClone.slice(0, i+1);
      while(seqVal.length < 12) {
        seqVal.unshift(0);
      }
      xTrain.push([seqVal[0], seqVal[1], seqVal[2], seqVal[3],seqVal[4], seqVal[5], seqVal[6], seqVal[7], seqVal[8], seqVal[9], seqVal[10]]);
      yTrain.push(seqVal[11]); 
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
  return sequenceMap.get('<any>')
}

const getInputSequence = (input, sequenceMap) => {
  let tokens = input.split(",").map((token) => token.split("##")).flat().map((token) => getTokenVector(sequenceMap, token));
  if (tokens.length > 11) {
    tokens = tokens.splice(tokens.length - 11);
  }
  while(tokens.length < 11) {
    tokens.unshift(0);
  }
  return [tokens];
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
  return {word: getByValue(sequenceMap, maxDetails.index), key: maxDetails.index};
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
