var mongoose = require("mongoose");

var trainingLabelSchema = new mongoose.Schema({
    modelType: String,
    xLabels : Array,
    yLabels : Array,
});

module.exports = mongoose.model("traininglabel", trainingLabelSchema);
