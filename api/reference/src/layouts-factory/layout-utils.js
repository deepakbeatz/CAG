function getScore(layout, characteristicsScores, characteristicsData) {
  return (
    (characteristicsScores[layout.type] * characteristicsData[layout.type]) /
    parseInt(layout.rank)
  );
}

module.exports = {
    getScore: getScore
}