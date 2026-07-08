export type StoryParagraph = {
  nepali: string;
  roman: string;
  english: string;
};

export type StoryQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
};

export type Story = {
  id: string;
  title: string;
  nepaliTitle: string;
  emoji: string;
  level: 1 | 2 | 3;
  tag: string;
  minutes: number;
  insight?: { title: string; text: string };
  paragraphs: StoryParagraph[];
  questions: StoryQuestion[];
};

export const LEVEL_LABELS: Record<Story['level'], string> = {
  1: 'Beginner · A1',
  2: 'Elementary · A2',
  3: 'Intermediate · B1',
};

export const stories: Story[] = [
  {
    id: 'momo-shop',
    title: 'The Momo Shop',
    nepaliTitle: 'मम पसल',
    emoji: '🥟',
    level: 1,
    tag: 'DAILY LIFE',
    minutes: 3,
    paragraphs: [
      {
        nepali: 'राम काठमाडौंमा बस्छ। उसको सानो मम पसल छ।',
        roman: 'Ram Kathmanduma baschha. Usko sano momo pasal chha.',
        english: 'Ram lives in Kathmandu. He has a small momo shop.',
      },
      {
        nepali: 'बिहान ऊ तरकारी र मासु किन्छ। दिउँसो ऊ मम बनाउँछ।',
        roman: 'Bihana u tarkari ra masu kinchha. Diuso u momo banauchha.',
        english: 'In the morning he buys vegetables and meat. In the afternoon he makes momos.',
      },
      {
        nepali: 'उसको मम धेरै मिठो छ। मानिसहरू टाढाबाट खान आउँछन्।',
        roman: 'Usko momo dherai mitho chha. Manisharu taadhabata khana aauchhan.',
        english: 'His momos are very delicious. People come from far away to eat them.',
      },
      {
        nepali: 'साँझमा पसल खाली हुन्छ। राम खुशी हुन्छ र घर जान्छ।',
        roman: 'Saajhma pasal khali hunchha. Ram khushi hunchha ra ghar jaanchha.',
        english: 'In the evening the shop is empty. Ram is happy and goes home.',
      },
    ],
    insight: {
      title: 'Momo Culture',
      text: 'Momos are Nepal\'s favorite street food — steamed dumplings served with a spicy tomato chutney called achar. Every neighborhood in Kathmandu has its own beloved momo pasal.',
    },
    questions: [
      {
        question: 'Where does Ram live?',
        options: ['Kathmandu', 'Pokhara', 'Chitwan', 'Lumbini'],
        answerIndex: 0,
      },
      {
        question: 'What does Ram do in the afternoon?',
        options: ['Buys vegetables', 'Makes momos', 'Goes home', 'Plays football'],
        answerIndex: 1,
      },
      {
        question: 'Why do people come from far away?',
        options: ['The shop is big', 'The shop is cheap', 'The momos are delicious', 'Ram is famous'],
        answerIndex: 2,
      },
    ],
  },
  {
    id: 'yeti-legend',
    title: 'The Legend of the Yeti',
    nepaliTitle: 'हिममानवको कथा',
    emoji: '🏔️',
    level: 2,
    tag: 'FOLKLORE',
    minutes: 5,
    paragraphs: [
      {
        nepali: 'हिमालको माथि एउटा रहस्यमय प्राणी बस्छ। मानिसहरू त्यसलाई हिममानव भन्छन्।',
        roman: 'Himalko maathi euta rahasyamaya praani baschha. Manisharu tyaslai him-maanav bhanchhan.',
        english: 'High in the Himalayas lives a mysterious creature. People call it the Him-manav — the Yeti.',
      },
      {
        nepali: 'शेर्पा मानिसहरूका लागि हिममानव कथा मात्र होइन। ऊ अग्लो छ र उसको शरीरमा रातो-खैरो रौं छ।',
        roman: 'Sherpa manisharuka laagi him-maanav katha maatra hoina. U aglo chha ra usko sharirma raato-khairo raun chha.',
        english: 'For the Sherpa people, the Yeti is not just a story. He is tall, and his body is covered in reddish-brown hair.',
      },
      {
        nepali: 'मानिसहरू भन्छन् उसका खुट्टा उल्टो छन्। त्यसैले उसलाई पछ्याउन धेरै गाह्रो छ।',
        roman: 'Manisharu bhanchhan uska khutta ulto chhan. Tyasaile uslai pachhyauna dherai gaahro chha.',
        english: 'People say his feet point backwards. That is why it is very hard to track him.',
      },
      {
        nepali: 'शेर्पा परम्परामा हिममानव देख्नु ठूलो संकेत हो। ऊ हिमालको रक्षक हो।',
        roman: 'Sherpa paramparaama him-maanav dekhnu thulo sanket ho. U himalko rakshak ho.',
        english: 'In Sherpa tradition, seeing a Yeti is a powerful omen. He is the guardian of the mountains.',
      },
    ],
    insight: {
      title: 'The Guardian of the Pass',
      text: 'In Sherpa tradition, seeing a Yeti is considered a powerful spiritual omen. Monasteries in the Khumbu region, such as Khumjung, even claim to possess relics like Yeti scalps, preserving a deep reverence for these mountain spirits.',
    },
    questions: [
      {
        question: 'Where does the Yeti live?',
        options: ['By the sea', 'High in the Himalayas', 'In the city', 'In the jungle'],
        answerIndex: 1,
      },
      {
        question: 'What is special about the Yeti\'s feet?',
        options: ['They are very small', 'They are golden', 'They point backwards', 'They leave no tracks'],
        answerIndex: 2,
      },
      {
        question: 'What is the Yeti to the Sherpa people?',
        options: ['A dangerous enemy', 'A pet', 'A tourist attraction', 'A guardian of the mountains'],
        answerIndex: 3,
      },
    ],
  },
  {
    id: 'pokhara-trip',
    title: 'A Trip to Pokhara',
    nepaliTitle: 'पोखराको यात्रा',
    emoji: '🛶',
    level: 3,
    tag: 'TRAVEL',
    minutes: 5,
    paragraphs: [
      {
        nepali: 'गत हप्ता म पोखरा गएँ। बसबाट छ घण्टा लाग्यो।',
        roman: 'Gata haptaa ma Pokhara gaye. Bus-baata chha ghanta laagyo.',
        english: 'Last week I went to Pokhara. It took six hours by bus.',
      },
      {
        nepali: 'फेवा तालमा मैले डुङ्गा चलाएँ। पानीमा माछापुच्छ्रेको छाया देखिन्थ्यो।',
        roman: 'Phewa Taalma maile dungaa chalaaye. Paanima Machhapuchhreko chhaayaa dekhinthyo.',
        english: 'I rowed a boat on Phewa Lake. The reflection of Machhapuchhre could be seen in the water.',
      },
      {
        nepali: 'बिहान सबेरै म सराङकोट गएँ। त्यहाँबाट सूर्योदय हेरेँ। हिमाल सुनौलो देखियो।',
        roman: 'Bihaana saberai ma Sarangkot gaye. Tyahaabata suryodaya here. Himal sunaulo dekhiyo.',
        english: 'Early in the morning I went to Sarangkot. From there I watched the sunrise. The mountains looked golden.',
      },
      {
        nepali: 'फर्किने दिन मलाई नरमाइलो लाग्यो। म पक्कै फेरि पोखरा जान्छु।',
        roman: 'Pharkine din malai naramailo laagyo. Ma pakkai pheri Pokhara jaanchhu.',
        english: 'On the day I returned, I felt sad. I will definitely go to Pokhara again.',
      },
    ],
    insight: {
      title: 'City of Lakes',
      text: 'Pokhara sits beside Phewa Lake with the Annapurna range towering above. Machhapuchhre ("Fishtail Mountain") is considered sacred and has never been officially summited.',
    },
    questions: [
      {
        question: 'How long did the bus journey take?',
        options: ['Two hours', 'Four hours', 'Six hours', 'Ten hours'],
        answerIndex: 2,
      },
      {
        question: 'What could be seen in the water of Phewa Lake?',
        options: ['The reflection of Machhapuchhre', 'Many boats', 'Colorful fish', 'The sunset'],
        answerIndex: 0,
      },
      {
        question: 'Where did the narrator watch the sunrise?',
        options: ['Phewa Lake', 'Sarangkot', 'Kathmandu', 'The bus'],
        answerIndex: 1,
      },
    ],
  },
];

export const getStoryById = (id: string): Story | undefined =>
  stories.find(s => s.id === id);
