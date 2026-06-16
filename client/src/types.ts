export type StarRating = number | null;

export interface StarRatings {
  overall: StarRating;
  healthInspection: StarRating;
  staffing: StarRating;
  qualityMeasures: StarRating;
}

export interface MetricLine {
  key: string;
  label: string;
  group: 'short-stay' | 'long-stay';
  kind: 'hospitalization' | 'ed';
  unit: 'percent' | 'rate';
  facility: number | null;
  nationalAverage: number | null;
  stateAverage: number | null;
  measureCode: string;
  footnote?: string | null;
}

export interface StaffingHours {
  totalNurse: number | null;
  registeredNurse: number | null;
  lpn: number | null;
  nurseAide: number | null;
}

export interface FacilityReportData {
  ccn: string;
  providerName: string;
  legalBusinessName: string | null;
  address: {
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    full: string | null;
  };
  certifiedBeds: number | null;
  averageResidentsPerDay: number | null;
  ownershipType: string | null;
  telephone: string | null;
  starRatings: StarRatings;
  staffingHours: StaffingHours;
  metrics: MetricLine[];
  careCompareUrl: string;
  generatedAt: string;
  cmsProcessingDate: string | null;
  measurePeriod: string | null;
  partial: boolean;
  warnings: string[];
}

export interface ManualInputs {
  facilityNameOverride: string;
  emr: string;
  currentCensus: string;
  patientType: string;
  previousCoverage: string;
  previousProviderPerformance: string;
  medicalCoverage: string;
}

export interface ReportPayload {
  facility: FacilityReportData;
  manual: Partial<ManualInputs>;
  chartImage?: string;
}
