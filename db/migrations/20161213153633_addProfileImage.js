
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('users', function(table){
			table.string('profileImage').defaultTo('defaultProfile.png');
		})
	])
  
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('users', function(table){
			table.dropColumn('profileImage');
		})
	])
  
};
