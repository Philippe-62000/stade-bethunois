import User from '@/models/User';
import { ALL_APP_ROLES, type AppRole } from './userRoles';

let legacyUserRolesMigrated = false;

/** Migre les anciens documents `role` (string) vers `roles` ([]). À appeler une fois après connexion Mongo. */
export async function migrateLegacyUserRolesOnce(): Promise<void> {
  if (legacyUserRolesMigrated) return;
  legacyUserRolesMigrated = true;
  try {
    const coll = User.collection;
    const docs = await coll
      .find({
        $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }],
      })
      .toArray();
    for (const doc of docs) {
      const legacy = (doc as { role?: string }).role;
      const roles: AppRole[] =
        legacy && ALL_APP_ROLES.includes(legacy as AppRole) ? [legacy as AppRole] : ['parent'];
      await coll.updateOne({ _id: doc._id }, { $set: { roles }, $unset: { role: '' } });
    }
  } catch (e) {
    console.error('migrateLegacyUserRolesOnce:', e);
  }
}
