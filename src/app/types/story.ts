// Types for the AI Story Reader app

export type StoryTopic = 'daily life' | 'travel' | 'market' | 'Dutch culture';

export interface Sentence {
  id: string;
  text: string;
  translation: string;
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface Story {
  id: string;
  title: string;
  level: 'A1' | 'A2';
  topic: StoryTopic | string;
  paragraphs: Paragraph[];
  questions?: ComprehensionQuestion[];
}

export interface StoriesResponse {
  stories: Story[];
  error?: string;
}

export interface OpenAIStoryRequest {
  count: number;
  level: 'A1' | 'A2';
  topic?: StoryTopic | string;
  existingTitles?: string[];
}

export interface OpenAIStoryResponse {
  stories: Story[];
}
