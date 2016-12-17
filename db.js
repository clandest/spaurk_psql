
var config			= require(__dirname + '/knexfile.js');
var env					= process.env.NODE_ENV || 'development';
var knex				= require('knex')(config[env]);

module.exports = knex;

knex.migrate.latest([config]);
