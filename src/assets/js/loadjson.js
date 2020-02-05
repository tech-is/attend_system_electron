const fs = require('fs');
const APICONF = JSON.parse(fs.readFileSync(__dirname + '/config/config.json', 'utf8'));