// Logging utility for debugging
const log = (message) => {
  console.log(`[LOG] ${new Date().toISOString()}: ${message}`);
};

module.exports = { log };
