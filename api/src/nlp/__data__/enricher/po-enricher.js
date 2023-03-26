var { toJSON } = require("../../../json/json-utils");

class POEnricherModel {
    model;
    schemaMap;
    constructor() {
        this.model = null;
        this.schemaMap = {};
    }

    initModel(model, schemaMap) {
        this.model = model;
        this.schemaMap = schemaMap;
    }

    enrichTokensToJSON(tokens) {
        const poJSON = {
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
        const aiToggle = false;
        const userJSON = toJSON(tokens);

        //enrich description
        if (userJSON.description) {
            poJSON.processObject.description = { $t: userJSON.description }
        } else {
            poJSON.processObject.description = {};
        }
        if (aiToggle && !poJSON.processObject.description.$t && userJSON.name) {
            const generatedTokens = this.model.generateSequence(`displayName##${userJSON.name}`, 10).split(",");
            const generatedDescription = generatedTokens.find((token) => token.include("description##"));
            if (generatedDescription) {
                const descTokens = generatedDescription.split("##");
                const descriptionText = descTokens[descTokens.length - 1];
                poJSON.processObject.description.$t = descriptionText;
            }
        }
        if (userJSON.name || userJSON.displayName) {
            poJSON.processObject.name = userJSON.name || userJSON.displayName;
            poJSON.processObject.displayName = userJSON.displayName || userJSON.name ;
        }
        if (!userJSON.name && !userJSON.displayName) {
            poJSON.processObject.name = "ProcessObject";
            poJSON.processObject.displayName = "ProcessObject";
        }

        // enrich fields - FIX Model
        if (userJSON.detail && userJSON.detail.field) {
            userJSON.detail.field = Array.isArray(userJSON.detail.field) ? userJSON.detail.field : [userJSON.detail.field];
            poJSON.processObject.detail = {
                field: userJSON.detail.field.map((field) => {
                    const mappedField = {
                        label: field.label || '',
                        name: field.name || '',
                        nullable: field.nullable || false,
                        required: field.required || false,
                        type: field.type,
                    }
                    return mappedField;
                })
            };
        }
        
        return poJSON;
    }
}

module.exports = POEnricherModel;