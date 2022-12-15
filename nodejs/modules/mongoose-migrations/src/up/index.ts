import { MigrationModel, MigrationDocument } from '../model';

export async function up(...migrations: MigrationDocument[]) {
  for (const migration of migrations) {
    console.log(`Creating migration: ${migration.name}.`);

    const exists = await MigrationModel.exists({
      name: migration.name,
      timestamp: migration.timestamp,
    });
    if (!exists) {
      await migration.save();
    }
  }
}
