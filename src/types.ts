export interface RoadmapData {
  user_profile_analysis: {
    detected_strengths: string[];
    best_career_path: string;
    why_this_path_suits_them: string;
  };
  market_analysis?: {
    average_salary_range: string;
    demand_level: string;
    key_companies: string[];
  };
  micro_steps_roadmap: {
    phase_name: string;
    goal: string;
    daily_breakdown: {
      title: string;
      description: string;
      estimated_duration_hours?: number;
      resource_links?: { title: string; url: string }[];
      deadline_approaching?: boolean;
    }[];
  }[];
  real_world_projects: {
    project_name: string;
    what_you_will_build: string;
    skills_gained: string[];
  }[];
  resource_aggregator: {
    resource_type: string;
    topic: string;
    direct_url: string;
  }[];
  coach_motivation_message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
}
