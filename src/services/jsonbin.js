const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID;
const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY;

const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

function generateId() {
  return Math.random().toString(16).substring(2, 10).toUpperCase();
}

export async function fetchDrugs() {
  const response = await fetch(BASE_URL, {
    headers: {
      'X-Master-Key': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch drugs');
  }

  const data = await response.json();
  return data.record.drugs || [];
}

export async function saveDrugs(drugs) {
  const response = await fetch(BASE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Master-Key': API_KEY,
    },
    body: JSON.stringify({
      drugs,
      lastUpdated: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save drugs');
  }

  return response.json();
}

export async function addDrug(drug) {
  const drugs = await fetchDrugs();
  const newDrug = {
    ...drug,
    id: generateId(),
    hasNotes: Boolean(drug.notes?.trim()),
  };
  drugs.push(newDrug);
  await saveDrugs(drugs);
  return newDrug;
}

export async function updateDrug(updatedDrug) {
  const drugs = await fetchDrugs();
  const index = drugs.findIndex((d) => d.id === updatedDrug.id);
  if (index !== -1) {
    drugs[index] = {
      ...updatedDrug,
      hasNotes: Boolean(updatedDrug.notes?.trim()),
    };
    await saveDrugs(drugs);
  }
  return drugs;
}

export async function deleteDrug(drugId) {
  const drugs = await fetchDrugs();
  const filtered = drugs.filter((d) => d.id !== drugId);
  await saveDrugs(filtered);
  return filtered;
}
