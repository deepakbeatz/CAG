// utils for text pre-processing
var nlp = require("natural");

const tokenizer = new nlp.WordTokenizer();

const tokenize = (prompt) => {
  return tokenizer.tokenize(prompt);
};

module.exports = {
  tokenize: tokenize,
};
