export type TagType = 'email' | 'telegram' | 'social' | 'article' | 'video' | 'reels';
export type ConferenceType = 'AD' | 'SQA' | 'TWD';
export type ConferenceFilterType = 'all' | 'AD' | 'SQA' | 'TWD';

export interface ConferenceEvent {
  id: string;
  year: number;
  conference: ConferenceType;
  title: string;
  location: string;
  dates: string;
  monthIndex: number;
  days: number[];
}

export interface TagConfig {
  id: TagType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconName: string;
}

export interface ConferenceConfig {
  id: ConferenceType;
  label: string;
  shortLabel: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
}

export type PostStatus = 'idea' | 'in_progress' | 'scheduled' | 'published';

export interface PostItem {
  id: string;
  title: string;
  tags: TagType[];
  tag?: TagType;
  conference: ConferenceType;
  day: number;
  time?: string;
  description?: string;
  status: PostStatus;
  contentText?: string;
  hashtags?: string[];
  bestPostingTime?: string;
  callToAction?: string;
}

export interface MonthData {
  index: number;
  year: number;
  name: string;
  shortName: string;
  season: 'winter' | 'spring' | 'summer' | 'autumn';
  focusTopic: string;
  goal: string;
  items: PostItem[];
}

export interface StrategyMeta {
  title: string;
  niche: string;
  targetAudience: string;
  annualGoal: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  dateStr: string;
  read: boolean;
  type: 'deadline' | 'info' | 'system';
}