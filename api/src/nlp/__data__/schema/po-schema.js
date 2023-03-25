const keywordsSchemaMap = {
    'displayName': 'any',
    'isByCopy': 'true|false',
    'name': 'any',
    'xmlns': 'any',
    'xmlns$aetgt': 'any',
    'description': 'any',
    'detail': 'field',
    'detail%%field': 'label|name|nullable|required|type',
    'detail%%field%%label': 'any',
    'detail%%field%%name': 'any',
    'detail%%field%%nullable': 'nullable',
    'detail%%field%%required': 'required',
    'detail%%field%%type': 'attachment|attachments|checkbox|currency|date|datetime|email|formattedtext|image|integer|multiselectpicklist|number|objectlist|percent|phone|picklist|text',
}

class POSchema {
    userTokensMap;
    constructor() {
        this.userTokensMap = new Map();
    }
    
    insertToken(token) {
        this.userTokensMap.set(token, true);
    }

    getTokens(keyword, tokens) {
        const userTokens = [];
        tokens.forEach((token) => {
            let entries;
            if (token) {
                let isKeywordPresent = false;
                entries = Object.entries(keywordsSchemaMap).filter(([key, value]) => key.split("%%").includes(keyword) && value.split("|").includes(token));
                if (entries[0]) {
                    if (entries[0][0]) {
                        isKeywordPresent = true;
                        userTokens.push(entries[0][0]);
                    }
                }
                entries = Object.entries(keywordsSchemaMap).filter(([key, value]) => key === token);
                if (entries[0]) {
                    if (entries[0][0]) {
                        userTokens.push(entries[0][0]);
                    }                }
                entries = Object.entries(keywordsSchemaMap).filter(([key, value]) => (!keyword || (keyword && key.split("%%").includes(keyword))) && value === 'any' && !isKeywordPresent);
                if (entries[0]) {
                    if (entries[0][0]) {
                        userTokens.push(entries);
                    } 
                }
            }
        });
        return userTokens;
    }
}

module.exports = POSchema;