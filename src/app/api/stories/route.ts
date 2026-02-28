import { NextRequest, NextResponse } from 'next/server';
import { Story, Paragraph, Sentence } from '@/app/types/story';

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
      topic: "Animals and friendship",
      paragraphs: [
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Er is een kat in het huis.", translation: "There is a cat in the house." },
            { id: generateId(), text: "De kat heet Max.", translation: "The cat is called Max." },
            { id: generateId(), text: "Max is een grote, oranje kat.", translation: "Max is a big, orange cat." },
            { id: generateId(), text: "Hij heeft groene ogen.", translation: "He has green eyes." },
            { id: generateId(), text: "Max houdt van vis.", translation: "Max likes fish." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Er is ook een hond in het huis.", translation: "There is also a dog in the house." },
            { id: generateId(), text: "De hond heet Bella.", translation: "The dog is called Bella." },
            { id: generateId(), text: "Bella is een kleine, witte hond.", translation: "Bella is a small, white dog." },
            { id: generateId(), text: "Ze heeft blauwe ogen.", translation: "She has blue eyes." },
            { id: generateId(), text: "Bella houdt van wandelen.", translation: "Bella likes walking." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Max en Bella zijn goede vrienden.", translation: "Max and Bella are good friends." },
            { id: generateId(), text: "Ze spelen samen in de tuin.", translation: "They play together in the garden." },
            { id: generateId(), text: "Soms rennen ze achter elkaar aan.", translation: "Sometimes they chase each other." },
            { id: generateId(), text: "Ze slapen ook samen op de bank.", translation: "They also sleep together on the couch." },
            { id: generateId(), text: "De eigenaar is blij met zijn dieren.", translation: "The owner is happy with his animals." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Elke ochtend eten ze samen.", translation: "Every morning they eat together." },
            { id: generateId(), text: "Max eet zijn vis en Bella eet haar brokken.", translation: "Max eats his fish and Bella eats her kibble." },
            { id: generateId(), text: "Na het eten gaan ze naar buiten.", translation: "After eating they go outside." },
            { id: generateId(), text: "Ze kijken naar de vogels in de boom.", translation: "They watch the birds in the tree." },
            { id: generateId(), text: "Het is een gelukkig leven voor Max en Bella.", translation: "It is a happy life for Max and Bella." },
          ],
        },
      ],
    },
    {
      id: generateId(),
      title: "Mijn Dag",
      level: "A1",
      topic: "Daily routine",
      paragraphs: [
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Ik sta om zeven uur op.", translation: "I get up at seven o'clock." },
            { id: generateId(), text: "Ik ga naar de badkamer.", translation: "I go to the bathroom." },
            { id: generateId(), text: "Ik poets mijn tanden.", translation: "I brush my teeth." },
            { id: generateId(), text: "Ik douche en kleed me aan.", translation: "I shower and get dressed." },
            { id: generateId(), text: "Daarna ga ik naar de keuken.", translation: "Then I go to the kitchen." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Ik ontbijt met brood en kaas.", translation: "I have breakfast with bread and cheese." },
            { id: generateId(), text: "Ik drink een kop koffie.", translation: "I drink a cup of coffee." },
            { id: generateId(), text: "Het ontbijt is lekker.", translation: "The breakfast is tasty." },
            { id: generateId(), text: "Ik lees de krant tijdens het ontbijt.", translation: "I read the newspaper during breakfast." },
            { id: generateId(), text: "Om half acht ga ik naar mijn werk.", translation: "At half past seven I go to my work." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Mijn werk is leuk.", translation: "My work is fun." },
            { id: generateId(), text: "Ik werk met veel mensen.", translation: "I work with many people." },
            { id: generateId(), text: "We drinken koffie samen.", translation: "We drink coffee together." },
            { id: generateId(), text: "Om twaalf uur eet ik mijn lunch.", translation: "At twelve o'clock I eat my lunch." },
            { id: generateId(), text: "Ik eet een broodje met ham.", translation: "I eat a sandwich with ham." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "'s Avonds eet ik met mijn familie.", translation: "In the evening I eat with my family." },
            { id: generateId(), text: "We eten soep en brood.", translation: "We eat soup and bread." },
            { id: generateId(), text: "Daarna lees ik een boek.", translation: "After that I read a book." },
            { id: generateId(), text: "Mijn kinderen kijken televisie.", translation: "My children watch television." },
            { id: generateId(), text: "Om tien uur ga ik slapen.", translation: "At ten o'clock I go to sleep." },
          ],
        },
      ],
    },
    {
      id: generateId(),
      title: "De Markt",
      level: "A2",
      topic: "Shopping at the market",
      paragraphs: [
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Elke zaterdag ga ik naar de markt.", translation: "Every Saturday I go to the market." },
            { id: generateId(), text: "De markt is in het centrum van de stad.", translation: "The market is in the center of the city." },
            { id: generateId(), text: "Er zijn veel mensen op de markt.", translation: "There are many people at the market." },
            { id: generateId(), text: "De markt begint om acht uur 's ochtends.", translation: "The market starts at eight o'clock in the morning." },
            { id: generateId(), text: "Ik ga altijd vroeg om de beste producten te vinden.", translation: "I always go early to find the best products." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Er zijn veel kraampjes met groenten en fruit.", translation: "There are many stalls with vegetables and fruit." },
            { id: generateId(), text: "Ik koop altijd verse appelen.", translation: "I always buy fresh apples." },
            { id: generateId(), text: "De appelen zijn rood en groot.", translation: "The apples are red and big." },
            { id: generateId(), text: "Ik koop ook tomaten en komkommers.", translation: "I also buy tomatoes and cucumbers." },
            { id: generateId(), text: "De groenten zijn goedkoper dan in de supermarkt.", translation: "The vegetables are cheaper than in the supermarket." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "De verkoper is heel vriendelijk.", translation: "The seller is very friendly." },
            { id: generateId(), text: "Hij heet Jan en kent iedereen.", translation: "His name is Jan and he knows everyone." },
            { id: generateId(), text: "Hij geeft me altijd een gratis appel.", translation: "He always gives me a free apple." },
            { id: generateId(), text: "We praten over het weer en de stad.", translation: "We talk about the weather and the city." },
            { id: generateId(), text: "Jan werkt al twintig jaar op de markt.", translation: "Jan has been working at the market for twenty years." },
          ],
        },
        {
          id: generateId(),
          sentences: [
            { id: generateId(), text: "Daarna ga ik naar de bakker voor brood.", translation: "After that I go to the baker for bread." },
            { id: generateId(), text: "De geur van vers brood ruikt heerlijk!", translation: "The smell of fresh bread smells delicious!" },
            { id: generateId(), text: "Ik koop een groot brood en een paar croissants.", translation: "I buy a large loaf and a few croissants." },
            { id: generateId(), text: "Om twaalf uur ga ik naar huis.", translation: "At twelve o'clock I go home." },
            { id: generateId(), text: "Ik ben blij met mijn aankopen van de markt.", translation: "I am happy with my purchases from the market." },
          ],
        },
      ],
    },
  ];
}

// Generate AI stories using OpenAI
async function generateAIStories(
  count: number,
  level: 'A1' | 'A2',
  existingTitles: string[] = []
): Promise<Story[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('No OpenAI API key found, using default stories');
    return getDefaultStories();
  }

  try {
    const avoidTitlesNote = existingTitles.length > 0
      ? `\n\nIMPORTANT: Do NOT generate stories with these titles or topics (they already exist):\n${existingTitles.map(t => `- ${t}`).join('\n')}\nChoose completely different and unique topics.`
      : '';

    const prompt = `Generate ${count} Dutch language learning ${level} level stories.${avoidTitlesNote}

Each story must be:
- At least 500 words total
- Divided into 4-6 paragraphs
- Each paragraph must have 4-8 sentences
- Simple and appropriate for ${level} level Dutch learners
- Have a clear Dutch title and a topic description in English
- Engaging, interesting, and educational

For each story, provide:
1. A title in Dutch
2. A topic description in English (2-5 words)
3. The level (${level})
4. 4-6 paragraphs, each with 4-8 sentences
5. Each sentence with its English translation

Return ONLY valid JSON in this exact format:
{
  "stories": [
    {
      "title": "Story title in Dutch",
      "topic": "Topic description in English",
      "level": "${level}",
      "paragraphs": [
        {
          "sentences": [
            { "text": "Dutch sentence.", "translation": "English translation." },
            { "text": "Dutch sentence.", "translation": "English translation." }
          ]
        }
      ]
    }
  ]
}

Make sure sentences are simple ${level} level Dutch with common vocabulary. Each story must be at least 500 words.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a Dutch language teacher creating detailed learning stories. Always respond with valid JSON only. Stories must be at least 500 words each with multiple paragraphs.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 6000,
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

    // Add IDs to stories, paragraphs, and sentences
    return parsed.stories.map((story: {
      title: string;
      topic: string;
      level: string;
      paragraphs: Array<{
        sentences: Array<{ text: string; translation: string }>;
      }>;
    }) => ({
      id: generateId(),
      title: story.title,
      level: story.level as 'A1' | 'A2',
      topic: story.topic || '',
      paragraphs: story.paragraphs.map((para) => ({
        id: generateId(),
        sentences: para.sentences.map((s: { text: string; translation: string }) => ({
          id: generateId(),
          text: s.text,
          translation: s.translation,
        } as Sentence)),
      } as Paragraph)),
    } as Story));
  } catch (error) {
    console.error('Error generating AI stories:', error);
    return getDefaultStories();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 3, level = 'A1', existingTitles = [] } = body;

    const stories = await generateAIStories(count, level, existingTitles);

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
