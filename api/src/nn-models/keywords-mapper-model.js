var nlp = require("natural");
var { parseExcelFile } = require("../io/io-utils");
var stringSimilarity = require("string-similarity"); // Sørensen–Dice coefficient based similarity

class KeywordsMapperModel {
  model;
  constructor() {
    this.dataMap = new Map();
  }

  addMapping(x, y) {
    if (!this.dataMap.has(x)) {
        this.dataMap.set(x, y);
    }
  }

  initModel(path) {
    this.model = new nlp.BayesClassifier();
    parseExcelFile(path).then((rows) => {
      const dataRows = rows.slice(1);
      if (dataRows && dataRows.length > 1) {
        dataRows.forEach((row) => {
          if (row && row.length > 1) {
            const xData = row[0];
            const yData = row[1];
            this.addMapping(xData, yData);
          }
        });
        console.log("--NNModelLogs: KeywordsMapperModel initialized");
      }
    });
  }

  getMapping(token) {
    let maxSimilarity = {
        word: '',
        value: -1
    };
    for (const [key, value] of this.dataMap.entries()) {
        const similarity = stringSimilarity.compareTwoStrings(token.toLowerCase(), key.toLowerCase());
        if (similarity > maxSimilarity.value) {
            maxSimilarity = {
                word: key,
                value: similarity
            } 
        }
    }
    if (maxSimilarity.value > 0.75) {
        return this.dataMap.get(maxSimilarity.word);
    }
    return token;
  }
}

module.exports = KeywordsMapperModel;
