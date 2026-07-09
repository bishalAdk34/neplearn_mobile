export interface CultureExample {
  nepali: string;
  roman: string;
  english: string;
}

export interface CultureCard {
  id: number;
  emoji: string;
  title: string;
  summary: string;
  explanation: string;
  examples: CultureExample[];
}

export const cultureCards: CultureCard[] = [
  {
    id: 1,
    emoji: '🙏',
    title: 'Namaste: more than hello',
    summary: 'Palms together, slight bow — greeting and respect in one.',
    explanation:
      'Namaste (or the more respectful "namaskar") is said with palms pressed together at the chest. It works for hello and goodbye, at any time of day, with anyone. Elders are greeted first. Handshakes are common in cities, but namaste is always safe and appreciated.',
    examples: [
      { nepali: 'नमस्ते', roman: 'Namaste', english: 'Hello / greetings' },
      { nepali: 'नमस्कार', roman: 'Namaskar', english: 'Respectful greeting' },
      { nepali: 'नमस्ते, फेरि भेटौंला', roman: 'Namaste, pheri bhetaunla', english: 'Goodbye, see you again' },
    ],
  },
  {
    id: 2,
    emoji: '🎉',
    title: 'Dashain: the biggest festival',
    summary: '15 days honoring goddess Durga — family, blessings, kites.',
    explanation:
      'Dashain (Sep–Oct) is Nepal\'s longest and most important festival. Families reunite, elders place tika (rice, yogurt, vermilion) on foreheads of the young and give blessings and money (dakshina). Expect kites, bamboo swings (ping), and goat feasts. Most offices close for a week or more.',
    examples: [
      { nepali: 'विजया दशमीको शुभकामना', roman: 'Vijaya Dashami-ko shubhakamana', english: 'Happy Dashain' },
      { nepali: 'टीका लगाउनुहोस्', roman: 'Tika lagaaunuhos', english: 'Please put on the tika' },
      { nepali: 'दशैंमा घर जान्छु', roman: 'Dashain-ma ghar jaanchhu', english: 'I go home for Dashain' },
    ],
  },
  {
    id: 3,
    emoji: '🪔',
    title: 'Tihar: festival of lights',
    summary: 'Five days honoring crows, dogs, cows — and siblings.',
    explanation:
      'Tihar follows Dashain. Homes glow with oil lamps (diyo) and marigolds. Each day honors a different being: crows, dogs (kukur tihar), cows, and oneself. The final day, Bhai Tika, celebrates the bond between brothers and sisters. Girls sing "bhailo", boys sing "deusi" door-to-door.',
    examples: [
      { nepali: 'तिहारको शुभकामना', roman: 'Tihar-ko shubhakamana', english: 'Happy Tihar' },
      { nepali: 'दियो बाल्नुहोस्', roman: 'Diyo baalnuhos', english: 'Please light the lamp' },
      { nepali: 'भाइटीका कहिले हो?', roman: 'Bhai tika kahile ho?', english: 'When is Bhai Tika?' },
    ],
  },
  {
    id: 4,
    emoji: '👞',
    title: 'Shoes off indoors',
    summary: 'Always remove shoes before entering homes and temples.',
    explanation:
      'Shoes are considered impure. Remove them before entering any home, temple, or monastery — look for shoes piled at the door as your cue. Never point your feet at people, deities, or the hearth, and avoid stepping over someone\'s legs or body.',
    examples: [
      { nepali: 'जुत्ता बाहिर खोल्नुहोस्', roman: 'Jutta baahira kholnuhos', english: 'Please take your shoes off outside' },
      { nepali: 'भित्र आउनुहोस्', roman: 'Bhitra aaunuhos', english: 'Please come in' },
      { nepali: 'मन्दिरमा जुत्ता लगाउन हुँदैन', roman: 'Mandir-ma jutta lagaauna hudaina', english: 'Shoes are not allowed in the temple' },
    ],
  },
  {
    id: 5,
    emoji: '🍚',
    title: 'Jutho: food purity rules',
    summary: 'Food touched by your mouth or plate becomes "jutho".',
    explanation:
      'Once food touches your lips, plate, or hand-while-eating, it is jutho (ritually impure) and should not be offered to others or returned to shared dishes. Don\'t drink from a shared bottle by touching it to your lips — pour instead. Don\'t take food from someone else\'s plate.',
    examples: [
      { nepali: 'यो जुठो भयो', roman: 'Yo jutho bhayo', english: 'This has become jutho' },
      { nepali: 'छुट्टै थालमा दिनुहोस्', roman: 'Chhuttai thaal-ma dinuhos', english: 'Please give it on a separate plate' },
      { nepali: 'नछोई खानुहोस्', roman: 'Nachhoi khaanuhos', english: 'Drink without touching (the bottle)' },
    ],
  },
  {
    id: 6,
    emoji: '🤲',
    title: 'Right hand for giving and eating',
    summary: 'Eat, give, and receive with the right hand.',
    explanation:
      'The left hand is considered unclean. Eat dal bhat with your right hand, and give or receive money, gifts, and food with the right hand (or both hands for extra respect). Wash hands before and after meals — most Nepali food is eaten without cutlery at home.',
    examples: [
      { nepali: 'दाहिने हातले खानुहोस्', roman: 'Daahine haat-le khaanuhos', english: 'Please eat with the right hand' },
      { nepali: 'दुवै हातले दिनुहोस्', roman: 'Duvai haat-le dinuhos', english: 'Give with both hands (respectful)' },
      { nepali: 'खाना अगाडि हात धुनुहोस्', roman: 'Khaana agaadi haat dhunuhos', english: 'Wash your hands before the meal' },
    ],
  },
];
