export interface SentenceExercise {
  id: number;
  english: string;
  /** Nepali tokens in correct order. */
  tokens: string[];
  roman: string;
  /** Extra wrong tokens mixed into the word bank. */
  distractors: string[];
  difficulty: 1 | 2 | 3;
}

export interface FillBlankExercise {
  id: number;
  /** Sentence parts around the blank: [before, after]. */
  nepaliParts: [string, string];
  answer: string;
  options: string[];
  english: string;
}

export const sentenceExercises: SentenceExercise[] = [
  {
    id: 1,
    english: 'I eat rice',
    tokens: ['म', 'भात', 'खान्छु'],
    roman: 'Ma bhaat khanchhu',
    distractors: ['पानी'],
    difficulty: 1,
  },
  {
    id: 2,
    english: 'This is a book',
    tokens: ['यो', 'किताब', 'हो'],
    roman: 'Yo kitab ho',
    distractors: ['छ'],
    difficulty: 1,
  },
  {
    id: 3,
    english: 'I drink water',
    tokens: ['म', 'पानी', 'पिउँछु'],
    roman: 'Ma paani piunchhu',
    distractors: ['खान्छु'],
    difficulty: 1,
  },
  {
    id: 4,
    english: 'He goes home',
    tokens: ['ऊ', 'घर', 'जान्छ'],
    roman: 'U ghar jaanchha',
    distractors: ['आउँछ'],
    difficulty: 1,
  },
  {
    id: 5,
    english: 'My name is Ram',
    tokens: ['मेरो', 'नाम', 'राम', 'हो'],
    roman: 'Mero naam Ram ho',
    distractors: ['छ'],
    difficulty: 1,
  },
  {
    id: 6,
    english: 'I live in Kathmandu',
    tokens: ['म', 'काठमाडौंमा', 'बस्छु'],
    roman: 'Ma Kathmandu-ma baschhu',
    distractors: ['काठमाडौंबाट', 'जान्छु'],
    difficulty: 2,
  },
  {
    id: 7,
    english: 'She reads a book',
    tokens: ['उनी', 'किताब', 'पढ्छिन्'],
    roman: 'Uni kitab padhchhin',
    distractors: ['लेख्छिन्'],
    difficulty: 2,
  },
  {
    id: 8,
    english: 'We learn Nepali',
    tokens: ['हामी', 'नेपाली', 'सिक्छौं'],
    roman: 'Haami Nepali sikchhaun',
    distractors: ['बोल्छौं'],
    difficulty: 2,
  },
  {
    id: 9,
    english: 'I do not eat meat',
    tokens: ['म', 'मासु', 'खाँदिनँ'],
    roman: 'Ma maasu khaadina',
    distractors: ['खान्छु'],
    difficulty: 2,
  },
  {
    id: 10,
    english: 'Where are you going?',
    tokens: ['तपाईं', 'कहाँ', 'जानुहुन्छ?'],
    roman: 'Tapaai kahaa jaanuhunchha?',
    distractors: ['कहिले'],
    difficulty: 2,
  },
  {
    id: 11,
    english: 'The book is on the table',
    tokens: ['किताब', 'टेबलमा', 'छ'],
    roman: 'Kitab table-ma chha',
    distractors: ['हो', 'टेबलबाट'],
    difficulty: 2,
  },
  {
    id: 12,
    english: 'Please give me water',
    tokens: ['मलाई', 'पानी', 'दिनुहोस्'],
    roman: 'Ma-lai paani dinuhos',
    distractors: ['लिनुहोस्'],
    difficulty: 3,
  },
  {
    id: 13,
    english: 'I came from Nepal',
    tokens: ['म', 'नेपालबाट', 'आएको', 'हुँ'],
    roman: 'Ma Nepal-bata aayeko hun',
    distractors: ['नेपालमा'],
    difficulty: 3,
  },
  {
    id: 14,
    english: 'How much is this?',
    tokens: ['यो', 'कति', 'हो?'],
    roman: 'Yo kati ho?',
    distractors: ['के'],
    difficulty: 1,
  },
  {
    id: 15,
    english: 'Do you speak Nepali?',
    tokens: ['के', 'तपाईं', 'नेपाली', 'बोल्नुहुन्छ?'],
    roman: 'Ke tapaai Nepali bolnuhunchha?',
    distractors: ['सुन्नुहुन्छ?'],
    difficulty: 3,
  },
];

export const fillBlankExercises: FillBlankExercise[] = [
  {
    id: 1,
    nepaliParts: ['म भात ', ''],
    answer: 'खान्छु',
    options: ['खान्छु', 'खान्छ', 'खान्छौं', 'खाँदिनँ'],
    english: 'I eat rice',
  },
  {
    id: 2,
    nepaliParts: ['यो किताब ', ''],
    answer: 'हो',
    options: ['हो', 'छ', 'छैन', 'हुन्छ'],
    english: 'This is a book',
  },
  {
    id: 3,
    nepaliParts: ['किताब टेबल', ' छ'],
    answer: 'मा',
    options: ['मा', 'बाट', 'लाई', 'को'],
    english: 'The book is on the table',
  },
  {
    id: 4,
    nepaliParts: ['म नेपाल', ' आएको हुँ'],
    answer: 'बाट',
    options: ['बाट', 'मा', 'को', 'लाई'],
    english: 'I came from Nepal',
  },
  {
    id: 5,
    nepaliParts: ['राम', ' किताब दिनुहोस्'],
    answer: 'लाई',
    options: ['लाई', 'बाट', 'मा', 'ले'],
    english: 'Please give the book to Ram',
  },
  {
    id: 6,
    nepaliParts: ['', ' नाम के हो?'],
    answer: 'तपाईंको',
    options: ['तपाईंको', 'तपाईंलाई', 'तपाईंमा', 'तपाईंबाट'],
    english: 'What is your name?',
  },
  {
    id: 7,
    nepaliParts: ['ऊ ', ''],
    answer: 'आउँदैन',
    options: ['आउँदैन', 'आउँछ', 'आउनुहुन्छ', 'आयो'],
    english: 'He does not come',
  },
  {
    id: 8,
    nepaliParts: ['पानी ', ''],
    answer: 'छैन',
    options: ['छैन', 'होइन', 'छ', 'हो'],
    english: 'There is no water',
  },
  {
    id: 9,
    nepaliParts: ['हामी बस', ' जान्छौं'],
    answer: 'बाट',
    options: ['बाट', 'मा', 'लाई', 'को'],
    english: 'We go by bus',
  },
  {
    id: 10,
    nepaliParts: ['नेपाल', ' राजधानी काठमाडौं हो'],
    answer: 'को',
    options: ['को', 'मा', 'बाट', 'लाई'],
    english: 'The capital of Nepal is Kathmandu',
  },
];
