// utils for text pre-processing
var nlp = require("natural");
var stringSimilarity = require("string-similarity");
var { getAssetKeywords, getMapper } = require("./keywords");
const lemmatizer = require("node-lemmatizer");
var nlpLib = require("compromise");
var pos = require("pos");

// stopwords from ranks.nl
const stopwords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"];
const stopwordsMap = new Map(stopwords.map((entry) => [entry, true]));

const tokenizer = new nlp.WordTokenizer();
const stemmer = nlp.PorterStemmer;

const tokenize = (prompt) => {
  return tokenizer.tokenize(prompt);
};

const lemmatize = (token) => {
  const lemma = lemmatizer.lemmas(token, "verb");
  if (lemma && lemma.length > 0) {
    const lemmaVerbs = lemma[0];
    if (lemmaVerbs.length > 0) {
      return lemmaVerbs[0];
    }
  }
  return token;
};

const tokenizeAndStem = (prompt) => stemmer.tokenizeAndStem(prompt);

const spellCheck = (tokens, corpus) => {
  const spellcheck = new natural.Spellcheck(corpus);
  return tokens.map((token) => spellcheck.getCorrections(token, 1)[0]);
};

const mapToKeywords = (tokens, mapper) => {
  return tokens.map((token) => mapper.getMapping(token));
};

const preprocess = (prompt, assetType) => {
  const mapper = getMapper(assetType) || {};
  const tokens = tokenize(prompt)
    .map(lemmatize)
    .filter((token) => !stopwordsMap.has(token));
  return mapToKeywords(tokens, mapper);
};

const contextualGrouping = (prompt, assetType) => {
  const mapper = getMapper(assetType) || {};
  const keywords = getAssetKeywords(assetType) || [];
  const encodeMap = new Map();

  const encode = (token) => {
    if (token.includes("+")) {
      const encodedToken = `noun${encodeMap.size}`;
      encodeMap.set(encodedToken, token);
      return encodedToken;
    }
    return token;
  };

  const decode = (word) => encodeMap.get(word) ?? word;

  const transformedTokens = prompt.split(" ").map((token) => {
    let updatedToken = encode(token);
    updatedToken = lemmatize(updatedToken);
    return mapper.getMapping(updatedToken);
  });
  // console.log("transformedTokens", transformedTokens);

  const tokensJSON = nlpLib(transformedTokens.join(" ")).json();
  const posMap = new Map(
    tokensJSON[0].terms.map((term) => [term.text, term.tags])
  );
  // console.log("posMap", posMap);

  const userKeyWords = [];
  transformedTokens.forEach((token, index) => {
    if (keywords.find((word) => word.split("%%").includes(token))) {
      userKeyWords.push({ index, token });
    }
  });

  // cluster the neighboring tokens around the keywords together
  for (let i = 0; i < userKeyWords.length; i++) {
    const cluster = [];
    let left = userKeyWords[i].index;
    let right = userKeyWords[i].index;

    cluster.push(decode(transformedTokens[userKeyWords[i].index]));

    while (left >= 0) {
      if (left !== userKeyWords[i].index) {
        const decodedToken = decode(transformedTokens[left]);
        const isNoun =
          posMap.get(decodedToken)?.includes("Noun") ||
          posMap.get(decodedToken)?.includes("Adjective");
        const isUserKeyword = userKeyWords.find(
          (word) => word.token === decodedToken
        );
        if (isUserKeyword || !isNoun) {
          break;
        }
        cluster.push(decode(transformedTokens[left], encodeMap));
      }
      left--;
    }

    while (right < transformedTokens.length) {
      if (right !== userKeyWords[i].index) {
        const decodedToken = decode(transformedTokens[right]);
        const isNoun =
          posMap.get(decodedToken)?.includes("Noun") ||
          posMap.get(decodedToken)?.includes("Adjective");
        const isUserKeyword = userKeyWords.find(
          (word) => word.token === decodedToken
        );
        if (isUserKeyword) {
          break;
        }
        if (isNoun) {
          cluster.push(decode(transformedTokens[right], encodeMap));
        }
      }
      right++;
    }

    console.log(`cluster-${i}`, cluster);
  }
};

module.exports = {
  tokenize,
  tokenizeAndStem,
  spellCheck,
  preprocess,
  contextualGrouping,
};
