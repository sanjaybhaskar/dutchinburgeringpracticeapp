// Types for the Dutch Inburgering Practice app

export type StoryTopic =
  | 'daily life'
  | 'travel'
  | 'market'
  | 'Dutch culture'
  | 'healthcare'
  | 'housing'
  | 'work and rights'
  | 'civic integration'
  | 'education'
  | 'finance and taxes';

export interface Sentence {
  id: string;
  text: string;
  translation: string;
}

export interface Paragraph {
  id: string;
  sentences: Sentence[];
}

export type QuestionType = 'multiple_choice';

export interface ComprehensionQuestion {
  id: string;
  type: QuestionType;
  question: string;
  /** Correct answer (always present) */
  answer: string;
  /** Options for multiple_choice questions (includes the correct answer) */
  options: string[];
}

export interface Story {
  id: string;
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
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
  level: 'A1' | 'A2' | 'B1' | 'B2';
  topic?: StoryTopic | string;
  existingTitles?: string[];
}

export interface OpenAIStoryResponse {
  stories: Story[];
}
