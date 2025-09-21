exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.string('first_name').notNullable();
    table.string('last_name').notNullable();
    table.string('phone').nullable();
    table.date('date_of_birth').nullable();
    table.enum('gender', ['male', 'female', 'other', 'prefer_not_to_say']).nullable();
    table.string('handicap').nullable();
    table.enum('skill_level', ['beginner', 'intermediate', 'advanced', 'professional']).defaultTo('beginner');
    table.string('dominant_hand').defaultTo('right');
    table.json('preferences').nullable(); // JSON object for user preferences
    table.string('profile_image_url').nullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login').nullable();
    table.timestamps(true, true);

    table.index(['email']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};