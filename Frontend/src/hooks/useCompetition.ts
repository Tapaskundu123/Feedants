import { useState, useEffect, useRef, useCallback } from 'react';
import { competitionApi } from '../api/client';
import { CompetitionDetailResponse } from '../types';

interface UseCompetitionResult {
  data: CompetitionDetailResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCompetition = (competitionId: string): UseCompetitionResult => {
  const [data, setData] = useState<CompetitionDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    try {
      setError(null);
      const response = await competitionApi.getById(competitionId);
      setData(response.data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load competition');
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    fetch();
    // Poll every 30s to keep spot count fresh
    intervalRef.current = setInterval(fetch, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
