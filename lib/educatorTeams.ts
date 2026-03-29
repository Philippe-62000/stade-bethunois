import mongoose from 'mongoose';
import Team from '@/models/Team';

/**
 * Affecte l’éducateur aux équipes choisies et le retire des autres équipes
 * où il était référencé. Les équipes sélectionnées perdent leur éducateur
 * précédent au profit de celui-ci.
 */
export async function syncEducatorTeams(educatorUserId: string, teamIds: string[]) {
  const uid = new mongoose.Types.ObjectId(educatorUserId);
  const valid = [...new Set(teamIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
  const oids = valid.map((id) => new mongoose.Types.ObjectId(id));

  await Team.updateMany(
    { educatorId: uid, _id: { $nin: oids } },
    { $set: { educatorId: null } }
  );

  if (oids.length > 0) {
    await Team.updateMany({ _id: { $in: oids } }, { $set: { educatorId: uid } });
  }
}

export async function clearEducatorFromAllTeams(educatorUserId: string) {
  const uid = new mongoose.Types.ObjectId(educatorUserId);
  await Team.updateMany({ educatorId: uid }, { $set: { educatorId: null } });
}
