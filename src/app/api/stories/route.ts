import { NextRequest, NextResponse } from 'next/server';
import { Story, Paragraph, Sentence, ComprehensionQuestion, QuestionType, StoryTopic } from '@/app/types/story';

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback story pool (used when no OpenAI key is set)
// Each story has ≥500 words, 5-6 paragraphs, and comprehension questions.
// ─────────────────────────────────────────────────────────────────────────────
type RawSentence = { text: string; translation: string };
type RawParagraph = { sentences: RawSentence[] };
type RawQuestion = {
  type: QuestionType;
  question: string;
  answer: string;
  options?: string[];
  correctBool?: boolean;
};
type RawStory = {
  title: string;
  level: 'A1' | 'A2';
  topic: StoryTopic | string;
  paragraphs: RawParagraph[];
  questions: RawQuestion[];
};

const STORY_POOL: RawStory[] = [
  // ── A1 — Daily life ──────────────────────────────────────────────────────────
  {
    title: 'Een Dag in Mijn Leven',
    level: 'A1',
    topic: 'daily life',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik sta elke ochtend om zeven uur op.', translation: "I get up every morning at seven o'clock." },
          { text: 'Ik ga naar de badkamer en poets mijn tanden.', translation: 'I go to the bathroom and brush my teeth.' },
          { text: 'Daarna douche ik en kleed ik me aan.', translation: 'Then I shower and get dressed.' },
          { text: 'Ik draag een spijkerbroek en een trui.', translation: 'I wear jeans and a sweater.' },
          { text: 'Het is koud buiten, dus ik pak ook een jas.', translation: 'It is cold outside, so I also grab a coat.' },
        ],
      },
      {
        sentences: [
          { text: 'In de keuken maak ik ontbijt.', translation: 'In the kitchen I make breakfast.' },
          { text: 'Ik eet twee boterhammen met kaas.', translation: 'I eat two slices of bread with cheese.' },
          { text: 'Ik drink een groot glas sinaasappelsap.', translation: 'I drink a large glass of orange juice.' },
          { text: 'Mijn vrouw drinkt koffie met melk.', translation: 'My wife drinks coffee with milk.' },
          { text: 'We praten over onze plannen voor de dag.', translation: 'We talk about our plans for the day.' },
          { text: 'Het is een rustige ochtend.', translation: 'It is a quiet morning.' },
        ],
      },
      {
        sentences: [
          { text: 'Om half negen ga ik naar mijn werk.', translation: 'At half past eight I go to my work.' },
          { text: 'Ik rijd op de fiets door de stad.', translation: 'I cycle through the city.' },
          { text: 'Er zijn veel andere fietsers op de weg.', translation: 'There are many other cyclists on the road.' },
          { text: 'Ik stop bij het rode licht en wacht.', translation: 'I stop at the red light and wait.' },
          { text: 'Na tien minuten ben ik op mijn werk.', translation: 'After ten minutes I am at my work.' },
          { text: 'Ik zet mijn fiets in de fietsenstalling.', translation: 'I put my bicycle in the bicycle shed.' },
        ],
      },
      {
        sentences: [
          { text: 'Op mijn werk drink ik nog een kop koffie.', translation: 'At work I drink another cup of coffee.' },
          { text: 'Ik werk op een computer.', translation: 'I work on a computer.' },
          { text: 'Ik schrijf e-mails en maak rapporten.', translation: 'I write emails and make reports.' },
          { text: 'Om twaalf uur eet ik mijn lunch.', translation: "At twelve o'clock I eat my lunch." },
          { text: 'Ik eet een broodje met ham en sla.', translation: 'I eat a roll with ham and lettuce.' },
          { text: 'Soms ga ik met collega\'s naar de kantine.', translation: 'Sometimes I go with colleagues to the canteen.' },
        ],
      },
      {
        sentences: [
          { text: "'s Middags werk ik verder aan mijn projecten.", translation: 'In the afternoon I continue working on my projects.' },
          { text: 'Om vijf uur is mijn werkdag klaar.', translation: 'At five o\'clock my working day is done.' },
          { text: 'Ik fiets weer naar huis.', translation: 'I cycle home again.' },
          { text: 'Thuis kook ik het avondeten.', translation: 'At home I cook dinner.' },
          { text: 'Vanavond maak ik pasta met tomatensaus.', translation: 'Tonight I make pasta with tomato sauce.' },
          { text: 'Na het eten kijk ik televisie of lees ik een boek.', translation: 'After dinner I watch television or read a book.' },
          { text: 'Om tien uur ga ik naar bed.', translation: "At ten o'clock I go to bed." },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Hoe laat staat de persoon op?',
        answer: 'Om zeven uur.',
        options: ['Om zes uur.', 'Om zeven uur.', 'Om acht uur.', 'Om negen uur.'],
      },
      {
        type: 'true_false',
        question: 'De persoon gaat met de auto naar zijn werk.',
        answer: 'Onwaar. De persoon gaat op de fiets naar zijn werk.',
        correctBool: false,
      },
      {
        type: 'fill_blank',
        question: 'De persoon eet twee boterhammen met ___ voor ontbijt.',
        answer: 'kaas',
      },
      {
        type: 'open',
        question: 'Wat doet de persoon na het avondeten?',
        answer: 'Na het avondeten kijkt de persoon televisie of leest een boek.',
      },
    ],
  },
  // ── A1 — Market ──────────────────────────────────────────────────────────────
  {
    title: 'Op de Markt',
    level: 'A1',
    topic: 'market',
    paragraphs: [
      {
        sentences: [
          { text: 'Elke zaterdag ga ik naar de markt.', translation: 'Every Saturday I go to the market.' },
          { text: 'De markt is in het centrum van de stad.', translation: 'The market is in the centre of the city.' },
          { text: 'Er zijn veel kraampjes met groenten en fruit.', translation: 'There are many stalls with vegetables and fruit.' },
          { text: 'De markt begint om acht uur \'s ochtends.', translation: "The market starts at eight o'clock in the morning." },
          { text: 'Ik ga altijd vroeg, want dan is het niet zo druk.', translation: 'I always go early, because then it is not so busy.' },
        ],
      },
      {
        sentences: [
          { text: 'Eerst ga ik naar de groentehandel.', translation: 'First I go to the vegetable stall.' },
          { text: 'Ik koop tomaten, komkommers en paprika\'s.', translation: 'I buy tomatoes, cucumbers and peppers.' },
          { text: 'De tomaten zijn rood en vers.', translation: 'The tomatoes are red and fresh.' },
          { text: 'De verkoper weegt de groenten op een weegschaal.', translation: 'The seller weighs the vegetables on a scale.' },
          { text: 'Ik betaal twee euro voor de tomaten.', translation: 'I pay two euros for the tomatoes.' },
          { text: 'De verkoper geeft me het wisselgeld terug.', translation: 'The seller gives me the change back.' },
        ],
      },
      {
        sentences: [
          { text: 'Daarna ga ik naar de fruitkraam.', translation: 'Then I go to the fruit stall.' },
          { text: 'Er liggen appels, peren en aardbeien.', translation: 'There are apples, pears and strawberries.' },
          { text: 'De aardbeien ruiken heerlijk.', translation: 'The strawberries smell wonderful.' },
          { text: 'Ik koop een bakje aardbeien en een kilo appels.', translation: 'I buy a punnet of strawberries and a kilo of apples.' },
          { text: 'De appels zijn groen en zuur, precies zoals ik ze lekker vind.', translation: 'The apples are green and sour, exactly as I like them.' },
        ],
      },
      {
        sentences: [
          { text: 'Bij de kaasboer koop ik een stuk oude kaas.', translation: 'At the cheese seller I buy a piece of aged cheese.' },
          { text: 'De kaasboer laat me een stukje proeven.', translation: 'The cheese seller lets me taste a piece.' },
          { text: 'De kaas is sterk en lekker.', translation: 'The cheese is strong and tasty.' },
          { text: 'Ik koop ook een stuk jonge kaas voor mijn kinderen.', translation: 'I also buy a piece of young cheese for my children.' },
          { text: 'Jonge kaas is zachter en milder van smaak.', translation: 'Young cheese is softer and milder in taste.' },
          { text: 'De kaasboer verpakt de kaas in papier.', translation: 'The cheese seller wraps the cheese in paper.' },
        ],
      },
      {
        sentences: [
          { text: 'Aan het einde van de markt is een bakker.', translation: 'At the end of the market there is a baker.' },
          { text: 'De bakker verkoopt vers brood en gebak.', translation: 'The baker sells fresh bread and pastries.' },
          { text: 'Ik koop een brood en twee croissants.', translation: 'I buy a loaf of bread and two croissants.' },
          { text: 'Het brood is nog warm uit de oven.', translation: 'The bread is still warm from the oven.' },
          { text: 'Ik loop terug naar huis met mijn volle tas.', translation: 'I walk back home with my full bag.' },
          { text: 'De markt is mijn favoriete plek op zaterdag.', translation: 'The market is my favourite place on Saturday.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Wanneer gaat de persoon naar de markt?',
        answer: 'Elke zaterdag.',
        options: ['Elke vrijdag.', 'Elke zaterdag.', 'Elke zondag.', 'Elke maandag.'],
      },
      {
        type: 'true_false',
        question: 'De persoon gaat vroeg naar de markt omdat het dan niet zo druk is.',
        answer: 'Waar. De persoon gaat vroeg omdat het dan niet zo druk is.',
        correctBool: true,
      },
      {
        type: 'fill_blank',
        question: 'Bij de kaasboer koopt de persoon een stuk oude kaas en een stuk ___ kaas.',
        answer: 'jonge',
      },
      {
        type: 'open',
        question: 'Wat koopt de persoon bij de bakker?',
        answer: 'De persoon koopt een brood en twee croissants.',
      },
    ],
  },
  // ── A1 — Dutch culture ───────────────────────────────────────────────────────
  {
    title: 'Sinterklaas in Nederland',
    level: 'A1',
    topic: 'Dutch culture',
    paragraphs: [
      {
        sentences: [
          { text: 'Sinterklaas is een belangrijk feest in Nederland.', translation: 'Sinterklaas is an important celebration in the Netherlands.' },
          { text: 'Het feest is op vijf december.', translation: 'The celebration is on the fifth of December.' },
          { text: 'Kinderen zijn erg blij met dit feest.', translation: 'Children are very happy with this celebration.' },
          { text: 'Ze zetten hun schoen bij de open haard.', translation: 'They put their shoe by the fireplace.' },
          { text: 'De volgende ochtend liggen er cadeautjes in de schoen.', translation: 'The next morning there are presents in the shoe.' },
        ],
      },
      {
        sentences: [
          { text: 'Sinterklaas komt uit Spanje op een stoomboot.', translation: 'Sinterklaas comes from Spain on a steamboat.' },
          { text: 'Hij heeft een lange witte baard en draagt rode kleren.', translation: 'He has a long white beard and wears red clothes.' },
          { text: 'Zijn helpers heten Zwarte Piet.', translation: 'His helpers are called Zwarte Piet.' },
          { text: 'Ze gooien pepernoten en snoep voor de kinderen.', translation: 'They throw gingerbread nuts and sweets for the children.' },
          { text: 'De kinderen vangen de snoepjes op.', translation: 'The children catch the sweets.' },
          { text: 'Iedereen zingt Sinterklaas-liedjes.', translation: 'Everyone sings Sinterklaas songs.' },
        ],
      },
      {
        sentences: [
          { text: 'Op de avond van vijf december is er een groot feest.', translation: 'On the evening of the fifth of December there is a big celebration.' },
          { text: 'De familie komt samen bij oma en opa.', translation: 'The family comes together at grandma and grandpa\'s.' },
          { text: 'Er zijn veel cadeautjes onder de boom.', translation: 'There are many presents under the tree.' },
          { text: 'Elk cadeau heeft een gedicht erbij.', translation: 'Each present has a poem with it.' },
          { text: 'Het gedicht is grappig en gaat over de persoon die het cadeau krijgt.', translation: 'The poem is funny and is about the person who receives the present.' },
        ],
      },
      {
        sentences: [
          { text: 'Typisch Sinterklaas-eten zijn pepernoten en speculaas.', translation: 'Typical Sinterklaas food is gingerbread nuts and spiced biscuits.' },
          { text: 'Pepernoten zijn kleine, ronde koekjes.', translation: 'Gingerbread nuts are small, round biscuits.' },
          { text: 'Ze smaken naar kaneel en anijs.', translation: 'They taste of cinnamon and anise.' },
          { text: 'Speculaas is een knapperig koekje met kruiden.', translation: 'Speculaas is a crispy biscuit with spices.' },
          { text: 'In de winkels liggen al weken voor het feest pepernoten.', translation: 'In the shops gingerbread nuts are available weeks before the celebration.' },
          { text: 'Veel Nederlanders eten ze de hele herfst.', translation: 'Many Dutch people eat them throughout the autumn.' },
        ],
      },
      {
        sentences: [
          { text: 'Sinterklaas is een traditie die al honderden jaren bestaat.', translation: 'Sinterklaas is a tradition that has existed for hundreds of years.' },
          { text: 'Kinderen geloven echt in Sinterklaas.', translation: 'Children truly believe in Sinterklaas.' },
          { text: 'Ze schrijven brieven aan Sinterklaas met hun wensen.', translation: 'They write letters to Sinterklaas with their wishes.' },
          { text: 'Het is een magische tijd voor de kinderen.', translation: 'It is a magical time for the children.' },
          { text: 'Als ze ouder worden, leren ze dat het een feest is voor de hele familie.', translation: 'When they get older, they learn that it is a celebration for the whole family.' },
          { text: 'Sinterklaas blijft een geliefd feest in Nederland.', translation: 'Sinterklaas remains a beloved celebration in the Netherlands.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Wanneer is het Sinterklaasfeest?',
        answer: 'Op vijf december.',
        options: ['Op vijf november.', 'Op vijf december.', 'Op vijfentwintig december.', 'Op zes januari.'],
      },
      {
        type: 'true_false',
        question: 'Sinterklaas komt uit Engeland op een stoomboot.',
        answer: 'Onwaar. Sinterklaas komt uit Spanje op een stoomboot.',
        correctBool: false,
      },
      {
        type: 'fill_blank',
        question: 'Kinderen zetten hun ___ bij de open haard.',
        answer: 'schoen',
      },
      {
        type: 'open',
        question: 'Wat zijn typische Sinterklaas-lekkernijen?',
        answer: 'Typische Sinterklaas-lekkernijen zijn pepernoten en speculaas.',
      },
    ],
  },
  // ── A2 — Travel ──────────────────────────────────────────────────────────────
  {
    title: 'Een Reis naar Amsterdam',
    level: 'A2',
    topic: 'travel',
    paragraphs: [
      {
        sentences: [
          { text: 'Vorig weekend ben ik naar Amsterdam gegaan.', translation: 'Last weekend I went to Amsterdam.' },
          { text: 'Ik heb de trein genomen vanuit Utrecht.', translation: 'I took the train from Utrecht.' },
          { text: 'De reis duurde ongeveer dertig minuten.', translation: 'The journey took about thirty minutes.' },
          { text: 'Op het Centraal Station was het erg druk.', translation: 'At Central Station it was very busy.' },
          { text: 'Er waren toeristen uit de hele wereld.', translation: 'There were tourists from all over the world.' },
          { text: 'Ik kocht een dagkaart voor de tram en de metro.', translation: 'I bought a day ticket for the tram and the metro.' },
        ],
      },
      {
        sentences: [
          { text: 'Mijn eerste bestemming was het Rijksmuseum.', translation: 'My first destination was the Rijksmuseum.' },
          { text: 'Het museum heeft een enorme collectie Nederlandse kunst.', translation: 'The museum has an enormous collection of Dutch art.' },
          { text: 'Ik heb lang gestaan voor de Nachtwacht van Rembrandt.', translation: 'I stood for a long time in front of Rembrandt\'s Night Watch.' },
          { text: 'Het schilderij is veel groter dan ik had verwacht.', translation: 'The painting is much larger than I had expected.' },
          { text: 'Er waren ook prachtige schilderijen van Vermeer.', translation: 'There were also beautiful paintings by Vermeer.' },
          { text: 'Na twee uur was ik moe van al het kijken.', translation: 'After two hours I was tired from all the looking.' },
        ],
      },
      {
        sentences: [
          { text: 'Voor de lunch ben ik naar een broodjeszaak gegaan.', translation: 'For lunch I went to a sandwich shop.' },
          { text: 'Ik heb een broodje kroket besteld.', translation: 'I ordered a kroket sandwich.' },
          { text: 'Een kroket is een typisch Nederlands snack.', translation: 'A kroket is a typical Dutch snack.' },
          { text: 'Het is een gefrituurde rol gevuld met ragout.', translation: 'It is a deep-fried roll filled with ragout.' },
          { text: 'Ik at het broodje op een bankje bij de gracht.', translation: 'I ate the sandwich on a bench by the canal.' },
          { text: 'De grachten zijn prachtig met de oude grachtenpanden.', translation: 'The canals are beautiful with the old canal houses.' },
        ],
      },
      {
        sentences: [
          { text: "Daarna heb ik een rondvaart door de grachten gemaakt.", translation: 'After that I took a canal boat tour.' },
          { text: 'De gids vertelde over de geschiedenis van de stad.', translation: 'The guide told about the history of the city.' },
          { text: 'Amsterdam is in de zeventiende eeuw gebouwd als handelsstad.', translation: 'Amsterdam was built in the seventeenth century as a trading city.' },
          { text: 'De grachtenpanden zijn gebouwd door rijke kooplieden.', translation: 'The canal houses were built by wealthy merchants.' },
          { text: 'Sommige huizen staan een beetje scheef.', translation: 'Some houses lean slightly.' },
          { text: 'Dat komt doordat ze op houten palen staan.', translation: 'That is because they stand on wooden piles.' },
        ],
      },
      {
        sentences: [
          { text: "'s Avonds ben ik naar de Jordaan gegaan.", translation: 'In the evening I went to the Jordaan.' },
          { text: 'De Jordaan is een gezellige wijk met kleine straatjes.', translation: 'The Jordaan is a cosy neighbourhood with small streets.' },
          { text: 'Er zijn veel leuke cafés en restaurants.', translation: 'There are many nice cafés and restaurants.' },
          { text: 'Ik heb gegeten in een Indonesisch restaurant.', translation: 'I ate in an Indonesian restaurant.' },
          { text: 'Indonesisch eten is populair in Nederland vanwege de koloniale geschiedenis.', translation: 'Indonesian food is popular in the Netherlands because of the colonial history.' },
          { text: 'Het was een geweldige dag in Amsterdam.', translation: 'It was a wonderful day in Amsterdam.' },
          { text: 'Ik wil zeker terugkomen.', translation: 'I definitely want to come back.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Hoe is de persoon naar Amsterdam gereisd?',
        answer: 'Met de trein vanuit Utrecht.',
        options: ['Met de bus vanuit Den Haag.', 'Met de trein vanuit Utrecht.', 'Met de auto vanuit Rotterdam.', 'Met de fiets vanuit Haarlem.'],
      },
      {
        type: 'fill_blank',
        question: 'De persoon heeft de ___ van Rembrandt gezien in het Rijksmuseum.',
        answer: 'Nachtwacht',
      },
      {
        type: 'true_false',
        question: 'Een kroket is een typisch Nederlands snack gevuld met ragout.',
        answer: 'Waar. Een kroket is een gefrituurde rol gevuld met ragout.',
        correctBool: true,
      },
      {
        type: 'open',
        question: 'Waarom staan sommige grachtenpanden scheef?',
        answer: 'Sommige grachtenpanden staan scheef omdat ze op houten palen staan.',
      },
    ],
  },
  // ── A2 — Dutch culture ───────────────────────────────────────────────────────
  {
    title: 'Koningsdag: Het Oranje Feest',
    level: 'A2',
    topic: 'Dutch culture',
    paragraphs: [
      {
        sentences: [
          { text: 'Op 27 april viert Nederland Koningsdag.', translation: 'On 27 April the Netherlands celebrates King\'s Day.' },
          { text: 'Het is de verjaardag van Koning Willem-Alexander.', translation: 'It is the birthday of King Willem-Alexander.' },
          { text: 'Heel Nederland kleurt oranje op deze dag.', translation: 'All of the Netherlands turns orange on this day.' },
          { text: 'Mensen dragen oranje kleren, hoeden en pruiken.', translation: 'People wear orange clothes, hats and wigs.' },
          { text: 'Het is een nationale feestdag en de meeste mensen hebben vrij.', translation: 'It is a national holiday and most people have the day off.' },
        ],
      },
      {
        sentences: [
          { text: 'Het bekendste onderdeel van Koningsdag is de vrijmarkt.', translation: 'The most famous part of King\'s Day is the free market.' },
          { text: 'Op de vrijmarkt mogen mensen hun oude spullen verkopen.', translation: 'At the free market people are allowed to sell their old things.' },
          { text: 'Kinderen verkopen speelgoed, boeken en kleding.', translation: 'Children sell toys, books and clothing.' },
          { text: 'Je kunt echte koopjes vinden als je goed zoekt.', translation: 'You can find real bargains if you look carefully.' },
          { text: 'De straten zijn vol met kraampjes en mensen.', translation: 'The streets are full of stalls and people.' },
          { text: 'Het is een gezellige chaos.', translation: 'It is a cosy chaos.' },
        ],
      },
      {
        sentences: [
          { text: 'In Amsterdam zijn de grachten vol met boten.', translation: 'In Amsterdam the canals are full of boats.' },
          { text: 'Mensen vieren het feest op het water.', translation: 'People celebrate the holiday on the water.' },
          { text: 'Er is muziek overal in de stad.', translation: 'There is music everywhere in the city.' },
          { text: 'Bands spelen op pleinen en in parken.', translation: 'Bands play on squares and in parks.' },
          { text: 'Jonge mensen dansen op de muziek.', translation: 'Young people dance to the music.' },
          { text: 'De sfeer is uitgelaten en vrolijk.', translation: 'The atmosphere is exuberant and cheerful.' },
        ],
      },
      {
        sentences: [
          { text: 'De Koninklijke Familie bezoekt elk jaar een andere stad.', translation: 'The Royal Family visits a different city every year.' },
          { text: 'Ze doen mee aan spelletjes en activiteiten.', translation: 'They participate in games and activities.' },
          { text: 'Mensen staan langs de straat om de Koning te zien.', translation: 'People stand along the street to see the King.' },
          { text: 'De Koning schudt handen en praat met gewone mensen.', translation: 'The King shakes hands and talks with ordinary people.' },
          { text: 'Het is een unieke traditie die de band tussen de Koninklijke Familie en het volk versterkt.', translation: 'It is a unique tradition that strengthens the bond between the Royal Family and the people.' },
        ],
      },
      {
        sentences: [
          { text: 'Vroeger heette het feest Koninginnedag.', translation: 'In the past the celebration was called Queen\'s Day.' },
          { text: 'Het was de verjaardag van Koningin Beatrix.', translation: 'It was the birthday of Queen Beatrix.' },
          { text: 'Toen Willem-Alexander in 2013 Koning werd, veranderde de naam.', translation: 'When Willem-Alexander became King in 2013, the name changed.' },
          { text: 'De datum veranderde ook van 30 april naar 27 april.', translation: 'The date also changed from 30 April to 27 April.' },
          { text: 'Koningsdag is een dag waarop Nederlanders trots zijn op hun land.', translation: 'King\'s Day is a day on which Dutch people are proud of their country.' },
          { text: 'Het is een feest van saamhorigheid en plezier.', translation: 'It is a celebration of togetherness and fun.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Wanneer is Koningsdag?',
        answer: 'Op 27 april.',
        options: ['Op 30 april.', 'Op 27 april.', 'Op 5 mei.', 'Op 15 augustus.'],
      },
      {
        type: 'fill_blank',
        question: 'Op de vrijmarkt mogen mensen hun oude ___ verkopen.',
        answer: 'spullen',
      },
      {
        type: 'true_false',
        question: 'Het feest heette vroeger Koninginnedag.',
        answer: 'Waar. Vroeger heette het feest Koninginnedag.',
        correctBool: true,
      },
      {
        type: 'open',
        question: 'Wat doet de Koninklijke Familie op Koningsdag?',
        answer: 'De Koninklijke Familie bezoekt elk jaar een andere stad en doet mee aan spelletjes en activiteiten.',
      },
    ],
  },
  // ── A2 — Market ──────────────────────────────────────────────────────────────
  {
    title: 'Werken op de Boerenmarkt',
    level: 'A2',
    topic: 'market',
    paragraphs: [
      {
        sentences: [
          { text: 'Mijn oom heeft een biologische boerderij buiten de stad.', translation: 'My uncle has an organic farm outside the city.' },
          { text: 'Elke zaterdag verkoopt hij zijn producten op de boerenmarkt.', translation: 'Every Saturday he sells his products at the farmers\' market.' },
          { text: 'Vorige zomer heb ik hem geholpen op de markt.', translation: 'Last summer I helped him at the market.' },
          { text: 'Het was een bijzondere ervaring.', translation: 'It was a special experience.' },
          { text: 'Ik leerde veel over het verkopen van verse producten.', translation: 'I learned a lot about selling fresh produce.' },
        ],
      },
      {
        sentences: [
          { text: 'We stonden elke zaterdag om vijf uur op.', translation: 'We got up every Saturday at five o\'clock.' },
          { text: 'Dan laadden we de auto vol met groenten en fruit.', translation: 'Then we loaded the car full of vegetables and fruit.' },
          { text: 'We hadden tomaten, courgettes, sla en aardbeien.', translation: 'We had tomatoes, courgettes, lettuce and strawberries.' },
          { text: 'Alles was die ochtend vers geplukt van het land.', translation: 'Everything had been freshly picked from the land that morning.' },
          { text: 'De producten roken heerlijk fris.', translation: 'The produce smelled wonderfully fresh.' },
          { text: 'Om zeven uur waren we op de markt om onze kraam op te zetten.', translation: 'At seven o\'clock we were at the market to set up our stall.' },
        ],
      },
      {
        sentences: [
          { text: 'Het opzetten van de kraam duurde een half uur.', translation: 'Setting up the stall took half an hour.' },
          { text: 'We legden de groenten netjes uit op de tafel.', translation: 'We laid out the vegetables neatly on the table.' },
          { text: 'Mijn oom maakte mooie bordjes met de prijzen.', translation: 'My uncle made nice signs with the prices.' },
          { text: 'Om acht uur opende de markt en kwamen de eerste klanten.', translation: 'At eight o\'clock the market opened and the first customers came.' },
          { text: 'Veel mensen kenden mijn oom al van vorige jaren.', translation: 'Many people already knew my uncle from previous years.' },
          { text: 'Ze vroegen naar zijn gezin en zijn boerderij.', translation: 'They asked about his family and his farm.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik leerde hoe ik klanten moest helpen.', translation: 'I learned how to help customers.' },
          { text: 'Ik woog de groenten en rekende de prijs uit.', translation: 'I weighed the vegetables and calculated the price.' },
          { text: 'Soms vroegen klanten om een recept voor een bepaalde groente.', translation: 'Sometimes customers asked for a recipe for a particular vegetable.' },
          { text: 'Mijn oom kende altijd een goed recept.', translation: 'My uncle always knew a good recipe.' },
          { text: 'Hij vertelde klanten hoe ze courgette konden bereiden.', translation: 'He told customers how to prepare courgette.' },
          { text: 'De klanten waardeerden zijn kennis en vriendelijkheid.', translation: 'The customers appreciated his knowledge and friendliness.' },
        ],
      },
      {
        sentences: [
          { text: 'Om één uur was de markt voorbij.', translation: 'At one o\'clock the market was over.' },
          { text: 'We hadden bijna alles verkocht.', translation: 'We had sold almost everything.' },
          { text: 'Wat over was, namen we mee terug naar de boerderij.', translation: 'What was left over, we took back to the farm.' },
          { text: 'Mijn oom was tevreden met de opbrengst.', translation: 'My uncle was satisfied with the proceeds.' },
          { text: 'Ik had een geweldige ochtend gehad.', translation: 'I had had a wonderful morning.' },
          { text: 'Ik begreep nu waarom mijn oom zo van zijn werk hield.', translation: 'I now understood why my uncle loved his work so much.' },
          { text: 'Het contact met de klanten en de verse producten maakten het bijzonder.', translation: 'The contact with the customers and the fresh produce made it special.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Hoe laat stonden ze op om naar de markt te gaan?',
        answer: 'Om vijf uur.',
        options: ['Om drie uur.', 'Om vier uur.', 'Om vijf uur.', 'Om zes uur.'],
      },
      {
        type: 'fill_blank',
        question: 'Ze verkochten tomaten, courgettes, sla en ___ op de boerenmarkt.',
        answer: 'aardbeien',
      },
      {
        type: 'true_false',
        question: 'De markt was om twee uur voorbij.',
        answer: 'Onwaar. Om één uur was de markt voorbij.',
        correctBool: false,
      },
      {
        type: 'open',
        question: 'Wat leerde de verteller op de markt?',
        answer: 'De verteller leerde hoe hij klanten moest helpen, groenten wegen en de prijs uitrekenen.',
      },
    ],
  },
  // ── A2 — Daily life ──────────────────────────────────────────────────────────
  {
    title: 'Leren Koken: Mijn Eerste Stamppot',
    level: 'A2',
    topic: 'daily life',
    paragraphs: [
      {
        sentences: [
          { text: 'Vorig jaar ben ik begonnen met koken leren.', translation: 'Last year I started learning to cook.' },
          { text: 'Ik woonde voor het eerst alleen en moest voor mezelf zorgen.', translation: 'I was living alone for the first time and had to take care of myself.' },
          { text: 'Mijn moeder had me altijd geholpen in de keuken, maar nu was ik op mezelf aangewezen.', translation: 'My mother had always helped me in the kitchen, but now I was on my own.' },
          { text: 'Ik besloot om een typisch Nederlands gerecht te leren: stamppot.', translation: 'I decided to learn a typical Dutch dish: stamppot.' },
          { text: 'Stamppot is een gerecht van aardappelen en groenten door elkaar gestampt.', translation: 'Stamppot is a dish of potatoes and vegetables mashed together.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik belde mijn oma voor het recept.', translation: 'I called my grandmother for the recipe.' },
          { text: 'Ze legde geduldig uit wat ik nodig had.', translation: 'She patiently explained what I needed.' },
          { text: 'Voor boerenkoolstamppot heb je aardappelen, boerenkool, rookworst en spek nodig.', translation: 'For kale stamppot you need potatoes, kale, smoked sausage and bacon.' },
          { text: 'Ik ging naar de supermarkt om de ingrediënten te kopen.', translation: 'I went to the supermarket to buy the ingredients.' },
          { text: 'De boerenkool lag in de groenteafdeling.', translation: 'The kale was in the vegetable section.' },
          { text: 'Ik koos een mooie, verse bos boerenkool.', translation: 'I chose a nice, fresh bunch of kale.' },
        ],
      },
      {
        sentences: [
          { text: 'Thuis begon ik met koken.', translation: 'At home I started cooking.' },
          { text: 'Eerst schilde ik de aardappelen.', translation: 'First I peeled the potatoes.' },
          { text: 'Dat duurde langer dan ik had gedacht.', translation: 'That took longer than I had thought.' },
          { text: 'Daarna sneed ik de boerenkool in kleine stukjes.', translation: 'Then I cut the kale into small pieces.' },
          { text: 'Ik kookte de aardappelen en de boerenkool samen in een grote pan.', translation: 'I cooked the potatoes and the kale together in a large pan.' },
          { text: 'Ondertussen bakte ik het spek in een koekenpan.', translation: 'Meanwhile I fried the bacon in a frying pan.' },
        ],
      },
      {
        sentences: [
          { text: 'Na twintig minuten waren de aardappelen gaar.', translation: 'After twenty minutes the potatoes were cooked.' },
          { text: 'Ik goot het water af en stampte alles fijn.', translation: 'I drained the water and mashed everything.' },
          { text: 'Ik voegde boter en melk toe voor een romige structuur.', translation: 'I added butter and milk for a creamy texture.' },
          { text: 'Ik proefde de stamppot en voegde zout en peper toe.', translation: 'I tasted the stamppot and added salt and pepper.' },
          { text: 'De rookworst verwarmde ik in heet water.', translation: 'I heated the smoked sausage in hot water.' },
          { text: 'Ik legde de rookworst op de stamppot en strooide het spek erover.', translation: 'I placed the smoked sausage on the stamppot and sprinkled the bacon over it.' },
        ],
      },
      {
        sentences: [
          { text: 'Het resultaat was verrassend goed.', translation: 'The result was surprisingly good.' },
          { text: 'De stamppot was romig en smaakvol.', translation: 'The stamppot was creamy and flavourful.' },
          { text: 'Ik was trots op mezelf.', translation: 'I was proud of myself.' },
          { text: 'Ik belde mijn oma om haar te bedanken voor het recept.', translation: 'I called my grandmother to thank her for the recipe.' },
          { text: 'Ze was blij dat ik het had geprobeerd.', translation: 'She was happy that I had tried it.' },
          { text: 'Sindsdien kook ik elke week stamppot.', translation: 'Since then I cook stamppot every week.' },
          { text: 'Het is mijn favoriete wintergerecht geworden.', translation: 'It has become my favourite winter dish.' },
        ],
      },
    ],
    questions: [
      {
        type: 'true_false',
        question: 'De persoon begon met koken leren omdat hij voor het eerst alleen woonde.',
        answer: 'Waar. De persoon begon met koken leren omdat hij voor het eerst alleen woonde.',
        correctBool: true,
      },
      {
        type: 'multiple_choice',
        question: 'Welk gerecht leerde de persoon als eerste?',
        answer: 'Stamppot.',
        options: ['Erwtensoep.', 'Stamppot.', 'Bitterballen.', 'Pannenkoeken.'],
      },
      {
        type: 'fill_blank',
        question: 'Voor boerenkoolstamppot heb je aardappelen, boerenkool, rookworst en ___ nodig.',
        answer: 'spek',
      },
      {
        type: 'open',
        question: 'Hoe maakte de persoon de stamppot romig?',
        answer: 'De persoon voegde boter en melk toe voor een romige structuur.',
      },
    ],
  },
  // ── A1 — Travel ──────────────────────────────────────────────────────────────
  {
    title: 'Mijn Eerste Treinreis',
    level: 'A1',
    topic: 'travel',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik ga voor het eerst alleen met de trein.', translation: 'I am going on the train alone for the first time.' },
          { text: 'Ik ga naar mijn oma in Rotterdam.', translation: 'I am going to my grandmother in Rotterdam.' },
          { text: 'Mijn moeder brengt me naar het station.', translation: 'My mother takes me to the station.' },
          { text: 'Het station is groot en druk.', translation: 'The station is big and busy.' },
          { text: 'Er zijn veel mensen met koffers en tassen.', translation: 'There are many people with suitcases and bags.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik koop een treinkaartje bij de automaat.', translation: 'I buy a train ticket at the machine.' },
          { text: 'Ik druk op het scherm en kies mijn bestemming.', translation: 'I press the screen and choose my destination.' },
          { text: 'Het kaartje kost acht euro.', translation: 'The ticket costs eight euros.' },
          { text: 'Ik betaal met mijn bankpas.', translation: 'I pay with my bank card.' },
          { text: 'De automaat geeft me het kaartje.', translation: 'The machine gives me the ticket.' },
          { text: 'Ik stop het kaartje veilig in mijn zak.', translation: 'I put the ticket safely in my pocket.' },
        ],
      },
      {
        sentences: [
          { text: 'Op het bord zie ik dat mijn trein op spoor vier staat.', translation: 'On the board I see that my train is on platform four.' },
          { text: 'Ik loop naar spoor vier.', translation: 'I walk to platform four.' },
          { text: 'De trein staat er al.', translation: 'The train is already there.' },
          { text: 'Ik stap in en zoek een zitplaats.', translation: 'I get on and look for a seat.' },
          { text: 'Ik ga bij het raam zitten.', translation: 'I sit by the window.' },
          { text: 'Ik kijk naar buiten en zie de stad voorbijgaan.', translation: 'I look outside and see the city passing by.' },
        ],
      },
      {
        sentences: [
          { text: 'In de trein is het rustig.', translation: 'In the train it is quiet.' },
          { text: 'Sommige mensen lezen een boek.', translation: 'Some people are reading a book.' },
          { text: 'Anderen kijken op hun telefoon.', translation: 'Others are looking at their phone.' },
          { text: 'Een mevrouw naast me eet een boterham.', translation: 'A lady next to me is eating a sandwich.' },
          { text: 'De conducteur komt langs en controleert de kaartjes.', translation: 'The conductor comes by and checks the tickets.' },
          { text: 'Ik laat mijn kaartje zien.', translation: 'I show my ticket.' },
        ],
      },
      {
        sentences: [
          { text: 'Na veertig minuten rijden we Rotterdam Centraal binnen.', translation: 'After forty minutes we arrive at Rotterdam Central.' },
          { text: 'Ik pak mijn tas en stap uit.', translation: 'I pick up my bag and get off.' },
          { text: 'Mijn oma staat me op te wachten op het perron.', translation: 'My grandmother is waiting for me on the platform.' },
          { text: 'Ze geeft me een grote knuffel.', translation: 'She gives me a big hug.' },
          { text: 'Ik ben blij dat ik er veilig ben.', translation: 'I am happy that I have arrived safely.' },
          { text: 'De treinreis was makkelijker dan ik dacht.', translation: 'The train journey was easier than I thought.' },
          { text: 'Ik wil vaker alleen reizen.', translation: 'I want to travel alone more often.' },
        ],
      },
    ],
    questions: [
      {
        type: 'multiple_choice',
        question: 'Waar gaat de persoon naartoe?',
        answer: 'Naar zijn oma in Rotterdam.',
        options: ['Naar zijn oma in Amsterdam.', 'Naar zijn oma in Rotterdam.', 'Naar zijn oma in Utrecht.', 'Naar zijn oma in Den Haag.'],
      },
      {
        type: 'fill_blank',
        question: 'Het treinkaartje kost ___ euro.',
        answer: 'acht',
      },
      {
        type: 'true_false',
        question: 'De trein staat op spoor vier.',
        answer: 'Waar. De trein staat op spoor vier.',
        correctBool: true,
      },
      {
        type: 'open',
        question: 'Hoe lang duurt de treinreis?',
        answer: 'De treinreis duurt veertig minuten.',
      },
    ],
  },
];

// Hydrate a raw story with generated IDs
function hydrateStory(raw: RawStory): Story {
  return {
    id: generateId(),
    title: raw.title,
    level: raw.level,
    topic: raw.topic,
    paragraphs: raw.paragraphs.map((p) => ({
      id: generateId(),
      sentences: p.sentences.map((s) => ({
        id: generateId(),
        text: s.text,
        translation: s.translation,
      })),
    })),
    questions: raw.questions.map((q) => ({
      id: generateId(),
      type: q.type,
      question: q.question,
      answer: q.answer,
      ...(q.options ? { options: q.options } : {}),
      ...(q.correctBool !== undefined ? { correctBool: q.correctBool } : {}),
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural story generator — creates unique stories from templates
// so the app never runs out of fresh content without an API key.
// ─────────────────────────────────────────────────────────────────────────────

const DUTCH_NAMES = [
  'Emma', 'Liam', 'Sophie', 'Noah', 'Julia', 'Daan', 'Anna', 'Lars',
  'Mia', 'Finn', 'Sara', 'Bram', 'Lisa', 'Sven', 'Eva', 'Joris',
  'Nora', 'Pieter', 'Hanna', 'Ruben', 'Inge', 'Thijs', 'Roos', 'Koen',
];

const DUTCH_CITIES = [
  'Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag', 'Eindhoven',
  'Groningen', 'Leiden', 'Haarlem', 'Delft', 'Maastricht',
  'Nijmegen', 'Tilburg', 'Breda', 'Arnhem', 'Zwolle',
];

const DUTCH_FOODS = [
  'stamppot', 'erwtensoep', 'bitterballen', 'stroopwafels', 'poffertjes',
  'haring', 'kaas', 'pannenkoeken', 'oliebollen', 'appeltaart',
];

const DUTCH_HOBBIES = [
  'fietsen', 'schilderen', 'lezen', 'koken', 'tuinieren',
  'zwemmen', 'wandelen', 'fotograferen', 'muziek maken', 'voetballen',
];

const DUTCH_JOBS = [
  'leraar', 'dokter', 'bakker', 'ingenieur', 'verpleegkundige',
  'journalist', 'architect', 'kok', 'bibliotheekmedewerker', 'programmeur',
];

const DUTCH_SEASONS = ['lente', 'zomer', 'herfst', 'winter'];
const DUTCH_MONTHS = [
  'januari', 'februari', 'maart', 'april', 'mei', 'juni',
  'juli', 'augustus', 'september', 'oktober', 'november', 'december',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickExcluding<T>(arr: T[], exclude: T[]): T {
  const filtered = arr.filter((x) => !exclude.includes(x));
  return filtered.length > 0 ? pick(filtered) : pick(arr);
}

interface StoryVars {
  name: string;
  name2: string;
  city: string;
  city2: string;
  food: string;
  hobby: string;
  job: string;
  season: string;
  month: string;
}

function makeVars(): StoryVars {
  const name = pick(DUTCH_NAMES);
  const name2 = pickExcluding(DUTCH_NAMES, [name]);
  const city = pick(DUTCH_CITIES);
  const city2 = pickExcluding(DUTCH_CITIES, [city]);
  return {
    name, name2, city, city2,
    food: pick(DUTCH_FOODS),
    hobby: pick(DUTCH_HOBBIES),
    job: pick(DUTCH_JOBS),
    season: pick(DUTCH_SEASONS),
    month: pick(DUTCH_MONTHS),
  };
}

function fill(template: string, vars: StoryVars): string {
  return template
    .replace(/\{name\}/g, vars.name)
    .replace(/\{name2\}/g, vars.name2)
    .replace(/\{city\}/g, vars.city)
    .replace(/\{city2\}/g, vars.city2)
    .replace(/\{food\}/g, vars.food)
    .replace(/\{hobby\}/g, vars.hobby)
    .replace(/\{job\}/g, vars.job)
    .replace(/\{season\}/g, vars.season)
    .replace(/\{month\}/g, vars.month);
}

// Story templates — each has Dutch text + English translation, with {var} placeholders
type RawSentenceTemplate = { text: string; translation: string };
type RawParagraphTemplate = { sentences: RawSentenceTemplate[] };
type RawStoryTemplate = {
  titleTemplate: string;
  level: 'A1' | 'A2';
  topic: StoryTopic | string;
  paragraphs: RawParagraphTemplate[];
  questions: RawQuestion[];
};

const STORY_TEMPLATES: RawStoryTemplate[] = [
  // ── A1 — Daily life ──────────────────────────────────────────────────────────
  {
    titleTemplate: 'Een Dag met {name}',
    level: 'A1',
    topic: 'daily life',
    paragraphs: [
      { sentences: [
        { text: '{name} woont in {city}.', translation: '{name} lives in {city}.' },
        { text: 'Elke ochtend staat {name} vroeg op.', translation: 'Every morning {name} gets up early.' },
        { text: '{name} werkt als {job}.', translation: '{name} works as a {job}.' },
        { text: 'Het werk begint om negen uur.', translation: 'Work starts at nine o\'clock.' },
        { text: '{name} gaat op de fiets naar het werk.', translation: '{name} cycles to work.' },
      ]},
      { sentences: [
        { text: 'In de ochtend eet {name} een boterham.', translation: 'In the morning {name} eats a sandwich.' },
        { text: '{name} drinkt een kop koffie.', translation: '{name} drinks a cup of coffee.' },
        { text: 'Het ontbijt is snel en simpel.', translation: 'Breakfast is quick and simple.' },
        { text: 'Daarna pakt {name} zijn tas.', translation: 'Then {name} grabs his bag.' },
        { text: 'De fiets staat buiten voor de deur.', translation: 'The bicycle is outside in front of the door.' },
      ]},
      { sentences: [
        { text: 'Op het werk praat {name} met collega\'s.', translation: 'At work {name} talks with colleagues.' },
        { text: 'Ze drinken samen koffie in de pauze.', translation: 'They drink coffee together during the break.' },
        { text: '{name} werkt hard en is blij met zijn baan.', translation: '{name} works hard and is happy with his job.' },
        { text: 'Om twaalf uur eet {name} zijn lunch.', translation: 'At twelve o\'clock {name} eats his lunch.' },
        { text: 'Hij eet een broodje met kaas.', translation: 'He eats a roll with cheese.' },
        { text: 'Na de lunch gaat hij weer aan het werk.', translation: 'After lunch he goes back to work.' },
      ]},
      { sentences: [
        { text: 'Na het werk gaat {name} naar huis.', translation: 'After work {name} goes home.' },
        { text: 'Thuis kookt {name} het avondeten.', translation: 'At home {name} cooks dinner.' },
        { text: 'Vanavond maakt {name} {food}.', translation: 'Tonight {name} makes {food}.' },
        { text: 'Het ruikt heerlijk in de keuken.', translation: 'It smells wonderful in the kitchen.' },
        { text: '{name} eet alleen aan de keukentafel.', translation: '{name} eats alone at the kitchen table.' },
        { text: 'Het eten is lekker.', translation: 'The food is delicious.' },
      ]},
      { sentences: [
        { text: 'In de avond doet {name} aan {hobby}.', translation: 'In the evening {name} does {hobby}.' },
        { text: 'Dat is zijn favoriete hobby.', translation: 'That is his favourite hobby.' },
        { text: '{name} vindt het heel leuk.', translation: '{name} finds it very enjoyable.' },
        { text: 'Om tien uur gaat {name} naar bed.', translation: 'At ten o\'clock {name} goes to bed.' },
        { text: 'Morgen is er weer een nieuwe dag.', translation: 'Tomorrow there will be another new day.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Wat is het beroep van {name}?', answer: '{name} is {job}.', options: ['{job}', 'dokter', 'bakker', 'leraar'] },
      { type: 'true_false', question: '{name} gaat met de auto naar het werk.', answer: 'Onwaar. {name} gaat op de fiets naar het werk.', correctBool: false },
      { type: 'fill_blank', question: 'Vanavond maakt {name} ___.', answer: '{food}' },
      { type: 'open', question: 'Wat doet {name} in de avond?', answer: '{name} doet aan {hobby} in de avond.' },
    ],
  },
  // ── A1 — Travel ──────────────────────────────────────────────────────────────
  {
    titleTemplate: 'Een Reis naar {city}',
    level: 'A1',
    topic: 'travel',
    paragraphs: [
      { sentences: [
        { text: '{name} gaat op reis naar {city}.', translation: '{name} is going on a trip to {city}.' },
        { text: 'Het is de eerste keer dat {name} daar naartoe gaat.', translation: 'It is the first time {name} goes there.' },
        { text: '{name} is erg blij en opgewonden.', translation: '{name} is very happy and excited.' },
        { text: 'Hij pakt zijn koffer in.', translation: 'He packs his suitcase.' },
        { text: 'Hij neemt kleren, schoenen en een tandenborstel mee.', translation: 'He takes clothes, shoes and a toothbrush.' },
      ]},
      { sentences: [
        { text: '{name} gaat met de trein naar {city}.', translation: '{name} goes to {city} by train.' },
        { text: 'Het station is groot en druk.', translation: 'The station is big and busy.' },
        { text: '{name} koopt een treinkaartje.', translation: '{name} buys a train ticket.' },
        { text: 'De trein vertrekt om tien uur.', translation: 'The train departs at ten o\'clock.' },
        { text: 'De reis duurt twee uur.', translation: 'The journey takes two hours.' },
        { text: '{name} kijkt uit het raam naar het landschap.', translation: '{name} looks out the window at the landscape.' },
      ]},
      { sentences: [
        { text: 'In {city} gaat {name} naar het centrum.', translation: 'In {city} {name} goes to the city centre.' },
        { text: 'Hij bezoekt een museum.', translation: 'He visits a museum.' },
        { text: 'Het museum is interessant en mooi.', translation: 'The museum is interesting and beautiful.' },
        { text: '{name} maakt veel foto\'s.', translation: '{name} takes many photos.' },
        { text: 'Daarna gaat hij naar een café.', translation: 'Then he goes to a café.' },
        { text: 'Hij drinkt een kop koffie en eet een stuk taart.', translation: 'He drinks a cup of coffee and eats a piece of cake.' },
      ]},
      { sentences: [
        { text: 'In de middag wandelt {name} door de stad.', translation: 'In the afternoon {name} walks through the city.' },
        { text: 'Hij ziet mooie gebouwen en grachten.', translation: 'He sees beautiful buildings and canals.' },
        { text: 'De stad is heel mooi.', translation: 'The city is very beautiful.' },
        { text: '{name} koopt een souvenir voor zijn familie.', translation: '{name} buys a souvenir for his family.' },
        { text: 'Hij vindt een leuk winkeltje in een zijstraat.', translation: 'He finds a nice little shop in a side street.' },
        { text: 'Hij koopt een klein schilderijtje.', translation: 'He buys a small painting.' },
      ]},
      { sentences: [
        { text: 'In de avond eet {name} in een restaurant.', translation: 'In the evening {name} eats in a restaurant.' },
        { text: 'Hij bestelt {food}.', translation: 'He orders {food}.' },
        { text: 'Het eten is heerlijk.', translation: 'The food is delicious.' },
        { text: 'Na het eten gaat {name} naar zijn hotel.', translation: 'After dinner {name} goes to his hotel.' },
        { text: 'Hij is moe maar gelukkig.', translation: 'He is tired but happy.' },
        { text: 'Morgen gaat hij weer naar huis.', translation: 'Tomorrow he goes home again.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Hoe reist {name} naar {city}?', answer: 'Met de trein.', options: ['Met de auto.', 'Met de trein.', 'Met het vliegtuig.', 'Op de fiets.'] },
      { type: 'fill_blank', question: '{name} bestelt ___ in het restaurant.', answer: '{food}' },
      { type: 'true_false', question: '{name} is al eerder in {city} geweest.', answer: 'Onwaar. Het is de eerste keer dat {name} naar {city} gaat.', correctBool: false },
      { type: 'open', question: 'Wat koopt {name} als souvenir?', answer: '{name} koopt een klein schilderijtje als souvenir.' },
    ],
  },
  // ── A1 — Market ──────────────────────────────────────────────────────────────
  {
    titleTemplate: 'Op de Markt in {city}',
    level: 'A1',
    topic: 'market',
    paragraphs: [
      { sentences: [
        { text: 'Op zaterdag gaat {name} naar de markt in {city}.', translation: 'On Saturday {name} goes to the market in {city}.' },
        { text: 'De markt is groot en kleurrijk.', translation: 'The market is large and colourful.' },
        { text: 'Er zijn veel kramen met groenten, fruit en kaas.', translation: 'There are many stalls with vegetables, fruit and cheese.' },
        { text: '{name} houdt van de markt.', translation: '{name} loves the market.' },
        { text: 'Het is altijd gezellig en druk.', translation: 'It is always cosy and busy.' },
      ]},
      { sentences: [
        { text: '{name} koopt eerst groenten.', translation: '{name} first buys vegetables.' },
        { text: 'Hij koopt tomaten, wortels en uien.', translation: 'He buys tomatoes, carrots and onions.' },
        { text: 'De groenten zijn vers en goedkoop.', translation: 'The vegetables are fresh and cheap.' },
        { text: 'De marktkoopman is vriendelijk.', translation: 'The market vendor is friendly.' },
        { text: 'Hij geeft {name} een extra appel cadeau.', translation: 'He gives {name} an extra apple as a gift.' },
        { text: '{name} bedankt hem.', translation: '{name} thanks him.' },
      ]},
      { sentences: [
        { text: 'Daarna gaat {name} naar de kaasstand.', translation: 'Then {name} goes to the cheese stall.' },
        { text: 'Er zijn veel soorten kaas.', translation: 'There are many types of cheese.' },
        { text: '{name} proeft een stukje oude kaas.', translation: '{name} tastes a piece of aged cheese.' },
        { text: 'De kaas is lekker en sterk van smaak.', translation: 'The cheese is tasty and strong in flavour.' },
        { text: 'Hij koopt een half kilo Goudse kaas.', translation: 'He buys half a kilo of Gouda cheese.' },
        { text: 'De kaas kost vier euro.', translation: 'The cheese costs four euros.' },
      ]},
      { sentences: [
        { text: 'Bij de bakker koopt {name} vers brood.', translation: 'At the baker {name} buys fresh bread.' },
        { text: 'Het brood ruikt heerlijk.', translation: 'The bread smells wonderful.' },
        { text: 'Hij koopt ook een stuk {food}.', translation: 'He also buys a piece of {food}.' },
        { text: 'De bakker is al vroeg op de markt.', translation: 'The baker is at the market early.' },
        { text: 'Zijn producten zijn altijd vers.', translation: 'His products are always fresh.' },
        { text: '{name} is een vaste klant.', translation: '{name} is a regular customer.' },
      ]},
      { sentences: [
        { text: 'Na het winkelen drinkt {name} een kop koffie.', translation: 'After shopping {name} drinks a cup of coffee.' },
        { text: 'Hij zit op een terrasje bij de markt.', translation: 'He sits on a terrace near the market.' },
        { text: 'Het is een mooie {season}dag.', translation: 'It is a beautiful {season} day.' },
        { text: '{name} kijkt naar de mensen op de markt.', translation: '{name} watches the people at the market.' },
        { text: 'Hij is blij met zijn aankopen.', translation: 'He is happy with his purchases.' },
        { text: 'Volgende week komt hij zeker terug.', translation: 'Next week he will certainly come back.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Wanneer gaat {name} naar de markt?', answer: 'Op zaterdag.', options: ['Op maandag.', 'Op woensdag.', 'Op zaterdag.', 'Op zondag.'] },
      { type: 'fill_blank', question: '{name} koopt ook een stuk ___ bij de bakker.', answer: '{food}' },
      { type: 'true_false', question: 'De groenten op de markt zijn duur.', answer: 'Onwaar. De groenten zijn vers en goedkoop.', correctBool: false },
      { type: 'open', question: 'Wat doet {name} na het winkelen?', answer: '{name} drinkt een kop koffie op een terrasje bij de markt.' },
    ],
  },
  // ── A1 — Dutch culture ───────────────────────────────────────────────────────
  {
    titleTemplate: 'Fietsen in {city}',
    level: 'A1',
    topic: 'Dutch culture',
    paragraphs: [
      { sentences: [
        { text: 'In Nederland fietst iedereen.', translation: 'In the Netherlands everyone cycles.' },
        { text: '{name} woont in {city} en fietst elke dag.', translation: '{name} lives in {city} and cycles every day.' },
        { text: 'Hij heeft een oude, blauwe fiets.', translation: 'He has an old, blue bicycle.' },
        { text: 'De fiets is zijn favoriete vervoermiddel.', translation: 'The bicycle is his favourite means of transport.' },
        { text: 'In {city} zijn veel fietspaden.', translation: 'In {city} there are many cycle paths.' },
      ]},
      { sentences: [
        { text: '{name} fietst naar zijn werk.', translation: '{name} cycles to work.' },
        { text: 'Het duurt twintig minuten.', translation: 'It takes twenty minutes.' },
        { text: 'Onderweg ziet hij de grachten en de mooie huizen.', translation: 'On the way he sees the canals and the beautiful houses.' },
        { text: 'Hij vindt fietsen heerlijk.', translation: 'He finds cycling wonderful.' },
        { text: 'Ook als het regent, fietst {name}.', translation: 'Even when it rains, {name} cycles.' },
        { text: 'Hij heeft een goede regenjas.', translation: 'He has a good raincoat.' },
      ]},
      { sentences: [
        { text: 'In het weekend fietst {name} met zijn vriend {name2}.', translation: 'At the weekend {name} cycles with his friend {name2}.' },
        { text: 'Ze fietsen door het platteland.', translation: 'They cycle through the countryside.' },
        { text: 'Het landschap is groen en vlak.', translation: 'The landscape is green and flat.' },
        { text: 'Ze zien koeien en schapen in de weilanden.', translation: 'They see cows and sheep in the meadows.' },
        { text: 'Na een uur stoppen ze bij een café.', translation: 'After an hour they stop at a café.' },
        { text: 'Ze drinken koffie en eten een stuk appeltaart.', translation: 'They drink coffee and eat a piece of apple pie.' },
      ]},
      { sentences: [
        { text: 'Nederland heeft meer fietsen dan mensen.', translation: 'The Netherlands has more bicycles than people.' },
        { text: 'Dat is een bijzonder feit.', translation: 'That is a remarkable fact.' },
        { text: 'Nederlanders fietsen naar school, naar het werk en naar de winkel.', translation: 'Dutch people cycle to school, to work and to the shop.' },
        { text: 'Fietsen is goed voor het milieu.', translation: 'Cycling is good for the environment.' },
        { text: 'Het is ook gezond.', translation: 'It is also healthy.' },
        { text: '{name} is trots op de Nederlandse fietscultuur.', translation: '{name} is proud of Dutch cycling culture.' },
      ]},
      { sentences: [
        { text: 'Op een mooie {season}dag fietst {name} naar {city2}.', translation: 'On a beautiful {season} day {name} cycles to {city2}.' },
        { text: 'De afstand is dertig kilometer.', translation: 'The distance is thirty kilometres.' },
        { text: 'Het is een lange maar mooie rit.', translation: 'It is a long but beautiful ride.' },
        { text: 'In {city2} bezoekt hij een vriend.', translation: 'In {city2} he visits a friend.' },
        { text: 'Ze eten samen {food}.', translation: 'They eat {food} together.' },
        { text: 'In de avond fietst {name} weer naar huis.', translation: 'In the evening {name} cycles home again.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Hoe lang duurt de fietstocht van {name} naar zijn werk?', answer: 'Twintig minuten.', options: ['Tien minuten.', 'Twintig minuten.', 'Een half uur.', 'Een uur.'] },
      { type: 'true_false', question: '{name} fietst alleen als het mooi weer is.', answer: 'Onwaar. Ook als het regent, fietst {name}.', correctBool: false },
      { type: 'fill_blank', question: 'In het weekend fietst {name} met zijn vriend ___.', answer: '{name2}' },
      { type: 'open', question: 'Waarom is fietsen goed?', answer: 'Fietsen is goed voor het milieu en het is ook gezond.' },
    ],
  },
  // ── A2 — Daily life ──────────────────────────────────────────────────────────
  {
    titleTemplate: '{name} Leert {hobby}',
    level: 'A2',
    topic: 'daily life',
    paragraphs: [
      { sentences: [
        { text: 'Vorig jaar besloot {name} om {hobby} te leren.', translation: 'Last year {name} decided to learn {hobby}.' },
        { text: 'Hij had er altijd al van gedroomd.', translation: 'He had always dreamed of it.' },
        { text: '{name} woont in {city} en werkt als {job}.', translation: '{name} lives in {city} and works as a {job}.' },
        { text: 'Na zijn werk heeft hij elke avond een paar uur vrij.', translation: 'After work he has a few hours free every evening.' },
        { text: 'Hij besloot die tijd te gebruiken voor zijn nieuwe hobby.', translation: 'He decided to use that time for his new hobby.' },
      ]},
      { sentences: [
        { text: 'In het begin was {hobby} moeilijk voor {name}.', translation: 'At first {hobby} was difficult for {name}.' },
        { text: 'Hij maakte veel fouten, maar gaf niet op.', translation: 'He made many mistakes, but did not give up.' },
        { text: '{name} keek video\'s op internet om te leren.', translation: '{name} watched videos on the internet to learn.' },
        { text: 'Hij oefende elke dag een half uur.', translation: 'He practised for half an hour every day.' },
        { text: 'Langzaam werd hij beter.', translation: 'Slowly he got better.' },
        { text: 'Zijn vriend {name2} hielp hem ook.', translation: 'His friend {name2} also helped him.' },
      ]},
      { sentences: [
        { text: 'Na een maand kon {name} al goed {hobby}.', translation: 'After a month {name} could already do {hobby} well.' },
        { text: 'Hij was trots op zijn vooruitgang.', translation: 'He was proud of his progress.' },
        { text: '{name2} zei dat hij heel goed was geworden.', translation: '{name2} said that he had become very good.' },
        { text: 'Dat gaf {name} veel motivatie.', translation: 'That gave {name} a lot of motivation.' },
        { text: 'Hij besloot om een cursus te volgen.', translation: 'He decided to take a course.' },
        { text: 'De cursus was in {city} en kostte vijftig euro.', translation: 'The course was in {city} and cost fifty euros.' },
      ]},
      { sentences: [
        { text: 'Op de cursus ontmoette {name} andere mensen met dezelfde hobby.', translation: 'At the course {name} met other people with the same hobby.' },
        { text: 'Ze werden snel vrienden.', translation: 'They quickly became friends.' },
        { text: 'Elke week kwamen ze samen om te oefenen.', translation: 'Every week they came together to practise.' },
        { text: '{name} leerde veel van de andere cursisten.', translation: '{name} learned a lot from the other course participants.' },
        { text: 'De leraar was geduldig en enthousiast.', translation: 'The teacher was patient and enthusiastic.' },
        { text: 'Na drie maanden had {name} zijn certificaat.', translation: 'After three months {name} had his certificate.' },
      ]},
      { sentences: [
        { text: 'Nu is {hobby} een belangrijk deel van het leven van {name}.', translation: 'Now {hobby} is an important part of {name}\'s life.' },
        { text: 'Hij doet het elke week.', translation: 'He does it every week.' },
        { text: 'Het geeft hem energie en plezier.', translation: 'It gives him energy and pleasure.' },
        { text: '{name} raadt iedereen aan om een nieuwe hobby te proberen.', translation: '{name} recommends everyone to try a new hobby.' },
        { text: 'Het is nooit te laat om iets nieuws te leren.', translation: 'It is never too late to learn something new.' },
        { text: 'Volgend jaar wil {name} {hobby} op een hoger niveau brengen.', translation: 'Next year {name} wants to take {hobby} to a higher level.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Waarom begon {name} met {hobby}?', answer: 'Omdat hij er altijd al van had gedroomd.', options: ['Omdat zijn baas het vroeg.', 'Omdat hij er altijd al van had gedroomd.', 'Omdat het goedkoop was.', 'Omdat {name2} het ook deed.'] },
      { type: 'true_false', question: '{name} gaf op toen {hobby} moeilijk was.', answer: 'Onwaar. {name} maakte fouten maar gaf niet op.', correctBool: false },
      { type: 'fill_blank', question: 'Na drie maanden had {name} zijn ___.', answer: 'certificaat' },
      { type: 'open', question: 'Wat adviseert {name} aan andere mensen?', answer: '{name} raadt iedereen aan om een nieuwe hobby te proberen.' },
    ],
  },
  // ── A2 — Travel ──────────────────────────────────────────────────────────────
  {
    titleTemplate: 'Een Weekend in {city}',
    level: 'A2',
    topic: 'travel',
    paragraphs: [
      { sentences: [
        { text: '{name} en {name2} besloten een weekend naar {city} te gaan.', translation: '{name} and {name2} decided to go to {city} for a weekend.' },
        { text: 'Ze hadden het al lang gepland.', translation: 'They had planned it for a long time.' },
        { text: '{name} boekte een hotel in het centrum van {city}.', translation: '{name} booked a hotel in the centre of {city}.' },
        { text: 'Het hotel had goede recensies op internet.', translation: 'The hotel had good reviews on the internet.' },
        { text: 'Ze vertrokken op vrijdagavond na het werk.', translation: 'They left on Friday evening after work.' },
      ]},
      { sentences: [
        { text: 'De reis naar {city} duurde twee uur met de trein.', translation: 'The journey to {city} took two hours by train.' },
        { text: 'Onderweg praatten ze over hun plannen voor het weekend.', translation: 'On the way they talked about their plans for the weekend.' },
        { text: 'Ze wilden musea bezoeken en lekker eten.', translation: 'They wanted to visit museums and eat well.' },
        { text: 'Bij aankomst in {city} gingen ze meteen naar het hotel.', translation: 'On arrival in {city} they went straight to the hotel.' },
        { text: 'De kamer was klein maar schoon en comfortabel.', translation: 'The room was small but clean and comfortable.' },
        { text: 'Ze waren blij met hun keuze.', translation: 'They were happy with their choice.' },
      ]},
      { sentences: [
        { text: 'Op zaterdag begonnen ze vroeg.', translation: 'On Saturday they started early.' },
        { text: 'Na het ontbijt gingen ze naar een museum.', translation: 'After breakfast they went to a museum.' },
        { text: 'Het museum was geweldig en ze leerden veel.', translation: 'The museum was wonderful and they learned a lot.' },
        { text: 'In de middag wandelden ze door de oude binnenstad.', translation: 'In the afternoon they walked through the old city centre.' },
        { text: 'Ze bewonderden de historische gebouwen en grachten.', translation: 'They admired the historical buildings and canals.' },
        { text: '{name} maakte veel foto\'s met zijn telefoon.', translation: '{name} took many photos with his phone.' },
      ]},
      { sentences: [
        { text: 'Op zaterdagavond gingen ze naar een restaurant.', translation: 'On Saturday evening they went to a restaurant.' },
        { text: 'Ze bestelden {food} en een glas wijn.', translation: 'They ordered {food} and a glass of wine.' },
        { text: 'Het eten was uitstekend.', translation: 'The food was excellent.' },
        { text: 'Na het eten wandelden ze langs de verlichte grachten.', translation: 'After dinner they walked along the illuminated canals.' },
        { text: 'De stad was prachtig in de avond.', translation: 'The city was beautiful in the evening.' },
        { text: 'Ze genoten van elke minuut.', translation: 'They enjoyed every minute.' },
      ]},
      { sentences: [
        { text: 'Op zondag bezochten ze een markt.', translation: 'On Sunday they visited a market.' },
        { text: 'Ze kochten souvenirs voor hun familie.', translation: 'They bought souvenirs for their family.' },
        { text: 'Na de lunch namen ze de trein terug naar huis.', translation: 'After lunch they took the train back home.' },
        { text: 'In de trein waren ze allebei stil en moe.', translation: 'On the train they were both quiet and tired.' },
        { text: 'Maar het was een geweldig weekend geweest.', translation: 'But it had been a wonderful weekend.' },
        { text: 'Ze spraken al over hun volgende reis.', translation: 'They were already talking about their next trip.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Hoe lang duurde de reis naar {city}?', answer: 'Twee uur.', options: ['Een uur.', 'Twee uur.', 'Drie uur.', 'Vier uur.'] },
      { type: 'fill_blank', question: 'In het restaurant bestelden ze {food} en een glas ___.', answer: 'wijn' },
      { type: 'true_false', question: '{name} en {name2} waren teleurgesteld over het hotel.', answer: 'Onwaar. Ze waren blij met hun keuze.', correctBool: false },
      { type: 'open', question: 'Wat deden {name} en {name2} op zaterdagavond?', answer: 'Ze gingen naar een restaurant en wandelden daarna langs de verlichte grachten.' },
    ],
  },
  // ── A2 — Market ──────────────────────────────────────────────────────────────
  {
    titleTemplate: 'De Boerenmarkt van {city}',
    level: 'A2',
    topic: 'market',
    paragraphs: [
      { sentences: [
        { text: 'Elke {season} is er een grote boerenmarkt in {city}.', translation: 'Every {season} there is a large farmers\' market in {city}.' },
        { text: '{name} werkt als {job} maar helpt in het weekend op de markt.', translation: '{name} works as a {job} but helps at the market at the weekend.' },
        { text: 'Zijn familie heeft al jaren een kraam op de markt.', translation: 'His family has had a stall at the market for years.' },
        { text: 'Ze verkopen verse groenten en fruit uit eigen tuin.', translation: 'They sell fresh vegetables and fruit from their own garden.' },
        { text: '{name} vindt het leuk om klanten te helpen.', translation: '{name} enjoys helping customers.' },
      ]},
      { sentences: [
        { text: 'Op de marktdag staat {name} om zes uur op.', translation: 'On market day {name} gets up at six o\'clock.' },
        { text: 'Hij helpt de kraam op te bouwen.', translation: 'He helps to set up the stall.' },
        { text: 'De producten worden mooi uitgestald.', translation: 'The products are displayed attractively.' },
        { text: 'Om negen uur opent de markt.', translation: 'At nine o\'clock the market opens.' },
        { text: 'Al snel komen de eerste klanten.', translation: 'Soon the first customers arrive.' },
        { text: '{name} begroet iedereen vriendelijk.', translation: '{name} greets everyone in a friendly manner.' },
      ]},
      { sentences: [
        { text: 'Een klant vraagt naar de prijs van de tomaten.', translation: 'A customer asks about the price of the tomatoes.' },
        { text: '{name} legt uit dat ze twee euro per kilo kosten.', translation: '{name} explains that they cost two euros per kilo.' },
        { text: 'De klant koopt een kilo en is tevreden.', translation: 'The customer buys a kilo and is satisfied.' },
        { text: 'Later komt een vrouw die {food} wil kopen.', translation: 'Later a woman comes who wants to buy {food}.' },
        { text: '{name} helpt haar met een glimlach.', translation: '{name} helps her with a smile.' },
        { text: 'Ze bedankt hem en komt elke week terug.', translation: 'She thanks him and comes back every week.' },
      ]},
      { sentences: [
        { text: 'In de middag is de markt het drukst.', translation: 'In the afternoon the market is busiest.' },
        { text: 'Er zijn honderden mensen.', translation: 'There are hundreds of people.' },
        { text: '{name} werkt hard om iedereen te helpen.', translation: '{name} works hard to help everyone.' },
        { text: 'Hij weegt de groenten en rekent de prijzen uit.', translation: 'He weighs the vegetables and calculates the prices.' },
        { text: 'Zijn collega {name2} helpt ook mee.', translation: 'His colleague {name2} also helps.' },
        { text: 'Samen gaat het werk snel.', translation: 'Together the work goes quickly.' },
      ]},
      { sentences: [
        { text: 'Om vier uur sluit de markt.', translation: 'At four o\'clock the market closes.' },
        { text: '{name} en {name2} ruimen de kraam op.', translation: '{name} and {name2} clear up the stall.' },
        { text: 'Ze zijn moe maar tevreden.', translation: 'They are tired but satisfied.' },
        { text: 'Ze hebben bijna alles verkocht.', translation: 'They have sold almost everything.' },
        { text: 'De overgebleven groenten geven ze aan de voedselbank.', translation: 'The remaining vegetables they give to the food bank.' },
        { text: '{name} is trots op zijn familie en hun werk op de markt.', translation: '{name} is proud of his family and their work at the market.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Hoe laat opent de markt?', answer: 'Om negen uur.', options: ['Om zeven uur.', 'Om acht uur.', 'Om negen uur.', 'Om tien uur.'] },
      { type: 'fill_blank', question: 'De tomaten kosten twee euro per ___.', answer: 'kilo' },
      { type: 'true_false', question: '{name} werkt elke dag op de markt.', answer: 'Onwaar. {name} helpt alleen in het weekend op de markt.', correctBool: false },
      { type: 'open', question: 'Wat doen {name} en {name2} met de overgebleven groenten?', answer: 'Ze geven de overgebleven groenten aan de voedselbank.' },
    ],
  },
  // ── A2 — Dutch culture ───────────────────────────────────────────────────────
  {
    titleTemplate: 'Sinterklaas in {city}',
    level: 'A2',
    topic: 'Dutch culture',
    paragraphs: [
      { sentences: [
        { text: 'In {month} is het Sinterklaasfeest in Nederland.', translation: 'In {month} it is the Sinterklaas celebration in the Netherlands.' },
        { text: '{name} woont in {city} en viert Sinterklaas met zijn familie.', translation: '{name} lives in {city} and celebrates Sinterklaas with his family.' },
        { text: 'Sinterklaas is een oud en geliefd feest.', translation: 'Sinterklaas is an old and beloved celebration.' },
        { text: 'Kinderen zetten hun schoen bij de open haard.', translation: 'Children put their shoe by the fireplace.' },
        { text: 'Ze hopen op cadeautjes van Sinterklaas.', translation: 'They hope for presents from Sinterklaas.' },
      ]},
      { sentences: [
        { text: 'Een paar weken voor het feest komt Sinterklaas aan in Nederland.', translation: 'A few weeks before the celebration Sinterklaas arrives in the Netherlands.' },
        { text: 'Hij komt met zijn boot vanuit Spanje.', translation: 'He comes by boat from Spain.' },
        { text: 'In {city} is er een grote intocht.', translation: 'In {city} there is a big arrival parade.' },
        { text: '{name} gaat met zijn neefje naar de intocht kijken.', translation: '{name} goes with his nephew to watch the arrival.' },
        { text: 'Er zijn veel mensen op straat.', translation: 'There are many people in the street.' },
        { text: 'De kinderen zijn erg opgewonden.', translation: 'The children are very excited.' },
      ]},
      { sentences: [
        { text: 'Thuis maakt de familie van {name} pepernoten.', translation: 'At home {name}\'s family makes pepernoten (spiced biscuits).' },
        { text: 'Pepernoten zijn kleine, ronde koekjes met specerijen.', translation: 'Pepernoten are small, round biscuits with spices.' },
        { text: 'Ze ruiken heerlijk als ze uit de oven komen.', translation: 'They smell wonderful when they come out of the oven.' },
        { text: '{name} helpt zijn moeder in de keuken.', translation: '{name} helps his mother in the kitchen.' },
        { text: 'Ze maken ook chocoladeletters.', translation: 'They also make chocolate letters.' },
        { text: 'Elke persoon krijgt de letter van zijn naam.', translation: 'Each person gets the letter of their name.' },
      ]},
      { sentences: [
        { text: 'Op de avond van vijf december is het Sinterklaasavond.', translation: 'On the evening of the fifth of December it is Sinterklaas Eve.' },
        { text: 'De familie komt samen bij {name} thuis.', translation: 'The family comes together at {name}\'s home.' },
        { text: 'Er zijn cadeautjes voor iedereen.', translation: 'There are presents for everyone.' },
        { text: 'Bij elk cadeau hoort een gedicht.', translation: 'With each present there is a poem.' },
        { text: 'De gedichten zijn grappig en persoonlijk.', translation: 'The poems are funny and personal.' },
        { text: '{name} leest zijn gedicht hardop voor.', translation: '{name} reads his poem aloud.' },
      ]},
      { sentences: [
        { text: 'Na het uitpakken eten ze samen {food}.', translation: 'After unwrapping they eat {food} together.' },
        { text: 'Ze drinken warme chocolademelk.', translation: 'They drink hot chocolate milk.' },
        { text: 'Het is een gezellige avond.', translation: 'It is a cosy evening.' },
        { text: '{name} vindt Sinterklaas het mooiste feest van het jaar.', translation: '{name} thinks Sinterklaas is the most beautiful celebration of the year.' },
        { text: 'Het brengt de familie bij elkaar.', translation: 'It brings the family together.' },
        { text: 'Volgend jaar kijkt hij er al naar uit.', translation: 'He is already looking forward to next year.' },
      ]},
    ],
    questions: [
      { type: 'multiple_choice', question: 'Waar komt Sinterklaas vandaan?', answer: 'Uit Spanje.', options: ['Uit Duitsland.', 'Uit Spanje.', 'Uit België.', 'Uit Engeland.'] },
      { type: 'fill_blank', question: 'Bij elk cadeau hoort een ___.', answer: 'gedicht' },
      { type: 'true_false', question: 'Pepernoten zijn grote, vierkante koekjes.', answer: 'Onwaar. Pepernoten zijn kleine, ronde koekjes met specerijen.', correctBool: false },
      { type: 'open', question: 'Waarom vindt {name} Sinterklaas het mooiste feest?', answer: '{name} vindt Sinterklaas het mooiste feest omdat het de familie bij elkaar brengt.' },
    ],
  },
];

/**
 * Generate a unique story from a template by filling in random variables.
 * Returns null if no suitable template is found (shouldn't happen).
 */
function generateProceduralStory(
  level: 'A1' | 'A2',
  topic: string,
  existingTitles: string[]
): Story | null {
  const normalised = existingTitles.map((t) => t.toLowerCase().trim());

  // Find templates matching level + topic
  let templates = STORY_TEMPLATES.filter(
    (t) => t.level === level && t.topic === topic
  );

  // Relax topic if needed
  if (templates.length === 0) {
    templates = STORY_TEMPLATES.filter((t) => t.level === level);
  }

  // Relax level if still nothing
  if (templates.length === 0) {
    templates = [...STORY_TEMPLATES];
  }

  if (templates.length === 0) return null;

  // Try up to 20 times to generate a story with a unique title
  for (let attempt = 0; attempt < 20; attempt++) {
    const template = pick(templates);
    const vars = makeVars();

    const title = fill(template.titleTemplate, vars);
    if (normalised.includes(title.toLowerCase().trim())) continue;

    // Build the story
    const story: Story = {
      id: generateId(),
      title,
      level: template.level,
      topic: template.topic,
      paragraphs: template.paragraphs.map((p) => ({
        id: generateId(),
        sentences: p.sentences.map((s) => ({
          id: generateId(),
          text: fill(s.text, vars),
          translation: fill(s.translation, vars),
        })),
      })),
      questions: template.questions.map((q) => ({
        id: generateId(),
        type: q.type,
        question: fill(q.question, vars),
        answer: fill(q.answer, vars),
        ...(q.options ? { options: q.options.map((o) => fill(o, vars)) } : {}),
        ...(q.correctBool !== undefined ? { correctBool: q.correctBool } : {}),
      })),
    };

    return story;
  }

  return null;
}

// Get a single fallback story matching level/topic, excluding already-seen titles
function getDefaultStory(
  level: 'A1' | 'A2',
  topic: string | undefined,
  existingTitles: string[]
): Story {
  const normalised = existingTitles.map((t) => t.toLowerCase().trim());

  // Filter by level + topic first
  let candidates = STORY_POOL.filter(
    (s) =>
      s.level === level &&
      (!topic || s.topic === topic) &&
      !normalised.includes(s.title.toLowerCase().trim())
  );

  // Relax topic constraint if nothing found
  if (candidates.length === 0) {
    candidates = STORY_POOL.filter(
      (s) => s.level === level && !normalised.includes(s.title.toLowerCase().trim())
    );
  }

  // Relax level constraint if still nothing found
  if (candidates.length === 0) {
    candidates = STORY_POOL.filter(
      (s) => !normalised.includes(s.title.toLowerCase().trim())
    );
  }

  // If all stories have been seen, allow repeats
  if (candidates.length === 0) {
    candidates = [...STORY_POOL];
  }

  // Shuffle and pick one
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  return hydrateStory(shuffled[0]);
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI story generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateStoryWithOpenAI(
  level: 'A1' | 'A2',
  topic: string,
  existingTitles: string[]
): Promise<Story | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const levelDesc =
    level === 'A1'
      ? 'A1 beginner (very simple vocabulary, short sentences, present tense)'
      : 'A2 elementary (simple vocabulary, some past tense, slightly longer sentences)';

  const avoidTitles =
    existingTitles.length > 0
      ? `Do NOT use any of these titles: ${existingTitles.join(', ')}.`
      : '';

  const prompt = `You are a Dutch language teacher creating a reading story for learners.

Write ONE Dutch story at ${levelDesc} level about the topic: "${topic}".

Requirements:
- The story MUST be at least 500 words in Dutch
- 5 to 6 paragraphs, each with 5 to 8 sentences
- Each sentence must have an English translation
- Include exactly 4 comprehension questions in Dutch, one of each type:
  1. "multiple_choice" — provide 4 options (one correct), field "options": ["...", "...", "...", "..."]
  2. "fill_blank" — sentence with ___ for the missing word, field "answer" is the missing word
  3. "true_false" — a statement that is true or false, field "correctBool": true or false, "answer" explains why
  4. "open" — open-ended question with a full sentence answer
- The story should be realistic, engaging, and culturally relevant to the Netherlands
- ${avoidTitles}

Respond ONLY with valid JSON in this exact format:
{
  "title": "Story title in Dutch",
  "paragraphs": [
    {
      "sentences": [
        { "text": "Dutch sentence.", "translation": "English translation." }
      ]
    }
  ],
  "questions": [
    { "type": "multiple_choice", "question": "Dutch question?", "answer": "Correct option text.", "options": ["Option A.", "Option B.", "Option C.", "Option D."] },
    { "type": "fill_blank", "question": "Dutch sentence with ___ blank.", "answer": "missing word" },
    { "type": "true_false", "question": "Dutch statement.", "answer": "Waar/Onwaar. Explanation.", "correctBool": true },
    { "type": "open", "question": "Dutch question?", "answer": "Full Dutch answer." }
  ]
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const story: Story = {
      id: generateId(),
      title: parsed.title || 'Onbekend verhaal',
      level,
      topic,
      paragraphs: (parsed.paragraphs || []).map((p: { sentences: { text: string; translation: string }[] }) => ({
        id: generateId(),
        sentences: (p.sentences || []).map((s: { text: string; translation: string }) => ({
          id: generateId(),
          text: s.text,
          translation: s.translation,
        })),
      })),
      questions: (parsed.questions || []).map((q: { type?: string; question: string; answer: string; options?: string[]; correctBool?: boolean }) => ({
        id: generateId(),
        type: (q.type as QuestionType) || 'open',
        question: q.question,
        answer: q.answer,
        ...(q.options ? { options: q.options } : {}),
        ...(q.correctBool !== undefined ? { correctBool: q.correctBool } : {}),
      })),
    };

    return story;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const level: 'A1' | 'A2' = body.level || 'A1';
    const topic: string = body.topic || 'daily life';
    const existingTitles: string[] = body.existingTitles || [];

    // Try OpenAI first
    const aiStory = await generateStoryWithOpenAI(level, topic, existingTitles);

    if (aiStory) {
      return NextResponse.json({ story: aiStory });
    }

    // Try procedural generation (unique stories from templates, no API key needed)
    const proceduralStory = generateProceduralStory(level, topic, existingTitles);
    if (proceduralStory) {
      return NextResponse.json({ story: proceduralStory });
    }

    // Last resort: pre-written static pool (may repeat if all seen)
    const fallbackStory = getDefaultStory(level, topic, existingTitles);
    return NextResponse.json({ story: fallbackStory });
  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    );
  }
}
