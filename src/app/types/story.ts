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

export type QuestionType = 'open' | 'multiple_choice' | 'fill_blank' | 'true_false';

export interface ComprehensionQuestion {
  id: string;
  type: QuestionType;
  question: string;
  /** Correct answer (always present) */
  answer: string;
  /** Options for multiple_choice questions (includes the correct answer) */
  options?: string[];
  /** For true_false: true | false */
  correctBool?: boolean;
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
