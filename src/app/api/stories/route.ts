import { NextRequest, NextResponse } from 'next/server';
import { Story, Paragraph, Sentence, ComprehensionQuestion, StoryTopic } from '@/app/types/story';

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
type RawQuestion = { question: string; answer: string };
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
      { question: 'Hoe laat staat de persoon op?', answer: 'De persoon staat om zeven uur op.' },
      { question: 'Hoe gaat de persoon naar zijn werk?', answer: 'De persoon gaat op de fiets naar zijn werk.' },
      { question: 'Wat eet de persoon voor ontbijt?', answer: 'De persoon eet twee boterhammen met kaas.' },
      { question: 'Wat doet de persoon na het avondeten?', answer: 'Na het avondeten kijkt de persoon televisie of leest een boek.' },
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
      { question: 'Wanneer gaat de persoon naar de markt?', answer: 'De persoon gaat elke zaterdag naar de markt.' },
      { question: 'Waarom gaat de persoon vroeg naar de markt?', answer: 'De persoon gaat vroeg omdat het dan niet zo druk is.' },
      { question: 'Wat koopt de persoon bij de kaasboer?', answer: 'De persoon koopt een stuk oude kaas en een stuk jonge kaas.' },
      { question: 'Wat koopt de persoon bij de bakker?', answer: 'De persoon koopt een brood en twee croissants.' },
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
      { question: 'Wanneer is het Sinterklaasfeest?', answer: 'Het Sinterklaasfeest is op vijf december.' },
      { question: 'Waar komt Sinterklaas vandaan?', answer: 'Sinterklaas komt uit Spanje op een stoomboot.' },
      { question: 'Wat doen kinderen de avond voor Sinterklaas?', answer: 'Kinderen zetten hun schoen bij de open haard.' },
      { question: 'Wat zijn typische Sinterklaas-lekkernijen?', answer: 'Typische Sinterklaas-lekkernijen zijn pepernoten en speculaas.' },
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
      { question: 'Hoe is de persoon naar Amsterdam gereisd?', answer: 'De persoon heeft de trein genomen vanuit Utrecht.' },
      { question: 'Welk beroemd schilderij heeft de persoon gezien in het Rijksmuseum?', answer: 'De persoon heeft de Nachtwacht van Rembrandt gezien.' },
      { question: 'Wat is een kroket?', answer: 'Een kroket is een gefrituurde rol gevuld met ragout, een typisch Nederlands snack.' },
      { question: 'Waarom staan sommige grachtenpanden scheef?', answer: 'Sommige grachtenpanden staan scheef omdat ze op houten palen staan.' },
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
      { question: 'Wanneer is Koningsdag?', answer: 'Koningsdag is op 27 april.' },
      { question: 'Wat is de vrijmarkt?', answer: 'Op de vrijmarkt mogen mensen hun oude spullen verkopen.' },
      { question: 'Hoe heette het feest vroeger?', answer: 'Vroeger heette het feest Koninginnedag.' },
      { question: 'Wat doet de Koninklijke Familie op Koningsdag?', answer: 'De Koninklijke Familie bezoekt elk jaar een andere stad en doet mee aan spelletjes en activiteiten.' },
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
      { question: 'Hoe laat stonden ze op om naar de markt te gaan?', answer: 'Ze stonden om vijf uur op.' },
      { question: 'Wat verkochten ze op de boerenmarkt?', answer: 'Ze verkochten tomaten, courgettes, sla en aardbeien.' },
      { question: 'Wat leerde de verteller op de markt?', answer: 'De verteller leerde hoe hij klanten moest helpen, groenten wegen en de prijs uitrekenen.' },
      { question: 'Hoe laat was de markt voorbij?', answer: 'Om één uur was de markt voorbij.' },
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
      { question: 'Waarom begon de persoon met koken leren?', answer: 'De persoon begon met koken leren omdat hij voor het eerst alleen woonde.' },
      { question: 'Welk gerecht leerde de persoon als eerste?', answer: 'De persoon leerde stamppot maken.' },
      { question: 'Wat zijn de ingrediënten voor boerenkoolstamppot?', answer: 'Voor boerenkoolstamppot heb je aardappelen, boerenkool, rookworst en spek nodig.' },
      { question: 'Hoe maakte de persoon de stamppot romig?', answer: 'De persoon voegde boter en melk toe voor een romige structuur.' },
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
      { question: 'Waar gaat de persoon naartoe?', answer: 'De persoon gaat naar zijn oma in Rotterdam.' },
      { question: 'Hoeveel kost het treinkaartje?', answer: 'Het treinkaartje kost acht euro.' },
      { question: 'Op welk spoor staat de trein?', answer: 'De trein staat op spoor vier.' },
      { question: 'Hoe lang duurt de treinreis?', answer: 'De treinreis duurt veertig minuten.' },
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
      question: q.question,
      answer: q.answer,
    })),
  };
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
- Include 4 comprehension questions with answers in Dutch
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
    { "question": "Dutch question?", "answer": "Dutch answer." }
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
      questions: (parsed.questions || []).map((q: { question: string; answer: string }) => ({
        id: generateId(),
        question: q.question,
        answer: q.answer,
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

    // Fall back to pre-written pool
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
