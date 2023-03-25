var nlpLib = require("compromise");
const lemmatizer = require("node-lemmatizer");

class TokenWord {
    index;
    token;
    visited;
    constructor(index, token, visited, keyword = null) {
        this.index = index,
            this.token = token,
            this.visited = visited,
            this.keyword = keyword
    }
}

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

const encode = (token, encodeMap) => {
    if (token.includes("+")) {
        const encodedToken = `noun${encodeMap.size}`;
        encodeMap.set(encodedToken, token);
        return encodedToken;
    }
    return token;
};

const decode = (word, encodeMap) => (encodeMap.get(word) || word).replace('+', ' ');

const isChildToken = (token, root) => {
    if (token.keyword) {
        return token.keyword.includes(root.keyword) && token.index > root.index;
    }
    return false;
}

const populateChildKeyword = (keywords, token, root) => {
    if (root.keyword.includes('%%')) {
        const filteredKeys = keywords.filter((keyword) => keyword.split("%%").includes(token.token));
        token.keyword = null;
        filteredKeys.forEach((key) => {
            if (key.includes(root.keyword) && token.index > root.index) {
                if (!token.keyword) {
                    token.keyword = key;
                }
            }
        })
    }
}

const isNoun = (token, posMap) => {
    if (!token.keyword) {
        return posMap.get(token.token).includes("Noun") ||
            posMap.get(token.token).includes("Adjective");
    }
    return true;
}

const isConjunction = (token, posMap) => {
    return posMap.get(token).includes("Conjunction");
}

const isKeyword = (keywords, token, root) => {
    let isKeywordToken = false;
    if (root && root.keyword) {
        const keywordIndex = keywords.findIndex(
            (word) => (word.token === token.token || word.keyword === token.keyword)
        );
        isKeywordToken = keywordIndex !== -1 && !isChildToken(token, root);
        console.log('1', token.token, root.token, isKeywordToken, keywordIndex);
    } else {
        const keywordIndex = keywords.findIndex(
            (word) => (word.token === token.token || word.keyword === token.keyword)
        );
        isKeywordToken = keywordIndex !== -1;
    }
    return isKeywordToken;
};

class ContextualPreProcessor {
    clusters;
    keywords;
    mapper;
    constructor(keywords, mapper, schema) {
        this.clusters = [];
        this.keywords = keywords;
        this.mapper = mapper;
        this.schema = schema;
    }

    transform(prompt, encodeMap) {
        const transformedTokens = prompt.replace(/,/g, " and ").split(/\s+/).map((token) => {
            let updatedToken = encode(token, encodeMap);
            updatedToken = lemmatize(updatedToken);
            return this.mapper.getMapping(updatedToken);
        });
        const transformedPrompt = transformedTokens.join(" ");
        return transformedPrompt;
    }

    cluster(prompt) {
        const encodeMap = new Map();
        const transformedPrompt = this.transform(prompt, encodeMap);
        const transformedTokens = transformedPrompt.split(" ");
        const tokensJSON = nlpLib(transformedPrompt).json();
        const posMap = new Map(
            tokensJSON[0].terms.map((term) => [term.text, term.tags])
        );
        const promptTokenWords = transformedTokens.map((token, index) => new TokenWord(index, token, false));
        const userTokenKeyWords = [];
        promptTokenWords.forEach((tokenWord) => {
            const keywordFound = this.keywords.find((word) =>
                word.split("%%").includes(tokenWord.token)
            );
            if (keywordFound) {
                tokenWord.keyword = keywordFound;
                userTokenKeyWords.push(tokenWord);
            }
        });
        console.log(userTokenKeyWords);
        // cluster the neighboring tokens around the keywords together
        for (let i = 0; i < userTokenKeyWords.length; i++) {
            const clusterGroup = [];
            if (!userTokenKeyWords[i].visited) {
                let left = userTokenKeyWords[i].index;
                let right = userTokenKeyWords[i].index;
                promptTokenWords[userTokenKeyWords[i].index].token = decode(promptTokenWords[userTokenKeyWords[i].index].token, encodeMap)
                clusterGroup.push(promptTokenWords[userTokenKeyWords[i].index]);
                userTokenKeyWords[i].visited = true;
                while (left >= 0) {
                    if (left !== userTokenKeyWords[i].index) {
                        populateChildKeyword(this.keywords, promptTokenWords[left], userTokenKeyWords[i]);
                        const keyword = isKeyword(
                            userTokenKeyWords,
                            promptTokenWords[left],
                            userTokenKeyWords[i]
                        );
                        if (keyword || !isNoun(promptTokenWords[left], posMap)) {
                            break;
                        }
                        promptTokenWords[left].token = decode(promptTokenWords[left].token, encodeMap)
                        clusterGroup.push(promptTokenWords[left]);
                        promptTokenWords[left].visited = true;
                    }
                    left--;
                }

                while (right < promptTokenWords.length) {
                    if (right !== userTokenKeyWords[i].index) {
                        populateChildKeyword(this.keywords, promptTokenWords[right], userTokenKeyWords[i]);
                        const keyword = isKeyword(
                            userTokenKeyWords,
                            promptTokenWords[right],
                            userTokenKeyWords[i]
                        );
                        if (isConjunction(promptTokenWords[right].token, posMap) && (i + 1 < userTokenKeyWords.length && right < userTokenKeyWords[i + 1].index && !isChildToken(userTokenKeyWords[i+1], userTokenKeyWords[i]))) {
                            console.log('2', 'break');
                            break;
                        }
                        if (keyword) {
                            console.log('3', 'break');
                            break;
                        }
                        if (isNoun(promptTokenWords[right], posMap)) {
                            promptTokenWords[right].token = decode(promptTokenWords[right].token, encodeMap);
                            clusterGroup.push(promptTokenWords[right]);
                            promptTokenWords[right].visited = true;
                        }
                    }
                    right++;
                }
                this.clusters.push(clusterGroup);
            }
        }
        // reset visited flags
        this.clusters = this.clusters.map((clusterEntry) =>
            clusterEntry.map((entry) => {
                entry.visited = false;
                return entry;
            })
        );
        return this.clusters;
    }

    getUserTokens() {
        this.clusters.forEach((cluster) => {
            const [root, ...tokens] = cluster;
            console.log(this.schema.getTokens(root, tokens));
        });
    }
}

module.exports = ContextualPreProcessor;