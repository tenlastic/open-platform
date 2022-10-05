import { Migration, MigrationDocument } from '../model';

export async function up(...migrations: MigrationDocument[]) {
  for (const migration of migrations) {
    console.log(`Creating migration: ${migration.name}.`);

    const exists = await Migration.exists({ name: migration.name, timestamp: migration.timestamp });
    if (!exists) {
      await migration.save();
    }
  }
}
