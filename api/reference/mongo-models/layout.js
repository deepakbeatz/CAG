const { string } = require("@tensorflow/tfjs-core");
var mongoose = require("mongoose");

var layoutSchema = new mongoose.Schema({
    id: String,
    content : String,
    type: String,
    rank: String,
});

module.exports = mongoose.model("layout", layoutSchema);