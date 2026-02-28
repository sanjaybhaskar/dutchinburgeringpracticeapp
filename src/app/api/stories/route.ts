import { NextRequest, NextResponse } from 'next/server';
import { Story, Sentence } from '@/app/types/story';

// Helper to split text into sentences
function splitIntoSentences(text: string): string[] {
  // Match sentence endings: . ! ? followed by space or end of string
  const sentences = text.split(/(?<=[.!?])\s+/);
  return sentences.map(s => s.trim()).filter(s => s.length > 0);
}

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Default stories for when OpenAI is not available or fails
function getDefaultStories(): Story[] {
  return [
    {
      id: generateId(),
      title: "De Kat en de Hond",
      level: "A1",
      sentences: [
        { id: generateId(), text: "Er is een kat in het huis.", translation: "There is a cat in the house." },
        { id: generateId(), text: "De kat heet Max.", translation: "The cat is called Max." },
        { id: generateId(), text: "Max houdt van vis.", translation: "Max likes fish." },
        { id: generateId(), text: "Er is ook een hond.", translation: "There is also a dog." },
        { id: generateId(), text: "De hond heet Bella.", translation: "The dog is called Bella." },
        { id: generateId(), text: "Bella houdt van wandelen.", translation: "Bella likes walking." },
        { id: generateId(), text: "Max en Bella zijn vrienden.", translation: "Max and Bella are friends." },
        { id: generateId(), text: "Ze spelen samen in de tuin.", translation: "They play together in the garden." },
      ],
    },
    {
      id: generateId(),
      title: "Mijn Dag",
      level: "A1",
      sentences: [
        { id: generateId(), text: "Ik sta om zeven uur op.", translation: "I get up at seven o'clock." },
        { id: generateId(), text: "Ik ontbijt met brood en kaas.", translation: "I have breakfast with bread and cheese." },
        { id: generateId(), text: "Ik ga naar mijn werk.", translation: "I go to my work." },
        { id: generateId(), text: "Mijn werk is leuk.", translation: "My work is fun." },
        { id: generateId(), text: 's Avonds eet ik met mijn familie.', translation: "In the evening I eat with my family." },
        { id: generateId(), text: "Daarna lees ik een boek.", translation: "After that I read a book." },
        { id: generateId(), text: "Om tien uur ga ik slapen.", translation: "At ten o'clock I go to sleep." },
      ],
    },
    {
      id: generateId(),
      title: "De Markt",
      level: "A2",
      sentences: [
        { id: generateId(), text: "Elke zaterdag ga ik naar de markt.", translation: "Every Saturday I go to the market." },
        { id: generateId(), text: "De markt is in het centrum van de stad.", translation: "The market is in the center of the city." },
        { id: generateId(), text: "Er zijn veel kraampjes met groenten en fruit.", translation: "There are many stalls with vegetables and fruit." },
        { id: generateId(), text: "Ik koop altijd verse appelen.", translation: "I always buy fresh apples." },
        { id: generateId(), text: "De verkoper is heel vriendelijk.", translation: "The seller is very friendly." },
        { id: generateId(), text: "Hij geeft me altijd een gratis appel.", translation: "He always gives me a free apple." },
        { id: generateId(), text: "Daarna ga ik naar de bakker voor brood.", translation: "After that I go to the baker for bread." },
        { id: generateId(), text: "De geur van vers brood ruikt heerlijk!", translation: "The smell of fresh bread smells delicious!" },
      ],
    },
  ];
}

// Generate AI stories using OpenAI
async function generateAIStories(count: number, level: 'A1' | 'A2'): Promise<Story[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('No OpenAI API key found, using default stories');
    return getDefaultStories();
  }

  try {
    const prompt = `Generate ${count} Dutch language learning ${level} level stories. 

Each story should be:
- Simple and easy to understand for ${level} level Dutch learners
- Include 6-8 sentences
- Have a clear title
- Be engaging and interesting

For each story, provide:
1. A title in Dutch
2. The level (A1 or A2)
3. Each sentence with its English translation

Return ONLY valid JSON in this exact format:
{
  "stories": [
    {
      "title": "Story title in Dutch",
      "level": "${level}",
      "sentences": [
        { "text": "Dutch sentence", "translation": "English translation" }
      ]
    }
  ]
}

Make sure sentences are simple ${level} level Dutch with common vocabulary.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a Dutch language teacher creating simple learning stories. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from OpenAI');
    }

    // Parse the JSON response
    const parsed = JSON.parse(content);
    
    // Add IDs to stories and sentences
    return parsed.stories.map((story: any) => ({
      id: generateId(),
      title: story.title,
      level: story.level as 'A1' | 'A2',
      sentences: story.sentences.map((s: any) => ({
        id: generateId(),
        text: s.text,
        translation: s.translation,
      })),
    }));

  } catch (error) {
    console.error('Error generating AI stories:', error);
    return getDefaultStories();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 3, level = 'A1' } = body;

    const stories = await generateAIStories(count, level);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error in stories API:', error);
    return NextResponse.json(
      { error: 'Failed to generate stories', stories: getDefaultStories() },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return default stories on GET request
  return NextResponse.json({ stories: getDefaultStories() });
}
