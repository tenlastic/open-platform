import { Migration, MigrationDocument } from '../model';

export async function up(...migrations: MigrationDocument[]) {
  for (const migration of migrations) {
    const exists = await Migration.exists({ name: migration.name, timestamp: migration.timestamp });

    if (!exists) {
      await migration.save();
    }
  }
}
