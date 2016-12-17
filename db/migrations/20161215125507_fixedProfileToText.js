
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('profiles', function(table){
			table.text('about');
		})
	])
  
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('profiles', function(table){
			table.dropColumn('about');
		})
	])
  
};
