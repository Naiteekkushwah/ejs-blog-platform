const multer = require('multer')

const Storage  = multer.memoryStorage();
const uplode = multer({storage:Storage})

module.exports = uplode