const DEFAULT_LABELS: Record<string, string> = {
  training: 'Entraînement',
  match: 'Match',
  tournament: 'Tournoi',
};

export function getEventTypeLabel(
  type: string,
  eventTypes?: { key: string; label: string }[]
): string {
  if (eventTypes?.length) {
    const found = eventTypes.find((et) => et.key === type);
    if (found) return found.label;
  }
  return DEFAULT_LABELS[type] ?? type;
}
