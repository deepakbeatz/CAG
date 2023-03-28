var { toJSON } = require("../../../json/json-utils");

const randomNumber = (limit) => {
    return Math.floor(Math.random() * limit);
}
class POEnricherModel {
    model;
    schemaMap;
    generatedJSON;

    constructor() {
        this.model = null;
        this.schemaMap = {};
        this.generatedJSON = {};
    }

    initModel(model, schemaMap) {
        this.model = model;
        this.schemaMap = schemaMap;
    }

    processToken(generatedToken, keyword) {
        if (keyword === 'description') {
            let descToken = generatedToken;
            if (generatedToken.includes('<any>') && this.generatedJSON.processObject && this.generatedJSON.processObject.displayName) {
                descToken = generatedToken.replace('<any>', this.generatedJSON.processObject.displayName);
            } else if (generatedToken.includes('<any>')) {
                descToken = generatedToken.replace('<any>', 'process');
            }
            return descToken;
        }
        if (keyword.includes('detail%%field')) {
            const options = this.schemaMap[keyword];
            if (options === 'boolean') {
                if (generatedToken.includes('<any>')) {
                    const boolOptions = ['true', 'false'];
                    const number = randomNumber(2);
                    if (boolOptions[number]) {
                        return boolOptions[number];
                    }
                }
                return generatedToken;
            } else if(options.includes('|')) {
                if (generatedToken.includes('<any>')) {
                    const fieldOptions = options.split('|');
                    const number = randomNumber(fieldOptions.length);
                    if (fieldOptions[number]) {
                        return fieldOptions[number];
                    }
                }
                return generatedToken;
            }
        }
    }

    enrichTokensToJSON(tokens) {
        this.generatedJSON = {
            processObject: {
                "displayName": "",
                "isByCopy": "false",
                "name": "",
                "xmlns": "http:\/\/schemas.active-endpoints.com\/appmodules\/screenflow\/2011\/06\/avosHostEnvironment.xsd",
                "xmlns$aetgt": "http:\/\/schemas.active-endpoints.com\/appmodules\/repository\/2010\/10\/avrepository.xsd",
                "description": {},
                "tags": {},
                detail: {
                    field: [],
                }
            }
        };
        const userJSON = toJSON(tokens);

        if (userJSON.name || userJSON.displayName) {
            this.generatedJSON.processObject.name = userJSON.name || userJSON.displayName;
            this.generatedJSON.processObject.displayName = userJSON.displayName || userJSON.name ;
        }
        if (!userJSON.name && !userJSON.displayName) {
            this.generatedJSON.processObject.name = "ProcessObject";
            this.generatedJSON.processObject.displayName = "ProcessObject";
        }

        //enrich description
        if (userJSON.description) {
            this.generatedJSON.processObject.description = { $t: userJSON.description }
        } else {
            this.generatedJSON.processObject.description = {};
        }
        if (!this.generatedJSON.processObject.description.$t && userJSON.name) {
            const generatedTokens = this.model.generateSequence(`displayName##${userJSON.name}`, 10);
            const descKeywordIndex = generatedTokens.findIndex((token) => token.includes("description"));
            if (descKeywordIndex !== -1) {
                const descriptionText = this.processToken(generatedTokens[descKeywordIndex + 1], "description");
                this.generatedJSON.processObject.description.$t = descriptionText;
            }
        }
        
        // enrich fields
        if (userJSON.detail && userJSON.detail.field) {
            userJSON.detail.field = Array.isArray(userJSON.detail.field) ? userJSON.detail.field : [userJSON.detail.field];
            this.generatedJSON.processObject.detail = {
                field: userJSON.detail.field.map((field) => {
                    const generatedTokens = this.model.generateSequence(`detail%%field%%label##${field.label}`, 10);
                    const nameIndex = generatedTokens.findIndex(token => token === 'detail%%field%%name');
                    const nullableIndex = generatedTokens.findIndex(token => token === 'detail%%field%%nullable');
                    const requiredIndex = generatedTokens.findIndex(token => token === 'detail%%field%%required');
                    const typeIndex = generatedTokens.findIndex(token => token === 'detail%%field%%type');
                    const mappedField = {
                        label: field.label || '',
                        name: field.name || (nameIndex !== -1 && this.processToken(generatedTokens[nameIndex+1], "detail%%field%%name")) || '',
                        nullable: field.nullable || (nullableIndex !== -1 && this.processToken(generatedTokens[nullableIndex+1], "detail%%field%%nullable")) || false,
                        required: field.required || (requiredIndex !== -1 && this.processToken(generatedTokens[requiredIndex+1], "detail%%field%%required")) || false,
                        type: field.type || (typeIndex !== -1 && this.processToken(generatedTokens[typeIndex+1], "detail%%field%%type")) || '',
                    }
                    return mappedField;
                })
            };
        }
        
        return this.generatedJSON;
    }
}

module.exports = POEnricherModel;