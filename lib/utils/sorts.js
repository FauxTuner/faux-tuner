function sortByGuideNumber(a, b) {
  const ag = parseFloat(a.GuideNumber) || parseFloat(a.guideNum);
  const bg = parseFloat(b.GuideNumber) || parseFloat(b.guideNum);
  // console.log(ag, bg);
  return ag > bg ? 1 : -1;
}

module.exports = { sortByGuideNumber };
