exports.up = function(knex) {
  return knex.schema.createTable('calculations', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.json('input_data').notNullable(); // All shot variables as JSON
    table.json('recommendation').notNullable(); // AI recommendation as JSON
    table.string('recommended_club').notNullable();
    table.string('aim_point').nullable();
    table.string('stance_adjustment').nullable();
    table.decimal('confidence_score', 3, 2).nullable(); // 0.00 to 1.00
    table.text('additional_notes').nullable();
    table.json('weather_conditions').nullable(); // Weather at time of calculation
    table.string('course_name').nullable();
    table.string('hole_number').nullable();
    table.boolean('was_used').defaultTo(false); // Did user follow recommendation?
    table.json('feedback').nullable(); // User feedback on recommendation
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['created_at']);
    table.index(['recommended_club']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('calculations');
};