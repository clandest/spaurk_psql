
exports.up = function(knex, Promise) {

	return Promise.all([

		knex.schema.alterTable('users', function(table){
			table.unique('username');
		}),


		knex.schema.createTable('watchlist', function(table){
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.integer('post_id')
				.references('id')
				.inTable('posts');
		}),

		knex.schema.createTable('follows', function(table){
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.integer('follow_id')
				.references('uid')
				.inTable('users');
		}),
	])

};

exports.down = function(knex, Promise) {

	return Promise.all([
		knex.schema.dropTable('watchlist'),
		knex.schema.dropTable('follows')
	])	
  
};
