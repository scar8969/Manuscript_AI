export interface User {
  id: string;
  email: string;
  name: string;
}

export interface JobContext {
  url: string;
  description: string;
  title: string;
  company: string;
  location?: string;
  salary?: string;
  jobType?: string;
}

export interface JobAnalysis {
  keywords: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive';
  keyResponsibilities: string[];
  qualifications: string[];
  industry: string;
  suggestedResumeSections: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  updatedLatex?: string;
  applied?: boolean;
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  latex: string;
  createdAt: string;
  updatedAt: string;
  jobContext?: JobContext;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  latex?: string;
  category: string;
  thumbnail: string | null;
  isFeatured: boolean;
  isDefault: boolean;
  tags: string[];
  sortOrder: number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}