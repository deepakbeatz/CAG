var mongoose = require("mongoose");

var nnModelSchema = new mongoose.Schema({
    orgId: String,
    modelType: String,
    modelTopology : String,
    weightSpecs: String,
    weightData: Buffer
});

module.exports = mongoose.model("nnModel", nnModelSchema);
