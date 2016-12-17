
exports.up = function(knex, Promise) {

	return Promise.all([
		knex.schema.createTable('users', function(table){
			table.increments('uid').primary();
			table.string.unique('username');
			table.string('password');
			table.string('email');
			table.timestamps();
		}),

		knex.schema.createTable('profiles', function(table){
			table.increments('id').primary();
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.string('about');
			table.string('flashBanner');
			table.timestamps();
		}),

		knex.schema.createTable('posts', function(table){
			table.increments('id').primary();
			table.integer('user_id')
				.references('uid')
				.inTable('users');
			table.string('title');
			table.string('artist');
			table.string('start');
			table.string('stop');
			table.string('genre');
			table.string('tags');
			table.string('category')
				.defaultTo('Discovery');
			table.string('audioFile');
			table.string('imageFile');
			table.timestamps();
		}),

		knex.schema.createTable('comments', function(table){
			table.increments('id').primary();
			table.string('body');
			table.integer('user_id')
				.references('uid')
				.inTable('users')
			table.integer('profile_id')
				.references('id')
				.inTable('profiles');
			table.timestamps();
		}),
		
	])
  
};

exports.down = function(knex, Promise) {
	
	return Promise.all([
		knex.schema.dropTable('users'),
		knex.schema.dropTable('profiles'),
		knex.schema.dropTable('posts'),
		knex.schema.dropTable('comments')
	])	
};
