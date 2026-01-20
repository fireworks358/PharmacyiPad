import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { parseCSV } from '../utils/csvParser';

export function useDrugData() {
  const [drugs, setDrugs] = useLocalStorage('pharmacy_drugs', null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // If localStorage has data, use it
      if (drugs && drugs.length > 0) {
        setIsLoading(false);
        return;
      }

      // Otherwise, load CSV
      try {
        const response = await fetch('/Items - Items.csv');
        const csvText = await response.text();
        const parsedDrugs = parseCSV(csvText);
        setDrugs(parsedDrugs);
      } catch (error) {
        console.error('Error loading CSV:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []); // Only run once on mount

  return { drugs: drugs || [], setDrugs, isLoading };
}
