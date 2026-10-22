import { Migration } from '@mikro-orm/migrations';

export class AddUserActivity extends Migration {
  override async up(): Promise<void> {
    this.addSql(`alter table "users" add column "activity" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" drop column "activity";`);
  }
}
