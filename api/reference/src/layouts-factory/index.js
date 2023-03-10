var layout = require("../../mongo-models/layout");
var layoutUtils = require("./layout-utils");

var layouts = [];

const characteristicsScores = {
    standard: 1,
    simple: 1.3,
    complex: 1.6,
    component_based: 1.8,
    userPrefered: 2
}

async function fetchLayouts () {
    try {
        const fetchedLayouts = await layout.find({});
        return fetchedLayouts;
    } catch(err) {
        console.log(err);
    }
}

async function getLayouts(characteristicsData, suggestionsCount = 5) {
    if(!layouts.length) {
        layouts = await fetchLayouts();
    }
    const sortedLayouts = layouts.sort((layout1, layout2) => {
        return (
          layoutUtils.getScore(
            layout2,
            characteristicsScores,
            characteristicsData
          ) -
          layoutUtils.getScore(
            layout1,
            characteristicsScores,
            characteristicsData
          )
        );
    });

    const sliceIndex =
      sortedLayouts.length < suggestionsCount
        ? sortedLayouts.length
        : suggestionsCount;

    const layoutsData = sortedLayouts
      .map((sortedLayout) => {
        return { id: sortedLayout.id, content: sortedLayout.content };
      })
      .slice(0, sliceIndex);

    return layoutsData;
}

module.exports = {
    getLayouts:getLayouts
}