const { Pool } = require("pg");
require("dotenv").config();

const { DB_URI } = process.env;

module.exports = new Pool({
  connectionString: DB_URI,
});
