import { NextRequest, NextResponse } from 'next/server';

// Simple Dutch word/phrase translations for common words (fallback when no API key)
const commonTranslations: Record<string, string> = {
  // Articles
  de: 'the',
  het: 'the',
  een: 'a/an (or: one)',
  // Pronouns
  ik: 'I',
  jij: 'you',
  hij: 'he',
  zij: 'she',
  wij: 'we',
  jullie: 'you (plural)',
  ze: 'they/she',
  me: 'me',
  mij: 'me',
  hem: 'him',
  haar: 'her',
  ons: 'us',
  hen: 'them',
  // Common verbs
  is: 'is',
  zijn: 'to be / are',
  was: 'was',
  waren: 'were',
  heeft: 'has',
  hebben: 'to have',
  had: 'had',
  gaat: 'goes',
  gaan: 'to go',
  ging: 'went',
  komt: 'comes',
  komen: 'to come',
  kwamen: 'came',
  zegt: 'says',
  zeggen: 'to say',
  zei: 'said',
  doet: 'does',
  doen: 'to do',
  deed: 'did',
  wil: 'wants',
  willen: 'to want',
  wilde: 'wanted',
  kan: 'can',
  kunnen: 'to be able to',
  kon: 'could',
  moet: 'must / has to',
  moeten: 'to have to',
  moest: 'had to',
  ziet: 'sees',
  zien: 'to see',
  zag: 'saw',
  weet: 'knows',
  weten: 'to know',
  wist: 'knew',
  houdt: 'holds / likes',
  houden: 'to hold / like',
  hield: 'held',
  staat: 'stands',
  staan: 'to stand',
  stond: 'stood',
  loopt: 'walks',
  lopen: 'to walk',
  liep: 'walked',
  eet: 'eats',
  eten: 'to eat / food',
  at: 'ate',
  drinkt: 'drinks',
  drinken: 'to drink',
  dronk: 'drank',
  slaapt: 'sleeps',
  slapen: 'to sleep',
  sliep: 'slept',
  werkt: 'works',
  werken: 'to work',
  werkte: 'worked',
  speelt: 'plays',
  spelen: 'to play',
  speelde: 'played',
  leest: 'reads',
  lezen: 'to read',
  las: 'read (past)',
  schrijft: 'writes',
  schrijven: 'to write',
  schreef: 'wrote',
  koopt: 'buys',
  kopen: 'to buy',
  kocht: 'bought',
  geeft: 'gives',
  geven: 'to give',
  gaf: 'gave',
  neemt: 'takes',
  nemen: 'to take',
  nam: 'took',
  vindt: 'finds / thinks',
  vinden: 'to find / think',
  vond: 'found',
  // Common nouns
  huis: 'house',
  thuis: 'home',
  kamer: 'room',
  dag: 'day',
  week: 'week',
  maand: 'month',
  jaar: 'year',
  tijd: 'time',
  uur: 'hour',
  minuut: 'minute',
  man: 'man',
  vrouw: 'woman',
  kind: 'child',
  kinderen: 'children',
  vader: 'father',
  moeder: 'mother',
  broer: 'brother',
  zus: 'sister',
  vriend: 'friend',
  vrienden: 'friends',
  familie: 'family',
  stad: 'city',
  straat: 'street',
  weg: 'road / way',
  school: 'school',
  werk: 'work',
  winkel: 'shop',
  auto: 'car',
  fiets: 'bicycle',
  trein: 'train',
  bus: 'bus',
  water: 'water',
  brood: 'bread',
  melk: 'milk',
  boek: 'book',
  brief: 'letter',
  woord: 'word',
  // Common adjectives
  groot: 'big / large',
  klein: 'small',
  lang: 'long / tall',
  kort: 'short',
  goed: 'good',
  slecht: 'bad',
  mooi: 'beautiful',
  lelijk: 'ugly',
  nieuw: 'new',
  oud: 'old',
  jong: 'young',
  warm: 'warm',
  koud: 'cold',
  heet: 'hot',
  snel: 'fast',
  langzaam: 'slow',
  blij: 'happy',
  verdrietig: 'sad',
  boos: 'angry',
  moe: 'tired',
  ziek: 'sick',
  gezond: 'healthy',
  // Common adverbs / prepositions / conjunctions
  niet: 'not',
  ook: 'also / too',
  al: 'already',
  nog: 'still / yet',
  heel: 'very',
  erg: 'very / bad',
  echt: 'really / truly',
  nu: 'now',
  dan: 'then',
  altijd: 'always',
  nooit: 'never',
  hier: 'here',
  daar: 'there',
  waar: 'where',
  in: 'in',
  op: 'on',
  aan: 'on / at',
  bij: 'at / near',
  van: 'of / from',
  naar: 'to / towards',
  met: 'with',
  voor: 'for / before',
  na: 'after',
  over: 'over / about',
  onder: 'under',
  tussen: 'between',
  en: 'and',
  maar: 'but',
  of: 'or',
  want: 'because / for',
  dat: 'that',
  dit: 'this',
  die: 'that / those',
  deze: 'this / these',
  // Numbers
  twee: 'two',
  drie: 'three',
  vier: 'four',
  vijf: 'five',
  zes: 'six',
  zeven: 'seven',
  acht: 'eight',
  negen: 'nine',
  tien: 'ten',
};

async function translateWithOpenAI(text: string, context?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Try simple dictionary lookup for single words
    const lower = text.toLowerCase().replace(/[.,!?;:'"]/g, '');
    if (commonTranslations[lower]) {
      return commonTranslations[lower];
    }
    return `[Translation not available — add OPENAI_API_KEY]`;
  }

  const contextNote = context
    ? `\nContext (the full sentence this word/phrase appears in): "${context}"`
    : '';

  const prompt = `Translate the following Dutch word or phrase to English. Provide only the translation, nothing else.${contextNote}

Dutch: "${text}"
English:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a Dutch-to-English translator. Respond with only the English translation, no explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '[Translation failed]';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, context } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text parameter' }, { status: 400 });
    }

    const translation = await translateWithOpenAI(text.trim(), context);

    return NextResponse.json({ translation });
  } catch (error) {
    console.error('Error in translate API:', error);
    return NextResponse.json({ error: 'Translation failed', translation: '[Error]' }, { status: 500 });
  }
}
