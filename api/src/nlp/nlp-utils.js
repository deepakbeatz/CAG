// utils for text pre-processing
var nlp = require("natural");
var stringSimilarity = require("string-similarity");
var { getAssetKeywords, getMapper } = require("./keywords");
const lemmatizer = require('node-lemmatizer');

// stopwords from ranks.nl
const stopwords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
const stopwordsMap = new Map(stopwords.map(entry => [entry, true]));

const tokenizer = new nlp.WordTokenizer();
const stemmer = nlp.PorterStemmer;

const tokenize = (prompt) => {
  return tokenizer.tokenize(prompt);
};

const tokenizeAndStem = (prompt) => {
  return stemmer.tokenizeAndStem(prompt);
}

const spellCheck = (tokens, corpus) => {
  const spellcheck = new natural.Spellcheck(corpus);
  return tokens.map((token) => spellcheck.getCorrections(token, 1)[0]);
}

const mapToKeywords = (tokens, mapper) => {
  return tokens.map((token) => {
    console.log(token, mapper.getClassifications(token));
    return token
  });
}

const preprocess = (prompt, assetType) => {
  const mapper = getMapper(assetType) || {};
  return mapToKeywords(tokenize(prompt).map((token) => {
    const lemma = lemmatizer.lemmas(token, 'verb'); 
    if (lemma && lemma.length > 0) {
      const lemmaVerbs = lemma[0];
      if (lemmaVerbs.length > 0) {
        return lemmaVerbs[0];
      }
    }
    return token
  }).filter(token => !stopwordsMap.has(token)), mapper);
}

module.exports = {
  tokenize: tokenize,
  tokenizeAndStem: tokenizeAndStem,
  spellCheck: spellCheck,
  preprocess: preprocess,
};
