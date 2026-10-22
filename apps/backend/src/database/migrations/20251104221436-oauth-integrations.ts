import { Migration } from '@mikro-orm/migrations';

export class CreateOAuthIntegrations extends Migration {
  async up(): Promise<void> {
    // Create integrations table
    await this.ctx?.schema?.createTable('integrations', (table) => {
      table.uuid('id').primary();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      table.datetime('deleted_at').nullable();
      table.string('name', 255).notNullable().unique().index();
      table.text('description').nullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.uuid('created_by_id').notNullable();
      table.datetime('last_used_at').nullable();
      table
        .foreign('created_by_id')
        .references('id')
        .inTable('users')
        .onUpdate('CASCADE');
    });

    // Create oauth_clients table
    await this.ctx?.schema?.createTable('oauth_clients', (table) => {
      table.uuid('id').primary();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.datetime('expires_at').nullable();
      table.string('client_id', 255).notNullable().unique().index();
      table.string('client_secret', 255).notNullable();
      table.string('name', 255).notNullable();
      table.text('description').nullable();
      table
        .enum('owner_type', ['INTEGRATION'])
        .notNullable()
        .defaultTo('INTEGRATION');
      table.uuid('owner_integration_id').notNullable(); // Required, not nullable
      table.jsonb('allowed_scopes').notNullable();
      table.jsonb('allowed_grant_types').notNullable();
      table.integer('rate_limit').nullable();
      table.integer('usage_count').notNullable().defaultTo(0);
      table.datetime('last_used_at').nullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      table.datetime('deleted_at').nullable();
      table
        .foreign('owner_integration_id')
        .references('id')
        .inTable('integrations')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
    });
  }

  async down(): Promise<void> {
    await this.ctx?.schema?.dropTable('oauth_clients');
    await this.ctx?.schema?.dropTable('integrations');
  }
}
