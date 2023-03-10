var mongoose = require("mongoose");

var trainingDataSchema = new mongoose.Schema({
    orgId: String, // tenant specific
    modelType: String,
    xData : Array,
    yData : Array,
});

module.exports = mongoose.model("trainingdata", trainingDataSchema);
