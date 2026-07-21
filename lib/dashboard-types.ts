export type DashboardStats = {
  totalJobs: number;
  averageMatchRate: number;
  companiesResearched: number;
  jobsThisWeek: number;
};

export type DashboardActivity = {
  id: string;
  type: "search" | "research";
  title: string;
  detail: string;
  occurredAt: string;
  timeAgo: string;
};

export type DailyAnalyticsPoint = {
  date: string;
  label: string;
  jobsFound: number;
  companyResearch: number;
};

export type MatchScoreBucket = {
  label: string;
  count: number;
};

export type DashboardAnalytics = {
  jobsOverTime: DailyAnalyticsPoint[];
  companyResearchActivity: DailyAnalyticsPoint[];
  matchScoreDistribution: MatchScoreBucket[];
};

export type DashboardPageData = {
  stats: DashboardStats;
  activities: DashboardActivity[];
  analytics: DashboardAnalytics;
  profileComplete: boolean;
  databaseError?: string;
  analyticsError?: string;
};
