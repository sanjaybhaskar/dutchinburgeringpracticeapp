import { NextRequest, NextResponse } from 'next/server';
import { Story, Paragraph, Sentence } from '@/app/types/story';

// Generate a unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ─────────────────────────────────────────────────────────────────────────────
// Large pool of pre-written fallback stories (used when no OpenAI key is set)
// ─────────────────────────────────────────────────────────────────────────────
type RawSentence = { text: string; translation: string };
type RawParagraph = { sentences: RawSentence[] };
type RawStory = { title: string; level: 'A1' | 'A2'; topic: string; paragraphs: RawParagraph[] };

const STORY_POOL: RawStory[] = [
  // ── A1 ──────────────────────────────────────────────────────────────────────
  {
    title: 'De Kat en de Hond',
    level: 'A1',
    topic: 'Animals and friendship',
    paragraphs: [
      {
        sentences: [
          { text: 'Er is een kat in het huis.', translation: 'There is a cat in the house.' },
          { text: 'De kat heet Max.', translation: 'The cat is called Max.' },
          { text: 'Max is een grote, oranje kat.', translation: 'Max is a big, orange cat.' },
          { text: 'Hij heeft groene ogen.', translation: 'He has green eyes.' },
          { text: 'Max houdt van vis.', translation: 'Max likes fish.' },
        ],
      },
      {
        sentences: [
          { text: 'Er is ook een hond in het huis.', translation: 'There is also a dog in the house.' },
          { text: 'De hond heet Bella.', translation: 'The dog is called Bella.' },
          { text: 'Bella is een kleine, witte hond.', translation: 'Bella is a small, white dog.' },
          { text: 'Ze heeft blauwe ogen.', translation: 'She has blue eyes.' },
          { text: 'Bella houdt van wandelen.', translation: 'Bella likes walking.' },
        ],
      },
      {
        sentences: [
          { text: 'Max en Bella zijn goede vrienden.', translation: 'Max and Bella are good friends.' },
          { text: 'Ze spelen samen in de tuin.', translation: 'They play together in the garden.' },
          { text: 'Soms rennen ze achter elkaar aan.', translation: 'Sometimes they chase each other.' },
          { text: 'Ze slapen ook samen op de bank.', translation: 'They also sleep together on the couch.' },
          { text: 'De eigenaar is blij met zijn dieren.', translation: 'The owner is happy with his animals.' },
        ],
      },
      {
        sentences: [
          { text: 'Elke ochtend eten ze samen.', translation: 'Every morning they eat together.' },
          { text: 'Max eet zijn vis en Bella eet haar brokken.', translation: 'Max eats his fish and Bella eats her kibble.' },
          { text: 'Na het eten gaan ze naar buiten.', translation: 'After eating they go outside.' },
          { text: 'Ze kijken naar de vogels in de boom.', translation: 'They watch the birds in the tree.' },
          { text: 'Het is een gelukkig leven voor Max en Bella.', translation: 'It is a happy life for Max and Bella.' },
        ],
      },
    ],
  },
  {
    title: 'Mijn Dag',
    level: 'A1',
    topic: 'Daily routine',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik sta om zeven uur op.', translation: "I get up at seven o'clock." },
          { text: 'Ik ga naar de badkamer.', translation: 'I go to the bathroom.' },
          { text: 'Ik poets mijn tanden.', translation: 'I brush my teeth.' },
          { text: 'Ik douche en kleed me aan.', translation: 'I shower and get dressed.' },
          { text: 'Daarna ga ik naar de keuken.', translation: 'Then I go to the kitchen.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik ontbijt met brood en kaas.', translation: 'I have breakfast with bread and cheese.' },
          { text: 'Ik drink een kop koffie.', translation: 'I drink a cup of coffee.' },
          { text: 'Het ontbijt is lekker.', translation: 'The breakfast is tasty.' },
          { text: 'Ik lees de krant tijdens het ontbijt.', translation: 'I read the newspaper during breakfast.' },
          { text: 'Om half acht ga ik naar mijn werk.', translation: 'At half past seven I go to my work.' },
        ],
      },
      {
        sentences: [
          { text: 'Mijn werk is leuk.', translation: 'My work is fun.' },
          { text: 'Ik werk met veel mensen.', translation: 'I work with many people.' },
          { text: 'We drinken koffie samen.', translation: 'We drink coffee together.' },
          { text: 'Om twaalf uur eet ik mijn lunch.', translation: 'At twelve o\'clock I eat my lunch.' },
          { text: 'Ik eet een broodje met ham.', translation: 'I eat a sandwich with ham.' },
        ],
      },
      {
        sentences: [
          { text: "'s Avonds eet ik met mijn familie.", translation: 'In the evening I eat with my family.' },
          { text: 'We eten soep en brood.', translation: 'We eat soup and bread.' },
          { text: 'Daarna lees ik een boek.', translation: 'After that I read a book.' },
          { text: 'Mijn kinderen kijken televisie.', translation: 'My children watch television.' },
          { text: 'Om tien uur ga ik slapen.', translation: 'At ten o\'clock I go to sleep.' },
        ],
      },
    ],
  },
  {
    title: 'Op de Fiets',
    level: 'A1',
    topic: 'Cycling in the Netherlands',
    paragraphs: [
      {
        sentences: [
          { text: 'In Nederland rijden veel mensen op de fiets.', translation: 'In the Netherlands many people ride bicycles.' },
          { text: 'Ik heb een rode fiets.', translation: 'I have a red bicycle.' },
          { text: 'Mijn fiets is nieuw.', translation: 'My bicycle is new.' },
          { text: 'Ik rijd elke dag naar school op de fiets.', translation: 'I cycle to school every day.' },
          { text: 'Het is maar vijf minuten rijden.', translation: 'It is only five minutes of cycling.' },
        ],
      },
      {
        sentences: [
          { text: 'Er zijn veel fietspaden in de stad.', translation: 'There are many cycle paths in the city.' },
          { text: 'De fietspaden zijn breed en veilig.', translation: 'The cycle paths are wide and safe.' },
          { text: 'Ik stop bij het rode licht.', translation: 'I stop at the red light.' },
          { text: 'Er zijn ook andere fietsers op het pad.', translation: 'There are also other cyclists on the path.' },
          { text: 'We groeten elkaar als we voorbijrijden.', translation: 'We greet each other as we pass by.' },
        ],
      },
      {
        sentences: [
          { text: 'Soms regent het als ik fiets.', translation: 'Sometimes it rains when I cycle.' },
          { text: 'Dan draag ik een regenjas.', translation: 'Then I wear a raincoat.' },
          { text: 'Mijn fiets heeft een bagagedrager.', translation: 'My bicycle has a luggage rack.' },
          { text: 'Ik leg mijn tas op de bagagedrager.', translation: 'I put my bag on the luggage rack.' },
          { text: 'Fietsen is goed voor het milieu.', translation: 'Cycling is good for the environment.' },
        ],
      },
      {
        sentences: [
          { text: "In het weekend fiets ik met mijn vader.", translation: 'At the weekend I cycle with my father.' },
          { text: 'We rijden door het park.', translation: 'We ride through the park.' },
          { text: 'Het park is groen en mooi.', translation: 'The park is green and beautiful.' },
          { text: 'We stoppen bij een café voor een drankje.', translation: 'We stop at a café for a drink.' },
          { text: 'Fietsen is mijn favoriete sport.', translation: 'Cycling is my favourite sport.' },
        ],
      },
    ],
  },
  {
    title: 'Het Weer',
    level: 'A1',
    topic: 'Weather and seasons',
    paragraphs: [
      {
        sentences: [
          { text: 'Vandaag is het zonnig.', translation: 'Today it is sunny.' },
          { text: 'De zon schijnt fel.', translation: 'The sun shines brightly.' },
          { text: 'Het is warm buiten.', translation: 'It is warm outside.' },
          { text: 'Ik draag een t-shirt en een korte broek.', translation: 'I wear a t-shirt and shorts.' },
          { text: 'Ik ga naar het park.', translation: 'I go to the park.' },
        ],
      },
      {
        sentences: [
          { text: 'In de winter is het koud.', translation: 'In winter it is cold.' },
          { text: 'Soms sneeuwt het.', translation: 'Sometimes it snows.' },
          { text: 'De kinderen spelen in de sneeuw.', translation: 'The children play in the snow.' },
          { text: 'Ze maken een sneeuwpop.', translation: 'They make a snowman.' },
          { text: 'Daarna drinken ze warme chocolademelk.', translation: 'Afterwards they drink hot chocolate.' },
        ],
      },
      {
        sentences: [
          { text: 'In de herfst vallen de bladeren van de bomen.', translation: 'In autumn the leaves fall from the trees.' },
          { text: 'De bladeren zijn rood, oranje en geel.', translation: 'The leaves are red, orange and yellow.' },
          { text: 'Het waait hard.', translation: 'It is very windy.' },
          { text: 'Ik draag een jas en een sjaal.', translation: 'I wear a coat and a scarf.' },
          { text: 'De dagen worden korter.', translation: 'The days get shorter.' },
        ],
      },
      {
        sentences: [
          { text: 'In de lente bloeit alles.', translation: 'In spring everything blooms.' },
          { text: 'De tulpen zijn prachtig.', translation: 'The tulips are beautiful.' },
          { text: 'De vogels zingen in de bomen.', translation: 'The birds sing in the trees.' },
          { text: 'Het wordt weer warmer.', translation: 'It gets warmer again.' },
          { text: 'Ik ben blij dat de lente er is.', translation: 'I am happy that spring is here.' },
        ],
      },
    ],
  },
  {
    title: 'In de Supermarkt',
    level: 'A1',
    topic: 'Grocery shopping',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik ga naar de supermarkt.', translation: 'I go to the supermarket.' },
          { text: 'Ik heb een boodschappenlijstje.', translation: 'I have a shopping list.' },
          { text: 'Op het lijstje staan melk, brood en eieren.', translation: 'On the list are milk, bread and eggs.' },
          { text: 'De supermarkt is groot.', translation: 'The supermarket is big.' },
          { text: 'Er zijn veel mensen aan het winkelen.', translation: 'There are many people shopping.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik pak een winkelwagen.', translation: 'I take a shopping trolley.' },
          { text: 'Eerst ga ik naar de groente-afdeling.', translation: 'First I go to the vegetable section.' },
          { text: 'Ik koop tomaten, wortels en sla.', translation: 'I buy tomatoes, carrots and lettuce.' },
          { text: 'De groenten zien er vers uit.', translation: 'The vegetables look fresh.' },
          { text: 'Daarna ga ik naar de zuivelafdeling.', translation: 'Then I go to the dairy section.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik pak een pak melk en een pak boter.', translation: 'I take a carton of milk and a pack of butter.' },
          { text: 'Ik zoek ook kaas.', translation: 'I also look for cheese.' },
          { text: 'Er zijn veel soorten kaas.', translation: 'There are many types of cheese.' },
          { text: 'Ik kies een stuk Gouda.', translation: 'I choose a piece of Gouda.' },
          { text: 'Gouda is mijn favoriete kaas.', translation: 'Gouda is my favourite cheese.' },
        ],
      },
      {
        sentences: [
          { text: 'Bij de kassa wacht ik in de rij.', translation: 'At the checkout I wait in the queue.' },
          { text: 'De kassière is vriendelijk.', translation: 'The cashier is friendly.' },
          { text: 'Ik betaal met mijn pinpas.', translation: 'I pay with my debit card.' },
          { text: 'Ik stop alles in mijn tas.', translation: 'I put everything in my bag.' },
          { text: 'Ik ga naar huis met mijn boodschappen.', translation: 'I go home with my groceries.' },
        ],
      },
    ],
  },
  {
    title: 'Mijn Familie',
    level: 'A1',
    topic: 'Family members',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik heb een grote familie.', translation: 'I have a big family.' },
          { text: 'Mijn vader heet Peter.', translation: 'My father is called Peter.' },
          { text: 'Hij is veertig jaar oud.', translation: 'He is forty years old.' },
          { text: 'Mijn moeder heet Anna.', translation: 'My mother is called Anna.' },
          { text: 'Ze is achtendertig jaar oud.', translation: 'She is thirty-eight years old.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik heb een broer en een zus.', translation: 'I have a brother and a sister.' },
          { text: 'Mijn broer heet Tom.', translation: 'My brother is called Tom.' },
          { text: 'Hij is twaalf jaar oud.', translation: 'He is twelve years old.' },
          { text: 'Mijn zus heet Lisa.', translation: 'My sister is called Lisa.' },
          { text: 'Ze is acht jaar oud.', translation: 'She is eight years old.' },
        ],
      },
      {
        sentences: [
          { text: 'We wonen in een huis in de stad.', translation: 'We live in a house in the city.' },
          { text: 'Ons huis heeft drie slaapkamers.', translation: 'Our house has three bedrooms.' },
          { text: 'We hebben ook een tuin.', translation: 'We also have a garden.' },
          { text: 'In de tuin staan bloemen en bomen.', translation: 'In the garden there are flowers and trees.' },
          { text: 'We spelen vaak in de tuin.', translation: 'We often play in the garden.' },
        ],
      },
      {
        sentences: [
          { text: 'In het weekend eten we samen.', translation: 'At the weekend we eat together.' },
          { text: 'Mijn vader kookt graag.', translation: 'My father likes to cook.' },
          { text: 'Hij maakt altijd lekkere gerechten.', translation: 'He always makes tasty dishes.' },
          { text: 'Na het eten spelen we spelletjes.', translation: 'After dinner we play games.' },
          { text: 'Ik hou van mijn familie.', translation: 'I love my family.' },
        ],
      },
    ],
  },
  // ── A2 ──────────────────────────────────────────────────────────────────────
  {
    title: 'De Markt',
    level: 'A2',
    topic: 'Shopping at the market',
    paragraphs: [
      {
        sentences: [
          { text: 'Elke zaterdag ga ik naar de markt.', translation: 'Every Saturday I go to the market.' },
          { text: 'De markt is in het centrum van de stad.', translation: 'The market is in the center of the city.' },
          { text: 'Er zijn veel mensen op de markt.', translation: 'There are many people at the market.' },
          { text: "De markt begint om acht uur 's ochtends.", translation: "The market starts at eight o'clock in the morning." },
          { text: 'Ik ga altijd vroeg om de beste producten te vinden.', translation: 'I always go early to find the best products.' },
        ],
      },
      {
        sentences: [
          { text: 'Er zijn veel kraampjes met groenten en fruit.', translation: 'There are many stalls with vegetables and fruit.' },
          { text: 'Ik koop altijd verse appelen.', translation: 'I always buy fresh apples.' },
          { text: 'De appelen zijn rood en groot.', translation: 'The apples are red and big.' },
          { text: 'Ik koop ook tomaten en komkommers.', translation: 'I also buy tomatoes and cucumbers.' },
          { text: 'De groenten zijn goedkoper dan in de supermarkt.', translation: 'The vegetables are cheaper than in the supermarket.' },
        ],
      },
      {
        sentences: [
          { text: 'De verkoper is heel vriendelijk.', translation: 'The seller is very friendly.' },
          { text: 'Hij heet Jan en kent iedereen.', translation: 'His name is Jan and he knows everyone.' },
          { text: 'Hij geeft me altijd een gratis appel.', translation: 'He always gives me a free apple.' },
          { text: 'We praten over het weer en de stad.', translation: 'We talk about the weather and the city.' },
          { text: 'Jan werkt al twintig jaar op de markt.', translation: 'Jan has been working at the market for twenty years.' },
        ],
      },
      {
        sentences: [
          { text: 'Daarna ga ik naar de bakker voor brood.', translation: 'After that I go to the baker for bread.' },
          { text: 'De geur van vers brood ruikt heerlijk!', translation: 'The smell of fresh bread smells delicious!' },
          { text: 'Ik koop een groot brood en een paar croissants.', translation: 'I buy a large loaf and a few croissants.' },
          { text: 'Om twaalf uur ga ik naar huis.', translation: 'At twelve o\'clock I go home.' },
          { text: 'Ik ben blij met mijn aankopen van de markt.', translation: 'I am happy with my purchases from the market.' },
        ],
      },
    ],
  },
  {
    title: 'Een Reis naar Amsterdam',
    level: 'A2',
    topic: 'Visiting Amsterdam',
    paragraphs: [
      {
        sentences: [
          { text: 'Vorig jaar bezocht ik Amsterdam voor het eerst.', translation: 'Last year I visited Amsterdam for the first time.' },
          { text: 'Ik reisde met de trein vanuit Utrecht.', translation: 'I travelled by train from Utrecht.' },
          { text: 'De reis duurde ongeveer dertig minuten.', translation: 'The journey took about thirty minutes.' },
          { text: 'Op het Centraal Station was het erg druk.', translation: 'At Central Station it was very busy.' },
          { text: 'Ik nam de metro naar het centrum.', translation: 'I took the metro to the city centre.' },
        ],
      },
      {
        sentences: [
          { text: 'Amsterdam heeft prachtige grachten.', translation: 'Amsterdam has beautiful canals.' },
          { text: 'Ik maakte een rondvaart door de grachten.', translation: 'I took a canal boat tour.' },
          { text: 'De gids vertelde interessante verhalen over de stad.', translation: 'The guide told interesting stories about the city.' },
          { text: 'Ik zag veel oude grachtenpanden.', translation: 'I saw many old canal houses.' },
          { text: 'Ze zijn smal en hoog gebouwd.', translation: 'They are built narrow and tall.' },
        ],
      },
      {
        sentences: [
          { text: 'Daarna bezocht ik het Rijksmuseum.', translation: 'After that I visited the Rijksmuseum.' },
          { text: 'Het museum heeft schilderijen van Rembrandt en Vermeer.', translation: 'The museum has paintings by Rembrandt and Vermeer.' },
          { text: 'De Nachtwacht is het beroemdste schilderij.', translation: 'The Night Watch is the most famous painting.' },
          { text: 'Het schilderij is enorm groot.', translation: 'The painting is enormously large.' },
          { text: 'Ik stond er lang naar te kijken.', translation: 'I stood looking at it for a long time.' },
        ],
      },
      {
        sentences: [
          { text: "Op de Jordaan at ik een broodje haring.", translation: 'In the Jordaan I ate a herring sandwich.' },
          { text: 'Haring is een typisch Nederlands gerecht.', translation: 'Herring is a typical Dutch dish.' },
          { text: 'Het smaakte verrassend lekker.', translation: 'It tasted surprisingly good.' },
          { text: "Aan het einde van de dag nam ik de trein terug.", translation: 'At the end of the day I took the train back.' },
          { text: 'Ik wil zeker nog een keer naar Amsterdam.', translation: 'I definitely want to go to Amsterdam again.' },
        ],
      },
    ],
  },
  {
    title: 'Werken in een Café',
    level: 'A2',
    topic: 'Working in a café',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik werk drie dagen per week in een café.', translation: 'I work three days a week in a café.' },
          { text: 'Het café heet De Gouden Lepel.', translation: 'The café is called The Golden Spoon.' },
          { text: 'Het is een gezellig café in het centrum.', translation: 'It is a cosy café in the city centre.' },
          { text: 'Elke dag komen er veel klanten.', translation: 'Every day many customers come.' },
          { text: 'Ik begin mijn dienst om acht uur.', translation: 'I start my shift at eight o\'clock.' },
        ],
      },
      {
        sentences: [
          { text: 'Als eerste zet ik koffie.', translation: 'First of all I make coffee.' },
          { text: 'We hebben een grote espressomachine.', translation: 'We have a large espresso machine.' },
          { text: 'Ik leer hoe ik een cappuccino maak.', translation: 'I learn how to make a cappuccino.' },
          { text: 'De klanten bestellen ook thee en jus d\'orange.', translation: 'The customers also order tea and orange juice.' },
          { text: 'Ik schrijf de bestellingen op in een notitieboekje.', translation: 'I write the orders in a notebook.' },
        ],
      },
      {
        sentences: [
          { text: 'Tijdens de lunch is het heel druk.', translation: 'During lunch it is very busy.' },
          { text: 'Ik breng snel de borden naar de tafels.', translation: 'I quickly bring the plates to the tables.' },
          { text: 'Soms maak ik een fout met een bestelling.', translation: 'Sometimes I make a mistake with an order.' },
          { text: 'Dan zeg ik sorry en breng ik het juiste gerecht.', translation: 'Then I say sorry and bring the correct dish.' },
          { text: 'De meeste klanten zijn begripvol.', translation: 'Most customers are understanding.' },
        ],
      },
      {
        sentences: [
          { text: 'Na mijn dienst ruim ik de tafels op.', translation: 'After my shift I clear the tables.' },
          { text: 'Ik veeg de vloer en was de kopjes af.', translation: 'I sweep the floor and wash the cups.' },
          { text: 'Mijn collega\'s zijn aardig en helpen me graag.', translation: 'My colleagues are kind and happy to help me.' },
          { text: 'Ik verdien genoeg om mijn studie te betalen.', translation: 'I earn enough to pay for my studies.' },
          { text: 'Werken in het café is vermoeiend maar leuk.', translation: 'Working in the café is tiring but fun.' },
        ],
      },
    ],
  },
  {
    title: 'Sport en Gezondheid',
    level: 'A2',
    topic: 'Sports and healthy living',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik probeer elke dag te bewegen.', translation: 'I try to exercise every day.' },
          { text: 'Drie keer per week ga ik naar de sportschool.', translation: 'Three times a week I go to the gym.' },
          { text: 'Ik doe aan krachttraining en cardio.', translation: 'I do strength training and cardio.' },
          { text: 'Na het sporten voel ik me energiek.', translation: 'After exercising I feel energetic.' },
          { text: 'Sport is goed voor mijn gezondheid.', translation: 'Sport is good for my health.' },
        ],
      },
      {
        sentences: [
          { text: 'In het weekend speel ik voetbal met vrienden.', translation: 'At the weekend I play football with friends.' },
          { text: 'We spelen op een veld in het park.', translation: 'We play on a pitch in the park.' },
          { text: 'Ons team heet de Rode Leeuwen.', translation: 'Our team is called the Red Lions.' },
          { text: 'We trainen elke zaterdag twee uur.', translation: 'We train every Saturday for two hours.' },
          { text: 'Voetbal is mijn favoriete sport.', translation: 'Football is my favourite sport.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik let ook op mijn voeding.', translation: 'I also pay attention to my diet.' },
          { text: 'Ik eet veel groenten en fruit.', translation: 'I eat a lot of vegetables and fruit.' },
          { text: 'Ik probeer minder suiker te eten.', translation: 'I try to eat less sugar.' },
          { text: 'Ik drink elke dag twee liter water.', translation: 'I drink two litres of water every day.' },
          { text: 'Een gezond dieet geeft me meer energie.', translation: 'A healthy diet gives me more energy.' },
        ],
      },
      {
        sentences: [
          { text: 'Slapen is ook belangrijk voor de gezondheid.', translation: 'Sleep is also important for health.' },
          { text: 'Ik probeer acht uur per nacht te slapen.', translation: 'I try to sleep eight hours a night.' },
          { text: 'Voor het slapen lees ik een boek.', translation: 'Before sleeping I read a book.' },
          { text: 'Ik gebruik mijn telefoon niet meer in bed.', translation: 'I no longer use my phone in bed.' },
          { text: 'Ik voel me veel beter sinds ik gezonder leef.', translation: 'I feel much better since I started living healthier.' },
        ],
      },
    ],
  },
  {
    title: 'Een Nieuwe Baan',
    level: 'A2',
    topic: 'Starting a new job',
    paragraphs: [
      {
        sentences: [
          { text: 'Vorige maand begon ik aan een nieuwe baan.', translation: 'Last month I started a new job.' },
          { text: 'Ik werk nu als assistent bij een advocatenkantoor.', translation: 'I now work as an assistant at a law firm.' },
          { text: 'Het kantoor is in een groot gebouw in de stad.', translation: 'The office is in a large building in the city.' },
          { text: 'Op de eerste dag was ik erg zenuwachtig.', translation: 'On the first day I was very nervous.' },
          { text: 'Mijn nieuwe collega\'s waren gelukkig heel vriendelijk.', translation: 'My new colleagues were fortunately very friendly.' },
        ],
      },
      {
        sentences: [
          { text: 'Mijn baas heet mevrouw De Vries.', translation: 'My boss is called Mrs De Vries.' },
          { text: 'Ze legde alles geduldig aan me uit.', translation: 'She explained everything to me patiently.' },
          { text: 'Ik leer elke dag nieuwe dingen.', translation: 'I learn new things every day.' },
          { text: 'Mijn taken zijn e-mails beantwoorden en vergaderingen plannen.', translation: 'My tasks are answering emails and planning meetings.' },
          { text: 'Ik gebruik ook speciale software voor de administratie.', translation: 'I also use special software for the administration.' },
        ],
      },
      {
        sentences: [
          { text: 'Tijdens de lunchpauze eet ik met mijn collega\'s.', translation: 'During the lunch break I eat with my colleagues.' },
          { text: 'We praten over ons werk en ons privéleven.', translation: 'We talk about our work and our private lives.' },
          { text: 'Ik heb al een goede vriendin gemaakt op het werk.', translation: 'I have already made a good friend at work.' },
          { text: 'Ze heet Sophie en ze is erg grappig.', translation: 'Her name is Sophie and she is very funny.' },
          { text: 'We lunchen elke dag samen.', translation: 'We have lunch together every day.' },
        ],
      },
      {
        sentences: [
          { text: 'Na een maand voel ik me al meer op mijn gemak.', translation: 'After a month I already feel more at ease.' },
          { text: 'Ik ken de routines en de mensen beter.', translation: 'I know the routines and the people better.' },
          { text: 'Mijn baas zei dat ik het goed doe.', translation: 'My boss said that I am doing well.' },
          { text: 'Dat gaf me veel zelfvertrouwen.', translation: 'That gave me a lot of confidence.' },
          { text: 'Ik kijk uit naar de toekomst bij dit bedrijf.', translation: 'I look forward to the future at this company.' },
        ],
      },
    ],
  },
  {
    title: 'Het Strand in de Zomer',
    level: 'A1',
    topic: 'A day at the beach',
    paragraphs: [
      {
        sentences: [
          { text: 'In de zomer ga ik graag naar het strand.', translation: 'In summer I like to go to the beach.' },
          { text: 'Het strand is niet ver van ons huis.', translation: 'The beach is not far from our house.' },
          { text: 'We rijden met de auto naar het strand.', translation: 'We drive to the beach by car.' },
          { text: 'De rit duurt twintig minuten.', translation: 'The drive takes twenty minutes.' },
          { text: 'Ik ben altijd blij als we aankomen.', translation: 'I am always happy when we arrive.' },
        ],
      },
      {
        sentences: [
          { text: 'We zoeken een goede plek op het zand.', translation: 'We look for a good spot on the sand.' },
          { text: 'Ik leg een handdoek neer.', translation: 'I lay down a towel.' },
          { text: 'Mijn moeder smeert zonnebrandcrème op mijn rug.', translation: 'My mother puts sunscreen on my back.' },
          { text: 'De zon is warm en de lucht is blauw.', translation: 'The sun is warm and the sky is blue.' },
          { text: 'Ik hoor de golven van de zee.', translation: 'I hear the waves of the sea.' },
        ],
      },
      {
        sentences: [
          { text: 'Ik ga zwemmen in de zee.', translation: 'I go swimming in the sea.' },
          { text: 'Het water is koud maar verfrissend.', translation: 'The water is cold but refreshing.' },
          { text: 'Mijn broer bouwt een zandkasteel.', translation: 'My brother builds a sandcastle.' },
          { text: 'We spelen ook met een bal op het strand.', translation: 'We also play with a ball on the beach.' },
          { text: 'Het is een heerlijke dag.', translation: 'It is a wonderful day.' },
        ],
      },
      {
        sentences: [
          { text: 'Om de middag eten we een ijsje.', translation: 'At midday we eat an ice cream.' },
          { text: 'Ik kies altijd chocolade-ijs.', translation: 'I always choose chocolate ice cream.' },
          { text: 'Het ijs smelt snel in de zon.', translation: 'The ice cream melts quickly in the sun.' },
          { text: "Aan het einde van de dag gaan we naar huis.", translation: 'At the end of the day we go home.' },
          { text: 'Ik slaap altijd goed na een dag op het strand.', translation: 'I always sleep well after a day at the beach.' },
        ],
      },
    ],
  },
  {
    title: 'Leren Koken',
    level: 'A2',
    topic: 'Learning to cook Dutch food',
    paragraphs: [
      {
        sentences: [
          { text: 'Ik wil leren koken.', translation: 'I want to learn to cook.' },
          { text: 'Mijn oma is een geweldige kok.', translation: 'My grandmother is a wonderful cook.' },
          { text: 'Ze leert me traditionele Nederlandse gerechten.', translation: 'She teaches me traditional Dutch dishes.' },
          { text: 'Vandaag maken we stamppot.', translation: 'Today we make stamppot.' },
          { text: 'Stamppot is een typisch Hollands gerecht.', translation: 'Stamppot is a typical Dutch dish.' },
        ],
      },
      {
        sentences: [
          { text: 'We hebben aardappelen, boerenkool en rookworst nodig.', translation: 'We need potatoes, kale and smoked sausage.' },
          { text: 'Eerst schillen we de aardappelen.', translation: 'First we peel the potatoes.' },
          { text: 'Dan koken we ze in gezouten water.', translation: 'Then we cook them in salted water.' },
          { text: 'Ondertussen snijden we de boerenkool fijn.', translation: 'Meanwhile we chop the kale finely.' },
          { text: 'De rookworst verwarmen we in heet water.', translation: 'We heat the smoked sausage in hot water.' },
        ],
      },
      {
        sentences: [
          { text: 'Als de aardappelen gaar zijn, stampen we ze fijn.', translation: 'When the potatoes are cooked, we mash them.' },
          { text: 'We voegen boter en melk toe.', translation: 'We add butter and milk.' },
          { text: 'Dan mengen we de boerenkool erdoor.', translation: 'Then we mix the kale through it.' },
          { text: 'Mijn oma voegt ook een beetje nootmuskaat toe.', translation: 'My grandmother also adds a little nutmeg.' },
          { text: 'De stamppot ruikt heerlijk.', translation: 'The stamppot smells delicious.' },
        ],
      },
      {
        sentences: [
          { text: 'We serveren de stamppot met de rookworst ernaast.', translation: 'We serve the stamppot with the smoked sausage alongside.' },
          { text: 'Ik maak ook een jus van het kookvocht.', translation: 'I also make a gravy from the cooking liquid.' },
          { text: 'Het gerecht smaakt geweldig.', translation: 'The dish tastes amazing.' },
          { text: 'Mijn oma is trots op me.', translation: 'My grandmother is proud of me.' },
          { text: 'Ik ga dit gerecht vaker maken.', translation: 'I am going to make this dish more often.' },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function hydrateStory(raw: RawStory): Story {
  return {
    id: generateId(),
    title: raw.title,
    level: raw.level,
    topic: raw.topic,
    paragraphs: raw.paragraphs.map(
      (p): Paragraph => ({
        id: generateId(),
        sentences: p.sentences.map(
          (s): Sentence => ({ id: generateId(), text: s.text, translation: s.translation })
        ),
      })
    ),
  };
}

/**
 * Pick `count` stories from the pool that are not in `existingTitles`.
 * Falls back to any story if the pool is exhausted.
 */
function getDefaultStories(count: number, level: 'A1' | 'A2', existingTitles: string[]): Story[] {
  const normalised = existingTitles.map((t) => t.toLowerCase().trim());

  // Prefer stories of the requested level that haven't been shown yet
  const available = STORY_POOL.filter(
    (s) => s.level === level && !normalised.includes(s.title.toLowerCase().trim())
  );

  // If not enough, also include stories of the other level
  const fallback = STORY_POOL.filter(
    (s) => s.level !== level && !normalised.includes(s.title.toLowerCase().trim())
  );

  const candidates = [...available, ...fallback];

  // If we've shown everything, allow repeats (shuffle the full pool)
  const pool = candidates.length > 0 ? candidates : [...STORY_POOL];

  // Shuffle and take `count`
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(hydrateStory);
}

// ─────────────────────────────────────────────────────────────────────────────
// OpenAI story generation
// ─────────────────────────────────────────────────────────────────────────────

async function generateAIStories(
  count: number,
  level: 'A1' | 'A2',
  existingTitles: string[] = []
): Promise<Story[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('No OpenAI API key found, using default story pool');
    return getDefaultStories(count, level, existingTitles);
  }

  try {
    const avoidTitlesNote =
      existingTitles.length > 0
        ? `\n\nIMPORTANT: Do NOT generate stories with these titles or topics (they already exist):\n${existingTitles.map((t) => `- ${t}`).join('\n')}\nChoose completely different and unique topics.`
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
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a Dutch language teacher creating detailed learning stories. Always respond with valid JSON only. Stories must be at least 500 words each with multiple paragraphs.',
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
    return parsed.stories.map(
      (story: {
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
          sentences: para.sentences.map(
            (s: { text: string; translation: string }) =>
              ({
                id: generateId(),
                text: s.text,
                translation: s.translation,
              } as Sentence)
          ),
        } as Paragraph)),
      } as Story)
    );
  } catch (error) {
    console.error('Error generating AI stories:', error);
    return getDefaultStories(count, level, existingTitles);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 3, level = 'A1', existingTitles = [] } = body;

    const stories = await generateAIStories(count, level, existingTitles);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error in stories API:', error);
    return NextResponse.json(
      { error: 'Failed to generate stories', stories: getDefaultStories(3, 'A1', []) },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return default stories on GET request
  return NextResponse.json({ stories: getDefaultStories(3, 'A1', []) });
}
