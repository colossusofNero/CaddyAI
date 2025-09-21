exports.up = function(knex) {
  return knex.schema.createTable('clubs', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable(); // e.g., "Driver", "7 Iron", "Sand Wedge"
    table.enum('type', [
      'driver', 'fairway_wood', 'hybrid', 'iron', 'wedge', 'putter'
    ]).notNullable();
    table.string('brand').nullable();
    table.string('model').nullable();
    table.integer('loft').nullable(); // degrees
    table.string('shaft_flex').nullable(); // regular, stiff, extra_stiff, etc.
    table.integer('average_distance').nullable(); // yards
    table.json('distance_ranges').nullable(); // JSON: { min: 120, max: 140, carry: 130 }
    table.text('notes').nullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('order_index').defaultTo(0); // for sorting in bag
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['type']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('clubs');
};