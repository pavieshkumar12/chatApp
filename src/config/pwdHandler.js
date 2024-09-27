const passomatic = require("passomatic")

const getRandomString = () => passomatic(6);

module.exports = { getRandomString }