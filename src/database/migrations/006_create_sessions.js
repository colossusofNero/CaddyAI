exports.up = function(knex) {
  return knex.schema.createTable('sessions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token').unique().notNullable();
    table.string('refresh_token').unique().nullable();
    table.string('device_info').nullable();
    table.string('ip_address').nullable();
    table.string('user_agent').nullable();
    table.timestamp('expires_at').notNullable();
    table.timestamp('last_used').defaultTo(knex.fn.now());
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['session_token']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sessions');
};