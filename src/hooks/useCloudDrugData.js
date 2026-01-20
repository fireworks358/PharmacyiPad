import { useState, useEffect, useCallback } from 'react';
import {
  fetchDrugs,
  addDrug as apiAddDrug,
  updateDrug as apiUpdateDrug,
  deleteDrug as apiDeleteDrug,
} from '../services/jsonbin';

const CACHE_KEY = 'pharmacy_drugs_cache';

export function useCloudDrugData() {
  const [drugs, setDrugs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadDrugs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchDrugs();
      setDrugs(data);
      // Cache to localStorage for offline fallback
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to load drugs:', err);
      // Try localStorage fallback
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        setDrugs(JSON.parse(cached));
        setError('Offline mode - showing cached data');
      } else {
        setError('Failed to load drugs. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrugs();
  }, [loadDrugs]);

  const handleAddDrug = useCallback(async (newDrug) => {
    setIsSaving(true);
    setError(null);
    try {
      const added = await apiAddDrug(newDrug);
      setDrugs((prev) => {
        const updated = [...prev, added];
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
      return added;
    } catch (err) {
      console.error('Failed to add drug:', err);
      setError('Failed to add drug. Please try again.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleUpdateDrug = useCallback(async (updatedDrug) => {
    setIsSaving(true);
    setError(null);
    try {
      await apiUpdateDrug(updatedDrug);
      setDrugs((prev) => {
        const updated = prev.map((d) =>
          d.id === updatedDrug.id ? { ...updatedDrug, hasNotes: Boolean(updatedDrug.notes?.trim()) } : d
        );
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Failed to update drug:', err);
      setError('Failed to update drug. Please try again.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleDeleteDrug = useCallback(async (drugId) => {
    setIsSaving(true);
    setError(null);
    try {
      await apiDeleteDrug(drugId);
      setDrugs((prev) => {
        const updated = prev.filter((d) => d.id !== drugId);
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error('Failed to delete drug:', err);
      setError('Failed to delete drug. Please try again.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    drugs,
    isLoading,
    isSaving,
    error,
    addDrug: handleAddDrug,
    updateDrug: handleUpdateDrug,
    deleteDrug: handleDeleteDrug,
    refresh: loadDrugs,
    clearError,
  };
}
