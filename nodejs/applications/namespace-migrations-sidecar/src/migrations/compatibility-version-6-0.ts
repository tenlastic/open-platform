import { Migration, MigrationDocument } from '@tenlastic/mongoose-migrations';

export const migration = new Migration({
  name: 'compatibility-version-6-0',
  timestamp: new Date(1663884158881),

  down(m: MigrationDocument) {
    return m.db.db.admin().command({ setFeatureCompatibilityVersion: '5.0' });
  },
  up(m: MigrationDocument) {
    return m.db.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
  },
});
