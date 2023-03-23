const ioUtils = require('../../io/io-utils');
const KeywordsMapperModel = require('../../nn-models/keywords-mapper-model');

// Path
const PO_KEYWORDS_PATH = "./src/nlp/__data__/po-keywords.csv";
const SC_KEYWORDS_PATH = "./src/nlp/__data__/sc-keywords.csv";
const AC_KEYWORDS_PATH = "./src/nlp/__data__/ac-keywords.csv";

// Mappers
const poMapper = new KeywordsMapperModel();
poMapper.initModel("./src/nlp/__data__/mapper/POKeywordsMapperData.xlsx");

// Asset Keywords Registry
const assetKeywordsModelRegistry = new Map();
assetKeywordsModelRegistry.set("process object", { keywords: ioUtils.parseCSVFile(PO_KEYWORDS_PATH), mapper: poMapper });
assetKeywordsModelRegistry.set("service connector", { keywords: ioUtils.parseCSVFile(SC_KEYWORDS_PATH), mapper: {} });
assetKeywordsModelRegistry.set("app connection", { keywords: ioUtils.parseCSVFile(AC_KEYWORDS_PATH), mapper: {} });

const getAssetKeywords = (type) => {
    return assetKeywordsModelRegistry.get(type).keywords || [];
}

const getMapper = (type) => {
    return assetKeywordsModelRegistry.get(type).mapper || {};
}

module.exports = {
    getAssetKeywords: getAssetKeywords,
    getMapper: getMapper,
}

