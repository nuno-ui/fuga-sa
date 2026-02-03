export interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cal_start: string;
  cal_end: string;
}

export interface Member {
  id: string;
  group_id: string;
  name: string;
  display_order: number;
}

export interface Origin {
  id: string;
  name: string;
  lat: number;
  lon: number;
  display_order: number;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: string;
  description: string;
  image_url: string | null;
  attrs: Record<string, number>;
  cost_low: number;
  cost_med: number;
  cost_high: number;
  food_per_day: number;
  temp_may: number;
  rain_days: number;
  lat: number;
  lon: number;
}

export interface QuizQuestion {
  id: string;
  emoji: string;
  question: string;
  display_order: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  attrs: Record<string, number>;
  display_order: number;
}

export interface Factor {
  id: string;
  name: string;
  emoji: string;
  attr_key: string;
  display_order: number;
}

export interface MemberResponse {
  member_id: string;
  pin: string | null;
  data: Record<string, any>;
}

export interface AppData {
  group: Group;
  members: Member[];
  destinations: Destination[];
  quiz: QuizQuestion[];
  factors: Factor[];
  origins: Origin[];
}
