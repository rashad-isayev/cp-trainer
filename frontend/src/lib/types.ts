export type Problem = {
  id?: number;
  platform: string;
  external_id: string;
  name: string;
  topic: string;
  difficulty: string;
  link: string;
  status?: "waitlisted" | "completed";
};

export type User = {
  id: number;
  username: string;
};

export type AuthMode = "login" | "register";
export type ConfidenceLevel = "low" | "medium" | "high";
export type ProgressStatus = "waitlisted" | "completed";

export type AuthResponse = {
  message: string;
  token: string;
  user: User;
};

export type DashboardResponse = {
  user: User;
  waitlisted: Problem[];
  completed: Problem[];
};

export type RecommendationResponse = DashboardResponse & {
  recommendations: Problem[];
};

export type RecommendationRequest = {
  topics: string[];
  platforms: string[];
  confidence: ConfidenceLevel;
};

export type ProgressResponse = {
  message: string;
  waitlisted: Problem[];
  completed: Problem[];
};
