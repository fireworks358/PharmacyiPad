export function normalizeSearchValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function buildDrugSearchText(drug, locationsById = {}) {
  const locations = (drug.locationIds || [])
    .map((id) => locationsById[id] && locationsById[id].label)
    .filter(Boolean);

  return normalizeSearchValue([
    drug.displayName,
    ...(drug.aliases || []),
    drug.strength,
    drug.form,
    drug.route,
    drug.locationNote,
    ...locations,
  ].join(' '));
}

export function matchesDrugSearch(drug, query, locationsById = {}) {
  const normalizedQuery = normalizeSearchValue(query);
  if (!normalizedQuery) return true;

  const searchText = buildDrugSearchText(drug, locationsById);
  return normalizedQuery.split(' ').every((token) => searchText.indexOf(token) !== -1);
}

export function sortDrugsByName(drugs) {
  return [...drugs].sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );
}

export function formatDrugLocation(drug, locationsById = {}) {
  const labels = (drug.locationIds || [])
    .map((id) => locationsById[id] && locationsById[id].label)
    .filter(Boolean);

  if (drug.locationNote) labels.push(drug.locationNote);
  return labels.length ? labels.join(' · ') : 'Location not recorded';
}

