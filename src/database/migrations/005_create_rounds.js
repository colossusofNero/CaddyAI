exports.up = function(knex) {
  return knex.schema.createTable('rounds', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('course_name').notNullable();
    table.date('played_date').notNullable();
    table.integer('total_score').nullable();
    table.integer('total_strokes').nullable();
    table.json('hole_scores').nullable(); // Array of hole-by-hole scores
    table.json('statistics').nullable(); // Fairways hit, GIR, putts, etc.
    table.json('weather_conditions').nullable();
    table.text('notes').nullable();
    table.boolean('is_complete').defaultTo(false);
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['played_date']);
    table.index(['course_name']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('rounds');
};