var nlp = require("natural");
var { parseExcelFile } = require("../io/io-utils");

class AssetClassifierModel {
  model;
  constructor() {
    this.model = null;
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
            this.model.addDocument(xData, yData);
          }
        });
        this.model.train();
        console.log("--NNModelLogs: AssetClassifierModel initialized");
      }
    });
  }

  classify(text) {
    return this.model.classify(text);
  }
}

module.exports = AssetClassifierModel;
