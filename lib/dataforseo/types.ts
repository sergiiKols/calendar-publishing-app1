/**
 * DataForSEO API Response Types
 * Типы данных для ответов от DataForSEO API
 */

// ===================================
// Keywords Data Response Types
// ===================================

export interface KeywordDataItem {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  competition: number; // 0.00 to 1.00
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
  cpc: number; // USD
  search_volume: number;
  low_top_of_page_bid: number;
  high_top_of_page_bid: number;
  keyword_info?: {
    se_type: string;
    last_updated_time: string;
  };
  impressions_info?: {
    se_type: string;
    last_updated_time: string;
    bid: number;
    match_type: string;
    ad_position_min: number;
    ad_position_max: number;
    ad_position_average: number;
    cpc_min: number;
    cpc_max: number;
    cpc_average: number;
    daily_impressions_min: number;
    daily_impressions_max: number;
    daily_impressions_average: number;
    daily_clicks_min: number;
    daily_clicks_max: number;
    daily_clicks_average: number;
  };
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface KeywordsDataResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      keywords: string[];
      location_code: number;
      language_code: string;
    };
    result: KeywordDataItem[];
  }>;
}

// ===================================
// SERP Analysis Response Types
// ===================================

export interface SerpItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  breadcrumb?: string;
  is_image?: boolean;
  is_video?: boolean;
  is_featured_snippet?: boolean;
  is_malicious?: boolean;
  description?: string;
  pre_snippet?: string;
  extended_snippet?: string;
  amp_version?: boolean;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  highlighted?: string[];
  links?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
  faq?: {
    items: Array<{
      type: string;
      title: string;
      description: string;
    }>;
  };
}

export interface SerpAnalysisResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      keyword: string;
      location_code: number;
      language_code: string;
      device: string;
      os: string;
    };
    result: Array<{
      keyword: string;
      type: string;
      se_domain: string;
      location_code: number;
      language_code: string;
      check_url: string;
      datetime: string;
      spell?: {
        keyword: string;
        type: string;
      };
      item_types: string[];
      se_results_count: number;
      items_count: number;
      items: SerpItem[];
    }>;
  }>;
}

// ===================================
// Keyword Suggestions Response Types
// ===================================

export interface KeywordSuggestion {
  keyword: string;
  location_code: number;
  language_code: string;
  search_partners: boolean;
  competition: number;
  competition_level: 'LOW' | 'MEDIUM' | 'HIGH';
  cpc: number;
  search_volume: number;
  categories?: number[];
  monthly_searches?: Array<{
    year: number;
    month: number;
    search_volume: number;
  }>;
}

export interface KeywordSuggestionsResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      keywords: string[];
      location_code: number;
      language_code: string;
    };
    result: KeywordSuggestion[];
  }>;
}

// ===================================
// Database Types (для наших таблиц)
// ===================================

export interface SeoKeyword {
  id: number;
  project_id: number | null;
  user_id: number;
  keyword: string;
  language: string;
  location_code: string;
  location_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  created_at: Date;
  updated_at: Date;
}

export interface SeoTask {
  id: number;
  keyword_id: number;
  endpoint_type: 'keywords_data' | 'serp_analysis' | 'keyword_suggestions';
  task_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export interface SeoResult {
  id: number;
  keyword_id: number;
  task_id: number;
  endpoint_type: 'keywords_data' | 'serp_analysis' | 'keyword_suggestions';
  result_data: any; // JSONB
  search_volume: number | null;
  cpc: number | null;
  competition: number | null;
  difficulty: number | null;
  created_at: Date;
}

export interface SeoSerpPosition {
  id: number;
  result_id: number;
  keyword_id: number;
  position: number;
  url: string | null;
  title: string | null;
  description: string | null;
  domain: string | null;
  created_at: Date;
}

// ===================================
// API Request/Response Types
// ===================================

export interface SubmitKeywordsRequest {
  keywords: string[];
  language: string;
  location_code: string;
  location_name: string;
  project_id?: number;
}

export interface SubmitKeywordsResponse {
  success: boolean;
  keyword_ids: number[];
  task_ids: number[];
  message: string;
}

export interface GetKeywordsResponse {
  success: boolean;
  keywords: Array<SeoKeyword & {
    project_name?: string;
    tasks_count?: number;
    completed_tasks?: number;
  }>;
  total: number;
}

export interface GetKeywordResultsResponse {
  success: boolean;
  keyword: SeoKeyword;
  results: {
    keywords_data?: {
      search_volume: number;
      cpc: number;
      competition: number;
      competition_level: string;
      monthly_searches?: Array<{ year: number; month: number; search_volume: number }>;
    };
    serp_analysis?: {
      total_results: number;
      top_positions: Array<{
        position: number;
        title: string;
        url: string;
        domain: string;
        description: string;
      }>;
    };
    keyword_suggestions?: {
      suggestions: Array<{
        keyword: string;
        search_volume: number;
        cpc: number;
        competition: number;
      }>;
    };
  };
}

// ===================================
// Error Types
// ===================================

export interface DataForSeoError {
  status_code: number;
  status_message: string;
  time?: string;
}

export class DataForSeoApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: any
  ) {
    super(message);
    this.name = 'DataForSeoApiError';
  }
}
