
exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('comments', function(table){
			table.integer('replies_id')
				.references('id')
				.inTable('comments');
		})

	])
  
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table('comments', function(table){
			table.dropColumn('replies_id');
		})
	])
  
};
