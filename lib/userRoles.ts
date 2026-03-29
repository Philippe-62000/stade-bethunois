export type AppRole = 'parent' | 'educator' | 'admin';

export const ALL_APP_ROLES: AppRole[] = ['parent', 'educator', 'admin'];

export const ROLE_LABELS: Record<AppRole, string> = {
  parent: 'Parent',
  educator: 'Éducateur',
  admin: 'Administrateur',
};

/** Normalise un tableau de rôles (entrée API / formulaire). */
export function normalizeRolesInput(input: unknown): AppRole[] | null {
  if (!Array.isArray(input)) return null;
  const set = new Set<AppRole>();
  for (const r of input) {
    if (typeof r === 'string' && ALL_APP_ROLES.includes(r as AppRole)) {
      set.add(r as AppRole);
    }
  }
  return set.size > 0 ? [...set] : null;
}

/** Lit les rôles depuis un document User (schéma `roles` ou ancien champ `role`). */
export function getRolesFromUserDoc(doc: {
  roles?: string[];
  role?: string;
} | null | undefined): AppRole[] {
  if (!doc) return ['parent'];
  if (doc.roles && Array.isArray(doc.roles) && doc.roles.length > 0) {
    const u = [...new Set(doc.roles.filter((r) => ALL_APP_ROLES.includes(r as AppRole)))] as AppRole[];
    return u.length > 0 ? u : ['parent'];
  }
  if (doc.role && ALL_APP_ROLES.includes(doc.role as AppRole)) {
    return [doc.role as AppRole];
  }
  return ['parent'];
}
