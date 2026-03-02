import { NextRequest, NextResponse } from 'next/server';
import { Story, StoryTopic } from '@/app/types/story';

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
  question: string;
  answer: string;
  options: string[];
};
type RawStory = {
  title: string;
  level: 'A1' | 'A2' | 'B1' | 'B2';
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
        question: 'Hoe laat staat de persoon op?',
        answer: 'Om zeven uur.',
        options: ['Om zes uur.', 'Om zeven uur.', 'Om acht uur.', 'Om negen uur.'],
      },
      {
        question: 'Hoe gaat de persoon naar zijn werk?',
        answer: 'Op de fiets.',
        options: ['Met de auto.', 'Met de bus.', 'Op de fiets.', 'Met de trein.'],
      },
      {
        question: 'Wat eet de persoon voor ontbijt?',
        answer: 'Twee boterhammen met kaas.',
        options: ['Twee boterhammen met kaas.', 'Yoghurt met fruit.', 'Cornflakes met melk.', 'Een ei met toast.'],
      },
      {
        question: 'Wat eet de persoon voor lunch?',
        answer: 'Een broodje met ham en sla.',
        options: ['Een broodje met kaas.', 'Een broodje met ham en sla.', 'Een salade.', 'Soep.'],
      },
      {
        question: 'Wat doet de persoon na het avondeten?',
        answer: 'Televisie kijken of een boek lezen.',
        options: ['Sporten.', 'Televisie kijken of een boek lezen.', 'Naar vrienden gaan.', 'Muziek luisteren.'],
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
        question: 'Wanneer gaat de persoon naar de markt?',
        answer: 'Elke zaterdag.',
        options: ['Elke vrijdag.', 'Elke zaterdag.', 'Elke zondag.', 'Elke maandag.'],
      },
      {
        question: 'Waarom gaat de persoon vroeg naar de markt?',
        answer: 'Omdat het dan niet zo druk is.',
        options: ['Omdat de prijzen dan lager zijn.', 'Omdat het dan niet zo druk is.', 'Omdat de markt vroeg sluit.', 'Omdat hij daarna moet werken.'],
      },
      {
        question: 'Wat koopt de persoon bij de kaasboer?',
        answer: 'Een stuk oude kaas en een stuk jonge kaas.',
        options: ['Alleen oude kaas.', 'Alleen jonge kaas.', 'Een stuk oude kaas en een stuk jonge kaas.', 'Brie en camembert.'],
      },
      {
        question: 'Wat koopt de persoon bij de bakker?',
        answer: 'Een brood en twee croissants.',
        options: ['Twee broden.', 'Een brood en twee croissants.', 'Drie croissants.', 'Een taart.'],
      },
      {
        question: 'Wat vindt de persoon van de markt?',
        answer: 'Het is zijn favoriete plek op zaterdag.',
        options: ['Het is te duur.', 'Het is zijn favoriete plek op zaterdag.', 'Het is te druk.', 'Het is saai.'],
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
        question: 'Wanneer is het Sinterklaasfeest?',
        answer: 'Op vijf december.',
        options: ['Op vijf november.', 'Op vijf december.', 'Op vijfentwintig december.', 'Op zes januari.'],
      },
      {
        question: 'Waar komt Sinterklaas vandaan?',
        answer: 'Uit Spanje.',
        options: ['Uit Engeland.', 'Uit Spanje.', 'Uit Duitsland.', 'Uit België.'],
      },
      {
        question: 'Wat zetten kinderen bij de open haard?',
        answer: 'Hun schoen.',
        options: ['Hun sok.', 'Hun schoen.', 'Een mand.', 'Een zak.'],
      },
      {
        question: 'Wat zijn typische Sinterklaas-lekkernijen?',
        answer: 'Pepernoten en speculaas.',
        options: ['Oliebollen en appeltaart.', 'Pepernoten en speculaas.', 'Stroopwafels en drop.', 'Chocolade en snoep.'],
      },
      {
        question: 'Wat hoort er bij elk cadeau op Sinterklaasavond?',
        answer: 'Een gedicht.',
        options: ['Een kaart.', 'Een gedicht.', 'Een brief.', 'Een lied.'],
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
        question: 'Hoe is de persoon naar Amsterdam gereisd?',
        answer: 'Met de trein vanuit Utrecht.',
        options: ['Met de bus vanuit Den Haag.', 'Met de trein vanuit Utrecht.', 'Met de auto vanuit Rotterdam.', 'Met de fiets vanuit Haarlem.'],
      },
      {
        question: 'Welk schilderij heeft de persoon gezien in het Rijksmuseum?',
        answer: 'De Nachtwacht van Rembrandt.',
        options: ['Het Melkmeisje van Vermeer.', 'De Nachtwacht van Rembrandt.', 'De Zonnebloemen van Van Gogh.', 'De Aardappeleters van Van Gogh.'],
      },
      {
        question: 'Wat is een kroket?',
        answer: 'Een gefrituurde rol gevuld met ragout.',
        options: ['Een soort kaas.', 'Een gefrituurde rol gevuld met ragout.', 'Een broodje met vlees.', 'Een soort koekje.'],
      },
      {
        question: 'Waarom staan sommige grachtenpanden scheef?',
        answer: 'Omdat ze op houten palen staan.',
        options: ['Omdat ze oud zijn.', 'Omdat ze op houten palen staan.', 'Omdat de grond zacht is.', 'Omdat ze slecht gebouwd zijn.'],
      },
      {
        question: 'Waar heeft de persoon gegeten op zaterdagavond?',
        answer: 'In een Indonesisch restaurant in de Jordaan.',
        options: ['In een Frans restaurant.', 'In een Indonesisch restaurant in de Jordaan.', 'In een café bij de gracht.', 'In het hotel.'],
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
        question: 'Wanneer is Koningsdag?',
        answer: 'Op 27 april.',
        options: ['Op 30 april.', 'Op 27 april.', 'Op 5 mei.', 'Op 15 augustus.'],
      },
      {
        question: 'Wat is de vrijmarkt?',
        answer: 'Een markt waar mensen hun oude spullen mogen verkopen.',
        options: ['Een gratis markt met cadeaus.', 'Een markt waar mensen hun oude spullen mogen verkopen.', 'Een markt alleen voor kinderen.', 'Een markt met alleen voedsel.'],
      },
      {
        question: 'Hoe heette het feest vroeger?',
        answer: 'Koninginnedag.',
        options: ['Koningsdag.', 'Koninginnedag.', 'Prinsessedag.', 'Oranjefest.'],
      },
      {
        question: 'Wat doet de Koninklijke Familie op Koningsdag?',
        answer: 'Ze bezoeken elk jaar een andere stad en doen mee aan spelletjes.',
        options: ['Ze blijven in het paleis.', 'Ze bezoeken elk jaar een andere stad en doen mee aan spelletjes.', 'Ze geven een toespraak op televisie.', 'Ze organiseren een concert.'],
      },
      {
        question: 'Wanneer veranderde de naam van Koninginnedag naar Koningsdag?',
        answer: 'In 2013, toen Willem-Alexander Koning werd.',
        options: ['In 2000.', 'In 2013, toen Willem-Alexander Koning werd.', 'In 2020.', 'In 1980.'],
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
        question: 'Hoe laat stonden ze op om naar de markt te gaan?',
        answer: 'Om vijf uur.',
        options: ['Om drie uur.', 'Om vier uur.', 'Om vijf uur.', 'Om zes uur.'],
      },
      {
        question: 'Welke producten verkochten ze op de boerenmarkt?',
        answer: 'Tomaten, courgettes, sla en aardbeien.',
        options: ['Appels, peren en druiven.', 'Tomaten, courgettes, sla en aardbeien.', 'Kaas, brood en vlees.', 'Bloemen en planten.'],
      },
      {
        question: 'Hoe laat was de markt voorbij?',
        answer: 'Om één uur.',
        options: ['Om twaalf uur.', 'Om één uur.', 'Om twee uur.', 'Om drie uur.'],
      },
      {
        question: 'Wat leerde de verteller op de markt?',
        answer: 'Hoe hij klanten moest helpen, groenten wegen en de prijs uitrekenen.',
        options: ['Hoe hij groenten moest kweken.', 'Hoe hij klanten moest helpen, groenten wegen en de prijs uitrekenen.', 'Hoe hij een kraam moest bouwen.', 'Hoe hij reclame moest maken.'],
      },
      {
        question: 'Wat deed de oom met de overgebleven producten?',
        answer: 'Hij nam ze mee terug naar de boerderij.',
        options: ['Hij gooide ze weg.', 'Hij nam ze mee terug naar de boerderij.', 'Hij gaf ze aan klanten.', 'Hij verkocht ze goedkoper.'],
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
        question: 'Waarom begon de persoon met koken leren?',
        answer: 'Omdat hij voor het eerst alleen woonde.',
        options: ['Omdat hij een cursus volgde.', 'Omdat hij voor het eerst alleen woonde.', 'Omdat zijn oma ziek was.', 'Omdat hij een restaurant wilde openen.'],
      },
      {
        question: 'Welk gerecht leerde de persoon als eerste?',
        answer: 'Stamppot.',
        options: ['Erwtensoep.', 'Stamppot.', 'Bitterballen.', 'Pannenkoeken.'],
      },
      {
        question: 'Welke ingrediënten heb je nodig voor boerenkoolstamppot?',
        answer: 'Aardappelen, boerenkool, rookworst en spek.',
        options: ['Aardappelen, wortels en uien.', 'Aardappelen, boerenkool, rookworst en spek.', 'Rijst, groenten en kip.', 'Pasta, tomatensaus en kaas.'],
      },
      {
        question: 'Hoe maakte de persoon de stamppot romig?',
        answer: 'Door boter en melk toe te voegen.',
        options: ['Door room toe te voegen.', 'Door boter en melk toe te voegen.', 'Door kaas toe te voegen.', 'Door olie toe te voegen.'],
      },
      {
        question: 'Wie gaf de persoon het recept voor stamppot?',
        answer: 'Zijn oma.',
        options: ['Zijn moeder.', 'Zijn oma.', 'Een kookboek.', 'Een vriend.'],
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
        question: 'Waar gaat de persoon naartoe?',
        answer: 'Naar zijn oma in Rotterdam.',
        options: ['Naar zijn oma in Amsterdam.', 'Naar zijn oma in Rotterdam.', 'Naar zijn oma in Utrecht.', 'Naar zijn oma in Den Haag.'],
      },
      {
        question: 'Hoeveel kost het treinkaartje?',
        answer: 'Acht euro.',
        options: ['Vijf euro.', 'Acht euro.', 'Tien euro.', 'Twaalf euro.'],
      },
      {
        question: 'Op welk spoor staat de trein?',
        answer: 'Spoor vier.',
        options: ['Spoor één.', 'Spoor twee.', 'Spoor drie.', 'Spoor vier.'],
      },
      {
        question: 'Hoe lang duurt de treinreis?',
        answer: 'Veertig minuten.',
        options: ['Twintig minuten.', 'Dertig minuten.', 'Veertig minuten.', 'Een uur.'],
      },
      {
        question: 'Wie wacht de persoon op op het perron in Rotterdam?',
        answer: 'Zijn oma.',
        options: ['Zijn moeder.', 'Zijn oma.', 'Een vriend.', 'Zijn vader.'],
      },
    ],
  },
  // ── A2 — Daily life (inburgering: healthcare) ────────────────────────────────
  {
    title: 'Een Afspraak bij de Huisarts',
    level: 'A2',
    topic: 'daily life',
    paragraphs: [
      {
        sentences: [
          { text: 'In Nederland heeft bijna iedereen een vaste huisarts.', translation: 'In the Netherlands almost everyone has a regular GP.' },
          { text: 'De huisarts is de eerste dokter die je bezoekt als je ziek bent.', translation: 'The GP is the first doctor you visit when you are ill.' },
          { text: 'Als je nieuw bent in Nederland, moet je je inschrijven bij een huisartsenpraktijk.', translation: 'If you are new to the Netherlands, you must register at a GP practice.' },
          { text: 'Je kunt je inschrijven door naar de praktijk te gaan of te bellen.', translation: 'You can register by going to the practice or by calling.' },
          { text: 'Je hebt je BSN-nummer en je identiteitsbewijs nodig.', translation: 'You need your BSN number and your identity document.' },
          { text: 'Het BSN is een persoonlijk nummer dat de overheid aan elke inwoner geeft.', translation: 'The BSN is a personal number that the government gives to every resident.' },
        ],
      },
      {
        sentences: [
          { text: 'Fatima woont al twee jaar in Nederland.', translation: 'Fatima has been living in the Netherlands for two years.' },
          { text: 'Vorige week voelde ze zich niet goed.', translation: 'Last week she did not feel well.' },
          { text: 'Ze had keelpijn en koorts.', translation: 'She had a sore throat and a fever.' },
          { text: 'Ze belde de huisartsenpraktijk om een afspraak te maken.', translation: 'She called the GP practice to make an appointment.' },
          { text: 'De assistente vroeg wat er aan de hand was.', translation: 'The assistant asked what was wrong.' },
          { text: 'Fatima legde haar klachten uit in het Nederlands.', translation: 'Fatima explained her complaints in Dutch.' },
          { text: 'Ze kreeg een afspraak voor de volgende ochtend om tien uur.', translation: 'She got an appointment for the following morning at ten o\'clock.' },
        ],
      },
      {
        sentences: [
          { text: 'De volgende ochtend ging Fatima naar de praktijk.', translation: 'The following morning Fatima went to the practice.' },
          { text: 'Ze meldde zich aan bij de balie.', translation: 'She checked in at the reception desk.' },
          { text: 'De assistente vroeg haar naam en geboortedatum.', translation: 'The assistant asked her name and date of birth.' },
          { text: 'Fatima wachtte in de wachtkamer.', translation: 'Fatima waited in the waiting room.' },
          { text: 'Er lagen tijdschriften op tafel en er speelde zachte muziek.', translation: 'There were magazines on the table and soft music was playing.' },
          { text: 'Na tien minuten riep de dokter haar naam.', translation: 'After ten minutes the doctor called her name.' },
        ],
      },
      {
        sentences: [
          { text: 'De huisarts heette dokter Van der Berg.', translation: 'The GP was called doctor Van der Berg.' },
          { text: 'Hij stelde Fatima een paar vragen over haar klachten.', translation: 'He asked Fatima a few questions about her complaints.' },
          { text: 'Hoe lang had ze al koorts? Had ze ook hoofdpijn?', translation: 'How long had she had a fever? Did she also have a headache?' },
          { text: 'Daarna bekeek hij haar keel met een lampje.', translation: 'Then he examined her throat with a small light.' },
          { text: 'Hij luisterde ook naar haar longen met een stethoscoop.', translation: 'He also listened to her lungs with a stethoscope.' },
          { text: 'De dokter zei dat ze een keelontsteking had.', translation: 'The doctor said she had a throat infection.' },
          { text: 'Hij schreef een recept voor antibiotica.', translation: 'He wrote a prescription for antibiotics.' },
        ],
      },
      {
        sentences: [
          { text: 'Fatima ging met het recept naar de apotheek.', translation: 'Fatima went to the pharmacy with the prescription.' },
          { text: 'De apotheker legde uit hoe ze de medicijnen moest innemen.', translation: 'The pharmacist explained how she should take the medication.' },
          { text: 'Ze moest drie keer per dag een tablet nemen, bij voorkeur bij het eten.', translation: 'She had to take one tablet three times a day, preferably with food.' },
          { text: 'Ze mocht de kuur niet eerder stoppen, ook al voelde ze zich beter.', translation: 'She was not allowed to stop the course early, even if she felt better.' },
          { text: 'De apotheker gaf haar ook een informatieblad over de bijwerkingen.', translation: 'The pharmacist also gave her an information sheet about the side effects.' },
        ],
      },
      {
        sentences: [
          { text: 'Na vijf dagen voelde Fatima zich veel beter.', translation: 'After five days Fatima felt much better.' },
          { text: 'Ze had de hele antibioticakuur afgemaakt.', translation: 'She had completed the entire course of antibiotics.' },
          { text: 'Ze was blij dat het Nederlandse zorgsysteem goed werkte.', translation: 'She was glad that the Dutch healthcare system worked well.' },
          { text: 'In Nederland betaal je een eigen risico voor zorgkosten.', translation: 'In the Netherlands you pay an excess for healthcare costs.' },
          { text: 'Het eigen risico is elk jaar een vast bedrag.', translation: 'The excess is a fixed amount each year.' },
          { text: 'Een bezoek aan de huisarts is gratis; je betaalt alleen voor medicijnen en specialisten.', translation: 'A visit to the GP is free; you only pay for medication and specialists.' },
          { text: 'Fatima was tevreden over haar huisarts en zou hem zeker terugzien als ze weer ziek was.', translation: 'Fatima was satisfied with her GP and would certainly see him again if she was ill again.' },
        ],
      },
    ],
    questions: [
      {
        question: 'Wat moet je doen als je nieuw bent in Nederland en een huisarts wilt?',
        answer: 'Je moet je inschrijven bij een huisartsenpraktijk.',
        options: [
          'Je moet naar het ziekenhuis gaan.',
          'Je moet je inschrijven bij een huisartsenpraktijk.',
          'Je moet een verzekering afsluiten.',
          'Je moet een afspraak maken bij een specialist.',
        ],
      },
      {
        question: 'Welke klachten had Fatima?',
        answer: 'Keelpijn en koorts.',
        options: [
          'Hoofdpijn en buikpijn.',
          'Keelpijn en koorts.',
          'Rugpijn en vermoeidheid.',
          'Hoesten en kortademigheid.',
        ],
      },
      {
        question: 'Wat stelde de dokter vast bij Fatima?',
        answer: 'Een keelontsteking.',
        options: [
          'Een longontsteking.',
          'Een keelontsteking.',
          'Een griep.',
          'Een oorontsteking.',
        ],
      },
      {
        question: 'Hoe vaak per dag moest Fatima de antibiotica innemen?',
        answer: 'Drie keer per dag.',
        options: [
          'Één keer per dag.',
          'Twee keer per dag.',
          'Drie keer per dag.',
          'Vier keer per dag.',
        ],
      },
      {
        question: 'Wat is het eigen risico in Nederland?',
        answer: 'Een vast bedrag dat je zelf betaalt voor zorgkosten.',
        options: [
          'Een gratis vergoeding van de overheid.',
          'Een vast bedrag dat je zelf betaalt voor zorgkosten.',
          'De kosten van een bezoek aan de huisarts.',
          'Een maandelijkse premie voor de zorgverzekering.',
        ],
      },
    ],
  },
];

// Hydrate a raw story with generated IDs
function hydrateStory(raw: RawStory): Story {
  return {
    id: generateId(),
    title: raw.title,
    level: raw.level as 'A1' | 'A2' | 'B1' | 'B2',
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
      type: 'multiple_choice' as const,
      question: q.question,
      answer: q.answer,
      options: q.options,
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
  level: 'A1' | 'A2' | 'B1' | 'B2';
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
      { question: 'Wat is het beroep van {name}?', answer: '{job}', options: ['{job}', 'dokter', 'bakker', 'leraar'] },
      { question: 'Hoe gaat {name} naar het werk?', answer: 'Op de fiets.', options: ['Met de auto.', 'Met de bus.', 'Op de fiets.', 'Met de trein.'] },
      { question: 'Wat maakt {name} vanavond voor het avondeten?', answer: '{food}', options: ['{food}', 'stamppot', 'soep', 'pasta'] },
      { question: 'Wat doet {name} in de avond?', answer: '{hobby}', options: ['{hobby}', 'televisie kijken', 'lezen', 'sporten'] },
      { question: 'Hoe laat gaat {name} naar bed?', answer: 'Om tien uur.', options: ['Om negen uur.', 'Om tien uur.', 'Om elf uur.', 'Om twaalf uur.'] },
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
      { question: 'Hoe reist {name} naar {city}?', answer: 'Met de trein.', options: ['Met de auto.', 'Met de trein.', 'Met het vliegtuig.', 'Op de fiets.'] },
      { question: 'Is {name} al eerder in {city} geweest?', answer: 'Nee, het is de eerste keer.', options: ['Ja, meerdere keren.', 'Ja, één keer.', 'Nee, het is de eerste keer.', 'Dat weet hij niet meer.'] },
      { question: 'Wat bestelt {name} in het restaurant?', answer: '{food}', options: ['{food}', 'stamppot', 'soep', 'salade'] },
      { question: 'Wat koopt {name} als souvenir?', answer: 'Een klein schilderijtje.', options: ['Een sleutelhanger.', 'Een klein schilderijtje.', 'Een boek.', 'Een mok.'] },
      { question: 'Hoe voelt {name} zich aan het einde van de dag?', answer: 'Moe maar gelukkig.', options: ['Blij en energiek.', 'Moe maar gelukkig.', 'Teleurgesteld.', 'Ziek.'] },
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
      { question: 'Wanneer gaat {name} naar de markt?', answer: 'Op zaterdag.', options: ['Op maandag.', 'Op woensdag.', 'Op zaterdag.', 'Op zondag.'] },
      { question: 'Hoe zijn de groenten op de markt?', answer: 'Vers en goedkoop.', options: ['Duur maar vers.', 'Vers en goedkoop.', 'Goedkoop maar oud.', 'Duur en oud.'] },
      { question: 'Wat koopt {name} bij de bakker?', answer: 'Vers brood en een stuk {food}.', options: ['Alleen brood.', 'Vers brood en een stuk {food}.', 'Koekjes en taart.', 'Croissants.'] },
      { question: 'Wat doet {name} na het winkelen?', answer: 'Hij drinkt een kop koffie op een terrasje.', options: ['Hij gaat naar huis.', 'Hij drinkt een kop koffie op een terrasje.', 'Hij gaat lunchen.', 'Hij fietst door de stad.'] },
      { question: 'Hoeveel kost de Goudse kaas?', answer: 'Vier euro.', options: ['Twee euro.', 'Drie euro.', 'Vier euro.', 'Vijf euro.'] },
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
      { question: 'Hoe lang duurt de fietstocht van {name} naar zijn werk?', answer: 'Twintig minuten.', options: ['Tien minuten.', 'Twintig minuten.', 'Een half uur.', 'Een uur.'] },
      { question: 'Fietst {name} ook als het regent?', answer: 'Ja, hij heeft een goede regenjas.', options: ['Nee, hij neemt de bus.', 'Nee, hij blijft thuis.', 'Ja, hij heeft een goede regenjas.', 'Ja, maar hij vindt het niet leuk.'] },
      { question: 'Met wie fietst {name} in het weekend?', answer: 'Met zijn vriend {name2}.', options: ['Alleen.', 'Met zijn familie.', 'Met zijn vriend {name2}.', 'Met collega\'s.'] },
      { question: 'Waarom is fietsen goed?', answer: 'Het is goed voor het milieu en het is gezond.', options: ['Het is goedkoop.', 'Het is goed voor het milieu en het is gezond.', 'Het is snel.', 'Het is makkelijk.'] },
      { question: 'Hoe ver is de fietstocht van {name} naar {city2}?', answer: 'Dertig kilometer.', options: ['Tien kilometer.', 'Twintig kilometer.', 'Dertig kilometer.', 'Veertig kilometer.'] },
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
      { question: 'Waarom begon {name} met {hobby}?', answer: 'Omdat hij er altijd al van had gedroomd.', options: ['Omdat zijn baas het vroeg.', 'Omdat hij er altijd al van had gedroomd.', 'Omdat het goedkoop was.', 'Omdat {name2} het ook deed.'] },
      { question: 'Gaf {name} op toen {hobby} moeilijk was?', answer: 'Nee, hij maakte fouten maar gaf niet op.', options: ['Ja, hij stopte meteen.', 'Ja, na een week.', 'Nee, hij maakte fouten maar gaf niet op.', 'Nee, het was nooit moeilijk.'] },
      { question: 'Wat had {name} na drie maanden?', answer: 'Zijn certificaat.', options: ['Een nieuwe baan.', 'Zijn certificaat.', 'Een eigen studio.', 'Veel nieuwe vrienden.'] },
      { question: 'Wat adviseert {name} aan andere mensen?', answer: 'Een nieuwe hobby proberen.', options: ['Meer werken.', 'Een nieuwe hobby proberen.', 'Meer sporten.', 'Cursussen volgen.'] },
      { question: 'Hoeveel kostte de cursus?', answer: 'Vijftig euro.', options: ['Twintig euro.', 'Dertig euro.', 'Vijftig euro.', 'Honderd euro.'] },
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
      { question: 'Hoe lang duurde de reis naar {city}?', answer: 'Twee uur.', options: ['Een uur.', 'Twee uur.', 'Drie uur.', 'Vier uur.'] },
      { question: 'Waren {name} en {name2} tevreden over het hotel?', answer: 'Ja, ze waren blij met hun keuze.', options: ['Nee, het was te duur.', 'Nee, het was te klein.', 'Ja, ze waren blij met hun keuze.', 'Ja, maar het was ver van het centrum.'] },
      { question: 'Wat bestelden ze in het restaurant?', answer: '{food} en een glas wijn.', options: ['{food} en bier.', '{food} en een glas wijn.', 'Soep en brood.', 'Salade en water.'] },
      { question: 'Wat deden {name} en {name2} op zaterdagavond na het eten?', answer: 'Ze wandelden langs de verlichte grachten.', options: ['Ze gingen naar een café.', 'Ze wandelden langs de verlichte grachten.', 'Ze gingen naar een concert.', 'Ze gingen naar het hotel.'] },
      { question: 'Wat deden ze op zondag?', answer: 'Ze bezochten een markt en kochten souvenirs.', options: ['Ze bezochten een museum.', 'Ze bezochten een markt en kochten souvenirs.', 'Ze gingen fietsen.', 'Ze bleven in het hotel.'] },
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
      { question: 'Hoe laat opent de markt?', answer: 'Om negen uur.', options: ['Om zeven uur.', 'Om acht uur.', 'Om negen uur.', 'Om tien uur.'] },
      { question: 'Hoeveel kosten de tomaten?', answer: 'Twee euro per kilo.', options: ['Één euro per kilo.', 'Twee euro per kilo.', 'Drie euro per kilo.', 'Vier euro per kilo.'] },
      { question: 'Wanneer helpt {name} op de markt?', answer: 'In het weekend.', options: ['Elke dag.', 'Doordeweeks.', 'In het weekend.', 'Alleen op zaterdag.'] },
      { question: 'Wat doen {name} en {name2} met de overgebleven groenten?', answer: 'Ze geven ze aan de voedselbank.', options: ['Ze gooien ze weg.', 'Ze nemen ze mee naar huis.', 'Ze geven ze aan de voedselbank.', 'Ze verkopen ze goedkoper.'] },
      { question: 'Hoe laat sluit de markt?', answer: 'Om vier uur.', options: ['Om twee uur.', 'Om drie uur.', 'Om vier uur.', 'Om vijf uur.'] },
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
      { question: 'Waar komt Sinterklaas vandaan?', answer: 'Uit Spanje.', options: ['Uit Duitsland.', 'Uit Spanje.', 'Uit België.', 'Uit Engeland.'] },
      { question: 'Wat hoort er bij elk cadeau?', answer: 'Een gedicht.', options: ['Een kaart.', 'Een gedicht.', 'Een brief.', 'Een lied.'] },
      { question: 'Hoe zijn pepernoten?', answer: 'Klein en rond met specerijen.', options: ['Groot en vierkant.', 'Klein en rond met specerijen.', 'Zacht en zoet.', 'Hard en zout.'] },
      { question: 'Waarom vindt {name} Sinterklaas het mooiste feest?', answer: 'Omdat het de familie bij elkaar brengt.', options: ['Omdat er veel cadeaus zijn.', 'Omdat het de familie bij elkaar brengt.', 'Omdat er lekker eten is.', 'Omdat het een vrije dag is.'] },
      { question: 'Wat drinken ze na het uitpakken?', answer: 'Warme chocolademelk.', options: ['Koffie.', 'Warme chocolademelk.', 'Thee.', 'Limonade.'] },
    ],
  },
  // ── B1 — Healthcare ──────────────────────────────────────────────────────────
  {
    titleTemplate: 'Bij de Huisarts in {city}',
    level: 'B1',
    topic: 'healthcare',
    paragraphs: [
      { sentences: [
        { text: '{name} woont al twee jaar in {city} en heeft een vaste huisarts.', translation: '{name} has lived in {city} for two years and has a regular GP.' },
        { text: 'In Nederland is de huisarts de eerste stap in de gezondheidszorg.', translation: 'In the Netherlands, the GP is the first step in healthcare.' },
        { text: 'Je kunt niet zomaar naar een specialist gaan; je hebt een verwijzing nodig.', translation: 'You cannot just go to a specialist; you need a referral.' },
        { text: '{name} heeft al een tijdje last van hoofdpijn en vermoeidheid.', translation: '{name} has been suffering from headaches and fatigue for a while.' },
        { text: 'Hij besluit een afspraak te maken bij de huisarts.', translation: 'He decides to make an appointment with the GP.' },
      ]},
      { sentences: [
        { text: 'Bij de receptie vraagt {name} om een afspraak.', translation: 'At the reception {name} asks for an appointment.' },
        { text: 'De assistente vraagt naar zijn klachten en hoe lang hij er al last van heeft.', translation: 'The assistant asks about his complaints and how long he has had them.' },
        { text: 'Ze geeft hem een afspraak voor de volgende dag.', translation: 'She gives him an appointment for the next day.' },
        { text: 'In Nederland werkt de huisartsenpraktijk met een triagesysteem.', translation: 'In the Netherlands, the GP practice works with a triage system.' },
        { text: 'Spoedeisende klachten worden dezelfde dag behandeld.', translation: 'Urgent complaints are treated the same day.' },
        { text: 'Minder urgente klachten krijgen een afspraak binnen een paar dagen.', translation: 'Less urgent complaints get an appointment within a few days.' },
      ]},
      { sentences: [
        { text: 'De volgende dag zit {name} in de wachtkamer.', translation: 'The next day {name} sits in the waiting room.' },
        { text: 'De huisarts roept hem na tien minuten.', translation: 'The GP calls him after ten minutes.' },
        { text: 'De arts luistert aandachtig naar zijn klachten.', translation: 'The doctor listens carefully to his complaints.' },
        { text: 'Ze stelt gerichte vragen over zijn slaappatroon, eetgewoonten en stress.', translation: 'She asks targeted questions about his sleep pattern, eating habits and stress.' },
        { text: 'Daarna doet ze een lichamelijk onderzoek.', translation: 'Then she does a physical examination.' },
        { text: 'Ze meet zijn bloeddruk en controleert zijn reflexen.', translation: 'She measures his blood pressure and checks his reflexes.' },
      ]},
      { sentences: [
        { text: 'De huisarts vermoedt dat de klachten door stress worden veroorzaakt.', translation: 'The GP suspects that the complaints are caused by stress.' },
        { text: 'Ze adviseert {name} om meer te bewegen en beter te slapen.', translation: 'She advises {name} to exercise more and sleep better.' },
        { text: 'Ze schrijft ook een bloedonderzoek voor om andere oorzaken uit te sluiten.', translation: 'She also prescribes a blood test to rule out other causes.' },
        { text: '{name} krijgt een verwijzing naar het laboratorium.', translation: '{name} receives a referral to the laboratory.' },
        { text: 'De uitslag is binnen drie werkdagen beschikbaar via het patiëntenportaal.', translation: 'The results are available within three working days via the patient portal.' },
        { text: '{name} kan de uitslag online inzien of de praktijk bellen.', translation: '{name} can view the results online or call the practice.' },
      ]},
      { sentences: [
        { text: 'In Nederland is iedereen verplicht een zorgverzekering te hebben.', translation: 'In the Netherlands, everyone is required to have health insurance.' },
        { text: 'De basisverzekering dekt de meeste medische kosten.', translation: 'The basic insurance covers most medical costs.' },
        { text: 'Je betaalt wel een eigen risico van vierhonderd vijftig euro per jaar.', translation: 'You do pay an excess of four hundred and fifty euros per year.' },
        { text: 'Bezoeken aan de huisarts zijn gratis en vallen niet onder het eigen risico.', translation: 'Visits to the GP are free and do not fall under the excess.' },
        { text: '{name} is blij dat hij goed verzekerd is.', translation: '{name} is glad that he is well insured.' },
        { text: 'Hij begrijpt nu beter hoe het Nederlandse zorgstelsel werkt.', translation: 'He now better understands how the Dutch healthcare system works.' },
      ]},
    ],
    questions: [
      { question: 'Wat heb je nodig om naar een specialist te gaan in Nederland?', answer: 'Een verwijzing van de huisarts.', options: ['Een afspraak bij de specialist zelf.', 'Een verwijzing van de huisarts.', 'Toestemming van de zorgverzekeraar.', 'Een recept van de apotheek.'] },
      { question: 'Vallen bezoeken aan de huisarts onder het eigen risico?', answer: 'Nee, bezoeken aan de huisarts zijn gratis.', options: ['Ja, altijd.', 'Ja, maar alleen de eerste keer.', 'Nee, bezoeken aan de huisarts zijn gratis.', 'Dat hangt af van de verzekering.'] },
      { question: 'Wat is iedereen in Nederland verplicht te hebben?', answer: 'Een zorgverzekering.', options: ['Een huisarts.', 'Een zorgverzekering.', 'Een patiëntenportaal.', 'Een eigen risico.'] },
      { question: 'Wat adviseert de huisarts aan {name}?', answer: 'Meer bewegen en beter slapen.', options: ['Medicijnen nemen.', 'Meer bewegen en beter slapen.', 'Een specialist bezoeken.', 'Stoppen met werken.'] },
      { question: 'Hoe hoog is het eigen risico per jaar?', answer: 'Vierhonderd vijftig euro.', options: ['Tweehonderd euro.', 'Driehonderd euro.', 'Vierhonderd vijftig euro.', 'Zeshonderd euro.'] },
    ],
  },
  // ── B1 — Housing ─────────────────────────────────────────────────────────────
  {
    titleTemplate: 'Een Huurwoning Zoeken in {city}',
    level: 'B1',
    topic: 'housing',
    paragraphs: [
      { sentences: [
        { text: '{name} is {job} en woont al drie jaar in {city}.', translation: '{name} is a {job} and has lived in {city} for three years.' },
        { text: 'Hij huurt momenteel een kamer, maar wil graag een zelfstandige woning.', translation: 'He currently rents a room, but would like an independent home.' },
        { text: 'In Nederland is de woningmarkt erg krap, vooral in de grote steden.', translation: 'In the Netherlands, the housing market is very tight, especially in the big cities.' },
        { text: 'Er zijn twee soorten huurwoningen: sociale huurwoningen en vrije sector woningen.', translation: 'There are two types of rental homes: social housing and private sector homes.' },
        { text: 'Voor sociale huurwoningen moet je je inschrijven bij een woningcorporatie.', translation: 'For social housing you must register with a housing corporation.' },
      ]},
      { sentences: [
        { text: '{name} schrijft zich in bij de woningcorporatie in {city}.', translation: '{name} registers with the housing corporation in {city}.' },
        { text: 'Hij krijgt te horen dat de wachttijd gemiddeld acht jaar is.', translation: 'He is told that the average waiting time is eight years.' },
        { text: 'Dat is erg lang, dus besluit hij ook te zoeken in de vrije sector.', translation: 'That is very long, so he also decides to search in the private sector.' },
        { text: 'Vrije sector woningen zijn duurder, maar je kunt er sneller in terecht.', translation: 'Private sector homes are more expensive, but you can move in more quickly.' },
        { text: 'Hij zoekt op woningwebsites en meldt zich aan bij een makelaar.', translation: 'He searches on housing websites and registers with an estate agent.' },
        { text: 'De makelaar vraagt om zijn inkomensgegevens en arbeidscontract.', translation: 'The estate agent asks for his income details and employment contract.' },
      ]},
      { sentences: [
        { text: 'Na twee weken vindt {name} een appartement van vijfenzestig vierkante meter.', translation: 'After two weeks {name} finds an apartment of sixty-five square metres.' },
        { text: 'De huur is duizend tweehonderd euro per maand, exclusief servicekosten.', translation: 'The rent is one thousand two hundred euros per month, excluding service charges.' },
        { text: 'Hij gaat op bezichtiging en is tevreden over de staat van de woning.', translation: 'He goes for a viewing and is satisfied with the condition of the property.' },
        { text: 'De verhuurder vraagt om een waarborgsom van twee maanden huur.', translation: 'The landlord asks for a deposit of two months\' rent.' },
        { text: 'Dit is een gangbare praktijk in Nederland.', translation: 'This is common practice in the Netherlands.' },
        { text: '{name} tekent het huurcontract en betaalt de waarborgsom.', translation: '{name} signs the rental contract and pays the deposit.' },
      ]},
      { sentences: [
        { text: 'Als huurder heeft {name} rechten en plichten.', translation: 'As a tenant {name} has rights and obligations.' },
        { text: 'De verhuurder is verantwoordelijk voor groot onderhoud.', translation: 'The landlord is responsible for major maintenance.' },
        { text: '{name} is verantwoordelijk voor kleine reparaties en het schoonhouden van de woning.', translation: '{name} is responsible for minor repairs and keeping the property clean.' },
        { text: 'Als er problemen zijn, moet hij dit schriftelijk melden aan de verhuurder.', translation: 'If there are problems, he must report this in writing to the landlord.' },
        { text: 'Bij geschillen kan hij terecht bij de Huurcommissie.', translation: 'In case of disputes he can go to the Rent Tribunal.' },
        { text: 'De Huurcommissie is een onafhankelijke instantie die huurders en verhuurders helpt.', translation: 'The Rent Tribunal is an independent body that helps tenants and landlords.' },
      ]},
      { sentences: [
        { text: '{name} meldt zijn nieuwe adres aan bij de gemeente.', translation: '{name} registers his new address with the municipality.' },
        { text: 'Dit is verplicht in Nederland; je moet je inschrijven in de Basisregistratie Personen.', translation: 'This is mandatory in the Netherlands; you must register in the Personal Records Database.' },
        { text: 'Zonder inschrijving kun je geen uitkering, toeslagen of andere voorzieningen aanvragen.', translation: 'Without registration you cannot apply for benefits, allowances or other provisions.' },
        { text: '{name} vraagt ook huurtoeslag aan bij de Belastingdienst.', translation: '{name} also applies for housing benefit from the Tax Authority.' },
        { text: 'Huurtoeslag is een bijdrage van de overheid voor mensen met een laag inkomen.', translation: 'Housing benefit is a government contribution for people with a low income.' },
        { text: 'Hij is blij dat hij eindelijk een eigen plek heeft in {city}.', translation: 'He is happy that he finally has his own place in {city}.' },
      ]},
    ],
    questions: [
      { question: 'Wat is het verschil tussen sociale huur en vrije sector huur?', answer: 'Sociale huurwoningen zijn goedkoper maar hebben een lange wachttijd; vrije sector woningen zijn duurder maar sneller beschikbaar.', options: ['Sociale huurwoningen zijn groter dan vrije sector woningen.', 'Sociale huurwoningen zijn goedkoper maar hebben een lange wachttijd; vrije sector woningen zijn duurder maar sneller beschikbaar.', 'Vrije sector woningen worden beheerd door de gemeente.', 'Sociale huurwoningen zijn alleen voor studenten.'] },
      { question: 'Bij welke instantie kan men terecht bij geschillen tussen huurder en verhuurder?', answer: 'De Huurcommissie.', options: ['De gemeente.', 'De Huurcommissie.', 'De rechtbank.', 'De woningcorporatie.'] },
      { question: 'Is het verplicht om je nieuwe adres aan te melden bij de gemeente?', answer: 'Ja, je moet je inschrijven in de Basisregistratie Personen.', options: ['Nee, dat is optioneel.', 'Ja, je moet je inschrijven in de Basisregistratie Personen.', 'Alleen als je een uitkering ontvangt.', 'Alleen als je een huurwoning hebt.'] },
      { question: 'Wie is verantwoordelijk voor groot onderhoud van de woning?', answer: 'De verhuurder.', options: ['De huurder.', 'De verhuurder.', 'De gemeente.', 'De woningcorporatie.'] },
      { question: 'Hoeveel maanden huur vraagt de verhuurder als waarborgsom?', answer: 'Twee maanden huur.', options: ['Één maand huur.', 'Twee maanden huur.', 'Drie maanden huur.', 'Vier maanden huur.'] },
    ],
  },
  // ── B2 — Work and rights ─────────────────────────────────────────────────────
  {
    titleTemplate: 'Werken in Nederland: Rechten en Plichten',
    level: 'B2',
    topic: 'work and rights',
    paragraphs: [
      { sentences: [
        { text: '{name} heeft een arbeidscontract getekend bij een bedrijf in {city}.', translation: '{name} has signed an employment contract with a company in {city}.' },
        { text: 'In Nederland zijn de rechten van werknemers goed beschermd door de wet.', translation: 'In the Netherlands, the rights of employees are well protected by law.' },
        { text: 'Het arbeidsrecht regelt de relatie tussen werkgever en werknemer.', translation: 'Employment law regulates the relationship between employer and employee.' },
        { text: 'Elke werknemer heeft recht op een schriftelijk contract met duidelijke afspraken.', translation: 'Every employee has the right to a written contract with clear agreements.' },
        { text: 'Hierin staan het salaris, de werktijden, het aantal vakantiedagen en de opzegtermijn.', translation: 'This includes the salary, working hours, number of holiday days and notice period.' },
      ]},
      { sentences: [
        { text: 'In Nederland heeft elke werknemer recht op minimaal vier keer het aantal werkuren per week aan vakantiedagen.', translation: 'In the Netherlands, every employee is entitled to at least four times the number of working hours per week in holiday days.' },
        { text: 'Voor een fulltime werknemer zijn dat minimaal twintig vakantiedagen per jaar.', translation: 'For a full-time employee that is at least twenty holiday days per year.' },
        { text: 'Veel cao\'s bieden meer vakantiedagen dan het wettelijk minimum.', translation: 'Many collective agreements offer more holiday days than the legal minimum.' },
        { text: '{name} werkt veertig uur per week en heeft recht op vijfentwintig vakantiedagen.', translation: '{name} works forty hours per week and is entitled to twenty-five holiday days.' },
        { text: 'Hij moet vakantiedagen minimaal twee weken van tevoren aanvragen.', translation: 'He must request holiday days at least two weeks in advance.' },
        { text: 'De werkgever kan een verzoek weigeren als het bedrijfsbelang dit vereist.', translation: 'The employer can refuse a request if the business interest requires it.' },
      ]},
      { sentences: [
        { text: 'Bij ziekte heeft {name} recht op doorbetaling van zijn loon.', translation: 'In case of illness {name} is entitled to continued payment of his salary.' },
        { text: 'De werkgever is verplicht het loon gedurende twee jaar door te betalen bij ziekte.', translation: 'The employer is obliged to continue paying the salary for two years in case of illness.' },
        { text: 'In het eerste jaar ontvangt de werknemer honderd procent van zijn loon.', translation: 'In the first year the employee receives one hundred percent of his salary.' },
        { text: 'In het tweede jaar is dit zeventig procent.', translation: 'In the second year this is seventy percent.' },
        { text: 'De werknemer moet zich ziekmelden bij de werkgever en de bedrijfsarts.', translation: 'The employee must report sick to the employer and the occupational health physician.' },
        { text: 'De bedrijfsarts begeleidt het re-integratieproces.', translation: 'The occupational health physician supervises the reintegration process.' },
      ]},
      { sentences: [
        { text: 'Als {name} ontslagen wordt, heeft hij recht op een transitievergoeding.', translation: 'If {name} is dismissed, he is entitled to a transition payment.' },
        { text: 'De hoogte van de transitievergoeding hangt af van het salaris en de duur van het dienstverband.', translation: 'The amount of the transition payment depends on the salary and the duration of employment.' },
        { text: 'Bij ontslag op staande voet vervalt dit recht.', translation: 'In case of summary dismissal this right lapses.' },
        { text: 'Ontslag op staande voet is alleen mogelijk bij ernstig wangedrag.', translation: 'Summary dismissal is only possible in case of serious misconduct.' },
        { text: '{name} kan bij onrechtmatig ontslag naar de kantonrechter stappen.', translation: '{name} can go to the subdistrict court in case of unlawful dismissal.' },
        { text: 'Hij kan ook terecht bij het UWV voor een WW-uitkering na ontslag.', translation: 'He can also go to the UWV for unemployment benefit after dismissal.' },
      ]},
      { sentences: [
        { text: 'Naast rechten heeft {name} ook plichten als werknemer.', translation: 'In addition to rights, {name} also has obligations as an employee.' },
        { text: 'Hij moet zijn werk naar behoren uitvoeren en instructies van de werkgever opvolgen.', translation: 'He must perform his work properly and follow instructions from the employer.' },
        { text: 'Hij mag geen vertrouwelijke bedrijfsinformatie delen met derden.', translation: 'He may not share confidential company information with third parties.' },
        { text: 'Bij een concurrentiebeding mag hij na ontslag niet bij een concurrent werken.', translation: 'With a non-compete clause he may not work for a competitor after dismissal.' },
        { text: '{name} begrijpt dat kennis van het arbeidsrecht hem beschermt.', translation: '{name} understands that knowledge of employment law protects him.' },
        { text: 'Hij raadt andere nieuwkomers aan om zich goed te informeren over hun rechten.', translation: 'He recommends other newcomers to inform themselves well about their rights.' },
      ]},
    ],
    questions: [
      { question: 'Hoeveel vakantiedagen heeft een fulltime werknemer minimaal recht op per jaar?', answer: 'Twintig vakantiedagen.', options: ['Tien vakantiedagen.', 'Vijftien vakantiedagen.', 'Twintig vakantiedagen.', 'Vijfentwintig vakantiedagen.'] },
      { question: 'Hoe lang is de werkgever verplicht het loon door te betalen bij ziekte?', answer: 'Twee jaar.', options: ['Zes maanden.', 'Één jaar.', 'Twee jaar.', 'Drie jaar.'] },
      { question: 'Hoeveel procent van het loon ontvangt de werknemer in het tweede ziektejaar?', answer: 'Zeventig procent.', options: ['Vijftig procent.', 'Zestig procent.', 'Zeventig procent.', 'Honderd procent.'] },
      { question: 'Waar heeft een werknemer recht op bij ontslag?', answer: 'Een transitievergoeding.', options: ['Een bonus.', 'Een transitievergoeding.', 'Extra vakantiedagen.', 'Een pensioenuitkering.'] },
      { question: 'Wanneer is ontslag op staande voet mogelijk?', answer: 'Alleen bij ernstig wangedrag.', options: ['Altijd als de werkgever dat wil.', 'Bij slechte prestaties.', 'Alleen bij ernstig wangedrag.', 'Na twee jaar ziekte.'] },
    ],
  },
  // ── B2 — Civic integration ───────────────────────────────────────────────────
  {
    titleTemplate: 'Het Inburgeringsexamen in Nederland',
    level: 'B2',
    topic: 'civic integration',
    paragraphs: [
      { sentences: [
        { text: '{name} is drie jaar geleden naar Nederland gekomen vanuit het buitenland.', translation: '{name} came to the Netherlands from abroad three years ago.' },
        { text: 'Als inburgeringsplichtige moet hij het inburgeringsexamen halen.', translation: 'As someone required to integrate, he must pass the civic integration exam.' },
        { text: 'Het inburgeringsexamen bestaat uit verschillende onderdelen.', translation: 'The civic integration exam consists of various components.' },
        { text: 'Hij moet Nederlands leren op minimaal B1-niveau.', translation: 'He must learn Dutch to at least B1 level.' },
        { text: 'Daarnaast moet hij kennis hebben van de Nederlandse samenleving.', translation: 'In addition, he must have knowledge of Dutch society.' },
      ]},
      { sentences: [
        { text: 'Het examen bestaat uit vijf onderdelen: lezen, luisteren, schrijven, spreken en kennis van de Nederlandse samenleving.', translation: 'The exam consists of five components: reading, listening, writing, speaking and knowledge of Dutch society.' },
        { text: 'Het onderdeel Kennis van de Nederlandse Samenleving (KNS) toetst kennis over democratie, rechten en plichten.', translation: 'The Knowledge of Dutch Society (KNS) component tests knowledge of democracy, rights and obligations.' },
        { text: 'Ook de Oriëntatie op de Nederlandse Arbeidsmarkt (ONA) is verplicht.', translation: 'The Orientation on the Dutch Labour Market (ONA) is also compulsory.' },
        { text: '{name} volgt een inburgeringscursus bij een erkend taleninstituut in {city}.', translation: '{name} follows a civic integration course at an accredited language institute in {city}.' },
        { text: 'De cursus duurt gemiddeld anderhalf jaar.', translation: 'The course lasts an average of one and a half years.' },
        { text: 'De gemeente betaalt een deel van de kosten via de Wet Inburgering 2021.', translation: 'The municipality pays part of the costs through the Civic Integration Act 2021.' },
      ]},
      { sentences: [
        { text: 'Onder de Wet Inburgering 2021 heeft de gemeente een actievere rol gekregen.', translation: 'Under the Civic Integration Act 2021, the municipality has been given a more active role.' },
        { text: 'De gemeente stelt een persoonlijk plan op voor elke inburgeringsplichtige.', translation: 'The municipality draws up a personal plan for each person required to integrate.' },
        { text: 'Dit plan houdt rekening met de achtergrond, opleiding en ambities van de persoon.', translation: 'This plan takes into account the background, education and ambitions of the person.' },
        { text: '{name} heeft een plan gekregen met een leerroute gericht op werk.', translation: '{name} has received a plan with a learning route focused on work.' },
        { text: 'Hij volgt naast de taalcursus ook een beroepsopleiding.', translation: 'In addition to the language course, he also follows a vocational training.' },
        { text: 'Dit vergroot zijn kansen op de arbeidsmarkt aanzienlijk.', translation: 'This significantly increases his chances on the labour market.' },
      ]},
      { sentences: [
        { text: 'Het inburgeringsexamen wordt afgenomen door DUO, de Dienst Uitvoering Onderwijs.', translation: 'The civic integration exam is administered by DUO, the Education Executive Agency.' },
        { text: '{name} moet zich aanmelden via de website van DUO.', translation: '{name} must register via the DUO website.' },
        { text: 'Hij kan de onderdelen in willekeurige volgorde afleggen.', translation: 'He can take the components in any order.' },
        { text: 'Als hij een onderdeel niet haalt, mag hij het herkansen.', translation: 'If he does not pass a component, he may retake it.' },
        { text: 'Hij heeft drie jaar de tijd om het volledige examen te halen.', translation: 'He has three years to pass the complete exam.' },
        { text: 'Als hij niet slaagt, kan de gemeente een boete opleggen.', translation: 'If he does not succeed, the municipality can impose a fine.' },
      ]},
      { sentences: [
        { text: 'Na het behalen van het inburgeringsexamen kan {name} een verblijfsvergunning voor onbepaalde tijd aanvragen.', translation: 'After passing the civic integration exam, {name} can apply for a permanent residence permit.' },
        { text: 'Dit geeft hem meer rechten en zekerheid in Nederland.', translation: 'This gives him more rights and security in the Netherlands.' },
        { text: 'Na vijf jaar legaal verblijf kan hij ook de Nederlandse nationaliteit aanvragen.', translation: 'After five years of legal residence he can also apply for Dutch nationality.' },
        { text: 'Naturalisatie vereist onder andere het afleggen van de naturalisatietoets.', translation: 'Naturalisation requires, among other things, passing the naturalisation test.' },
        { text: '{name} is gemotiveerd om te slagen en een volwaardig lid van de Nederlandse samenleving te worden.', translation: '{name} is motivated to succeed and become a full member of Dutch society.' },
        { text: 'Hij begrijpt dat inburgering niet alleen een verplichting is, maar ook een kans.', translation: 'He understands that civic integration is not only an obligation, but also an opportunity.' },
      ]},
    ],
    questions: [
      { question: 'Welke instantie neemt het inburgeringsexamen af?', answer: 'DUO (Dienst Uitvoering Onderwijs).', options: ['De gemeente.', 'DUO (Dienst Uitvoering Onderwijs).', 'Het UWV.', 'De IND.'] },
      { question: 'Wat kan {name} aanvragen na vijf jaar legaal verblijf?', answer: 'De Nederlandse nationaliteit.', options: ['Een verblijfsvergunning.', 'De Nederlandse nationaliteit.', 'Een werkvergunning.', 'Een paspoort.'] },
      { question: 'Wie heeft onder de Wet Inburgering 2021 een actievere rol gekregen?', answer: 'De gemeente.', options: ['DUO.', 'De gemeente.', 'De inburgeringsplichtige zelf.', 'Het taleninstituut.'] },
      { question: 'Wat zijn de gevolgen als {name} het inburgeringsexamen niet haalt binnen drie jaar?', answer: 'De gemeente kan een boete opleggen.', options: ['Hij moet het land verlaten.', 'De gemeente kan een boete opleggen.', 'Hij verliest zijn verblijfsvergunning.', 'Hij moet opnieuw beginnen.'] },
      { question: 'Hoeveel jaar heeft {name} de tijd om het volledige examen te halen?', answer: 'Drie jaar.', options: ['Één jaar.', 'Twee jaar.', 'Drie jaar.', 'Vijf jaar.'] },
    ],
  },
];

/**
 * Generate a unique story from a template by filling in random variables.
 * Returns null if no suitable template is found (shouldn't happen).
 */
function generateProceduralStory(
  level: 'A1' | 'A2' | 'B1' | 'B2',
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
        type: 'multiple_choice' as const,
        question: fill(q.question, vars),
        answer: fill(q.answer, vars),
        options: q.options.map((o) => fill(o, vars)),
      })),
    };

    return story;
  }

  return null;
}

// Get a single fallback story matching level/topic, excluding already-seen titles
function getDefaultStory(
  level: 'A1' | 'A2' | 'B1' | 'B2',
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

// ─────────────────────────────────────────────────────────────────────────────
// Shared prompt builder for LLM story generation
// ─────────────────────────────────────────────────────────────────────────────

function buildStoryPrompt(level: 'A1' | 'A2' | 'B1' | 'B2', topic: string, existingTitles: string[]): string {
  const levelDesc =
    level === 'A1'
      ? 'A1 beginner (very simple vocabulary, short sentences, present tense only)'
      : level === 'A2'
      ? 'A2 elementary (simple vocabulary, some past tense, slightly longer sentences)'
      : level === 'B1'
      ? 'B1 intermediate (varied vocabulary, past and future tense, complex sentences, civic/formal language)'
      : 'B2 upper-intermediate (rich vocabulary, complex grammar, formal register, exam-level difficulty)';

  const inburgeringContext =
    level === 'B1' || level === 'B2'
      ? `This text is for the Dutch civic integration exam (inburgeringsexamen). It should cover realistic scenarios that immigrants encounter in the Netherlands: official procedures, rights and obligations, institutions, formal communication, and Dutch society. Use formal Dutch register where appropriate.`
      : `This text is for Dutch language learners preparing for civic integration. Keep it accessible but realistic.`;

  const avoidTitles =
    existingTitles.length > 0
      ? `Do NOT use any of these titles: ${existingTitles.join(', ')}.`
      : '';

  return `You are a Dutch language teacher creating a reading comprehension text for the Dutch civic integration exam (inburgeringsexamen).

Write ONE Dutch text at ${levelDesc} level about the topic: "${topic}".

${inburgeringContext}

Requirements:
- The text MUST be at least 500 words in Dutch
- 5 to 6 paragraphs, each with 5 to 8 sentences
- Each sentence must have an English translation
- Include exactly 5 comprehension questions in Dutch, ALL of type "multiple_choice"
  - Each question must have exactly 4 options (one correct), field "options": ["...", "...", "...", "..."]
  - The "answer" field must exactly match one of the options
- Questions should test real comprehension, not just word recognition
- For B1/B2: include at least one question about implied meaning or inference
- The text should be realistic, culturally relevant to the Netherlands, and exam-appropriate
- ${avoidTitles}

Respond ONLY with valid JSON in this exact format (no markdown, no extra text):
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
    { "type": "multiple_choice", "question": "Dutch question?", "answer": "Correct option text.", "options": ["Option A.", "Option B.", "Option C.", "Option D."] },
    { "type": "multiple_choice", "question": "Dutch question?", "answer": "Correct option text.", "options": ["Option A.", "Option B.", "Option C.", "Option D."] },
    { "type": "multiple_choice", "question": "Dutch question?", "answer": "Correct option text.", "options": ["Option A.", "Option B.", "Option C.", "Option D."] },
    { "type": "multiple_choice", "question": "Dutch question?", "answer": "Correct option text.", "options": ["Option A.", "Option B.", "Option C.", "Option D."] }
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse LLM JSON response into a Story object
// ─────────────────────────────────────────────────────────────────────────────

function parseLLMStory(content: string, level: 'A1' | 'A2' | 'B1' | 'B2', topic: string): Story | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    return {
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
      questions: (parsed.questions || []).map((q: { type?: string; question: string; answer: string; options?: string[] }) => ({
        id: generateId(),
        type: 'multiple_choice' as const,
        question: q.question,
        answer: q.answer,
        options: q.options || [],
      })),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI story generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateStoryWithOpenAI(
  level: 'A1' | 'A2' | 'B1' | 'B2',
  topic: string,
  existingTitles: string[]
): Promise<Story | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildStoryPrompt(level, topic, existingTitles);

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
        max_tokens: 3500,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseLLMStory(content, level, topic);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Groq free LLM story generation (llama-3.1-8b-instant — free tier)
// Sign up at https://console.groq.com to get a free API key (GROQ_API_KEY)
// ─────────────────────────────────────────────────────────────────────────────

async function generateStoryWithGroq(
  level: 'A1' | 'A2' | 'B1' | 'B2',
  topic: string,
  existingTitles: string[]
): Promise<Story | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  const prompt = buildStoryPrompt(level, topic, existingTitles);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are a Dutch language teacher. Always respond with valid JSON only, no markdown code blocks, no extra text.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 3500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseLLMStory(content, level, topic);
  } catch (err) {
    console.error('Groq generation error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const level: 'A1' | 'A2' | 'B1' | 'B2' = body.level || 'A2';
    const topic: string = body.topic || 'daily life';
    const existingTitles: string[] = body.existingTitles || [];

    // 1. Try OpenAI (if OPENAI_API_KEY is set)
    const aiStory = await generateStoryWithOpenAI(level, topic, existingTitles);
    if (aiStory) {
      return NextResponse.json({ story: aiStory });
    }

    // 2. Try Groq free LLM (if GROQ_API_KEY is set)
    const groqStory = await generateStoryWithGroq(level, topic, existingTitles);
    if (groqStory) {
      return NextResponse.json({ story: groqStory });
    }

    // 3. Try procedural generation (unique stories from templates, no API key needed)
    const proceduralStory = generateProceduralStory(level, topic, existingTitles);
    if (proceduralStory) {
      return NextResponse.json({ story: proceduralStory });
    }

    // 4. Last resort: pre-written static pool (may repeat if all seen)
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
