// Competition lifecycle states driven by (competition.status + dates + user registration)
export type CompetitionState =
  | 'UPCOMING'
  | 'OPEN'
  | 'OPEN_FULL'
  | 'REGISTRATION_CLOSED'
  | 'REGISTERED'
  | 'REGISTERED_SUBMISSION_OPEN'
  | 'SUBMITTED'
  | 'CLOSED'
  | 'COMPLETED';

export interface Reward {
  position: number;
  label: string;
  amount: number;
}

export interface Judge {
  name: string;
  title: string;
  experience: string;
  photoUrl: string;
  introVideoUrl: string;
}

export interface CompetitionDates {
  registrationClose: string; // ISO string
  submissionStart: string;
  submissionEnd: string;
  resultDate: string;
}

export interface PreviousWinner {
  name: string;
  rank: string;
  photoUrl: string;
  videoUrl: string;
}

export interface Competition {
  _id: string;
  title: string;
  category: string;
  type: string;
  hasCertificate: boolean;
  prizePool: number;
  entryFee: number;
  totalSpots: number;
  bookedSpots: number;
  remainingSpots: number;
  isFull: boolean;
  status: 'upcoming' | 'active' | 'closed' | 'completed';
  judge: Judge;
  dates: CompetitionDates;
  description: string;
  about: string;
  judgingParameters: string;
  rulesEligibility: string;
  rewards: Reward[];
  disclaimer: string;
  referralBaseUrl: string;
  previousWinners: PreviousWinner[];
}

export interface CompetitionDetailResponse {
  competition: Competition;
  registrationStatus: string | null;
  registrationId: string | null;
  competitionState: CompetitionState;
}

export interface ReferralInfo {
  referralLink: string;
  referralCode: string;
  earningPerSignup: number;
  totalEarnings: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  referralCode: string;
  referralEarnings: number;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // ms remaining
}
