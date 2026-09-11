const ENGINES = require('../data/engines');

// @route GET /api/parts/engines
const getEngines = (req, res) => {
  res.json(ENGINES);
};

module.exports = { getEngines };
