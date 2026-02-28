// Types for the AI Story Reader app

export interface Sentence {
  id: string;
  text: string;
  translation: string;
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface Story {
  id: string;
  title: string;
  level: 'A1' | 'A2';
  topic: string;
  paragraphs: Paragraph[];
}

export interface StoriesResponse {
  stories: Story[];
  error?: string;
}

export interface OpenAIStoryRequest {
  count: number;
  level: 'A1' | 'A2';
  existingTitles?: string[];
}

export interface OpenAIStoryResponse {
  stories: Story[];
}
