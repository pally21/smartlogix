// Messaging was removed to match the selected architecture in the ficha.
// This module is a noop placeholder to avoid runtime require errors.
async function publish() { return false; }
async function connect() { return null; }
module.exports = { connect, publish };
