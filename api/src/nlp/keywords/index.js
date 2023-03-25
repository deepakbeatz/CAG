const ioUtils = require('../../io/io-utils');
const KeywordsMapperModel = require('../../nn-models/keywords-mapper-model');
const POSchema = require("../__data__/schema/po-schema");

// Path
const PO_KEYWORDS_PATH = "./src/nlp/__data__/po-keywords.csv";
const SC_KEYWORDS_PATH = "./src/nlp/__data__/sc-keywords.csv";
const AC_KEYWORDS_PATH = "./src/nlp/__data__/ac-keywords.csv";

// Mappers
const poMapper = new KeywordsMapperModel();
poMapper.initModel("./src/nlp/__data__/mapper/POKeywordsMapperData.xlsx");


// Asset Keywords Registry
const assetKeywordsModelRegistry = new Map();
assetKeywordsModelRegistry.set("process object", { keywords: ioUtils.parseCSVFile(PO_KEYWORDS_PATH), mapper: poMapper, schema: POSchema });
assetKeywordsModelRegistry.set("service connector", { keywords: ioUtils.parseCSVFile(SC_KEYWORDS_PATH), mapper: {}, schema: {} });
assetKeywordsModelRegistry.set("app connection", { keywords: ioUtils.parseCSVFile(AC_KEYWORDS_PATH), mapper: {}, schema: {} });

const getAssetKeywords = (type) => {
    return assetKeywordsModelRegistry.get(type).keywords || [];
}

const getMapper = (type) => {
    return assetKeywordsModelRegistry.get(type).mapper || {};
}

const getSchema = (type) => {
    return assetKeywordsModelRegistry.get(type).schema || {};
}

module.exports = {
    getAssetKeywords: getAssetKeywords,
    getMapper: getMapper,
    getSchema: getSchema,
}

