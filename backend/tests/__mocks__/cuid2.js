// Mock for @paralleldrive/cuid2
module.exports = {
  createId: () => 'test-cuid-' + Math.random().toString(36).substr(2, 9),
  init: () => {},
  getConstants: () => ({}),
  isCuid: () => true,
};
