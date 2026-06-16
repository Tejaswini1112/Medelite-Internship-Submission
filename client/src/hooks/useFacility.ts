import { useQuery } from '@tanstack/react-query';
import { ApiError, fetchFacility } from '../api/client';
import type { FacilityReportData } from '../types';

export function useFacility(ccn: string) {
  return useQuery<FacilityReportData, ApiError>({
    queryKey: ['facility', ccn],
    queryFn: () => fetchFacility(ccn),
    enabled: ccn.length > 0,
    retry: (failureCount, error) => error.retryable && failureCount < 2,
    staleTime: 5 * 60 * 1000,
  });
}
