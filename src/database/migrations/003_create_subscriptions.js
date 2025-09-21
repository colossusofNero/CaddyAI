exports.up = function(knex) {
  return knex.schema.createTable('subscriptions', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('stripe_customer_id').nullable();
    table.string('stripe_subscription_id').nullable();
    table.enum('plan_type', ['free', 'basic', 'premium', 'professional']).defaultTo('free');
    table.enum('status', [
      'active', 'canceled', 'incomplete', 'incomplete_expired',
      'past_due', 'trialing', 'unpaid'
    ]).defaultTo('active');
    table.decimal('price', 8, 2).nullable(); // monthly price
    table.timestamp('current_period_start').nullable();
    table.timestamp('current_period_end').nullable();
    table.timestamp('trial_start').nullable();
    table.timestamp('trial_end').nullable();
    table.timestamp('canceled_at').nullable();
    table.integer('ai_requests_used').defaultTo(0);
    table.integer('ai_requests_limit').defaultTo(10); // per month
    table.json('features').nullable(); // JSON array of enabled features
    table.timestamps(true, true);

    table.index(['user_id']);
    table.index(['status']);
    table.index(['stripe_subscription_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('subscriptions');
};