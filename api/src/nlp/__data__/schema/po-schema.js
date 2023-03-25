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
    'detail%%field%%nullable': 'boolean',
    'detail%%field%%required': 'boolean',
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

    getTokens(root, tokens) {
        const filteredSchemaMap = {};
        const filteredRootKeys = Object.keys(keywordsSchemaMap).filter((key) => key.includes(root.keyword));
        filteredRootKeys.forEach((key) => {
            if (key) {
                filteredSchemaMap[key] = keywordsSchemaMap[key];
            }
        });
        const userTokens = []
        for (let i =0; i < tokens.length; i++) {
            if (!tokens[i].visited) {
                if (tokens[i].keyword) {
                    const keySchemaVal = Object.entries(filteredSchemaMap).find(([key, value]) => key === tokens[i].keyword) || [];
                    if (keySchemaVal.length > 0) {
                        if (keySchemaVal[1] === 'boolean') {
                            const boolValues = ['true', 'false'];
                            if (i + 1 < tokens.length && boolValues.includes(tokens[i+1].token)) {
                                userTokens.push(tokens[i].keyword);
                                tokens[i+1].visited === true;
                            }
                        } else {
                            if (i + 1 < tokens.length) {
                                userTokens.push(`${tokens[i].keyword}%%${tokens[i+1].token}`);
                                tokens[i+1].visited === true;
                            }
                        }
                    }
                } else {
                    let isKeySet = false;
                    const filteredKeys = Object.entries(filteredSchemaMap).filter(([key, value]) => value.split("|").includes(tokens[i].token));
                    if (filteredKeys.length > 0) {
                        const filteredKey = filteredKeys[0][0];
                        if (filteredKey) {
                            userTokens.push(`${filteredKey}%%${tokens[i].token}`);
                        }
                    }
                    if (!isKeySet) {
                        const filteredKeys = Object.entries(filteredSchemaMap).filter(([key, value]) => value === 'any');
                        if (filteredKeys.length > 0) {
                            const filteredKey = filteredKeys[0][0];
                            if (filteredKey) {
                                userTokens.push(`${filteredKey}%%${tokens[i].token}`);
                            }
                        }
                    }
                }
            }
        }
        return userTokens;
    }
}

module.exports = POSchema;