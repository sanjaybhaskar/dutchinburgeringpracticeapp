// Types for the AI Story Reader app

export interface Sentence {
  id: string;
  text: string;
  translation: string;
}

export interface Story {
  id: string;
  title: string;
  level: 'A1' | 'A2';
  sentences: Sentence[];
}

export interface StoriesResponse {
  stories: Story[];
  error?: string;
}

export interface OpenAIStoryRequest {
  count: number;
  level: 'A1' | 'A2';
}

export interface OpenAIStoryResponse {
  stories: Story[];
}
