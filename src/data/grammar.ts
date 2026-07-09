export interface GrammarExample {
  nepali: string;
  roman: string;
  english: string;
}

export interface GrammarTip {
  id: number;
  title: string;
  summary: string;
  explanation: string;
  examples: GrammarExample[];
}

export const grammarTips: GrammarTip[] = [
  {
    id: 1,
    title: 'Word Order: Subject-Object-Verb',
    summary: 'Nepali sentences put the verb last.',
    explanation:
      'Unlike English (Subject-Verb-Object), Nepali follows Subject-Object-Verb order. The verb always comes at the end of the sentence. "I eat rice" literally becomes "I rice eat".',
    examples: [
      { nepali: 'म भात खान्छु', roman: 'Ma bhaat khanchhu', english: 'I eat rice' },
      { nepali: 'उनी किताब पढ्छिन्', roman: 'Uni kitab padhchhin', english: 'She reads a book' },
      { nepali: 'हामी नेपाली सिक्छौं', roman: 'Haami Nepali sikchhaun', english: 'We learn Nepali' },
    ],
  },
  {
    id: 2,
    title: 'Postposition -मा (-ma): in / at / on',
    summary: '-ma attaches to nouns to mean "in", "at", or "on".',
    explanation:
      'Nepali uses postpositions instead of prepositions — they come after the noun. -ma covers English "in", "at", and "on". "In Kathmandu" becomes "Kathmandu-ma".',
    examples: [
      { nepali: 'म काठमाडौंमा बस्छु', roman: 'Ma Kathmandu-ma baschhu', english: 'I live in Kathmandu' },
      { nepali: 'किताब टेबलमा छ', roman: 'Kitab table-ma chha', english: 'The book is on the table' },
      { nepali: 'उनी स्कूलमा छिन्', roman: 'Uni school-ma chhin', english: 'She is at school' },
    ],
  },
  {
    id: 3,
    title: 'Postposition -बाट (-bata): from',
    summary: '-bata marks the source or origin, like English "from".',
    explanation:
      'Attach -bata to a noun to say where something comes from. It also marks the means of doing something ("by bus" = "bus-bata").',
    examples: [
      { nepali: 'म नेपालबाट आएको हुँ', roman: 'Ma Nepal-bata aayeko hun', english: 'I am from Nepal' },
      { nepali: 'उनी घरबाट आइन्', roman: 'Uni ghar-bata aain', english: 'She came from home' },
      { nepali: 'हामी बसबाट जान्छौं', roman: 'Haami bus-bata jaanchhaun', english: 'We go by bus' },
    ],
  },
  {
    id: 4,
    title: 'Postposition -लाई (-lai): to / for',
    summary: '-lai marks the person receiving an action.',
    explanation:
      '-lai marks the indirect object (the receiver) and often the direct object when it is a person. "Give the book to Ram" becomes "Ram-lai kitab dinus".',
    examples: [
      { nepali: 'रामलाई किताब दिनुहोस्', roman: 'Ram-lai kitab dinuhos', english: 'Please give the book to Ram' },
      { nepali: 'मलाई पानी चाहिन्छ', roman: 'Ma-lai paani chaahinchha', english: 'I need water' },
      { nepali: 'उसलाई मन पर्छ', roman: 'Us-lai man parchha', english: 'He likes it' },
    ],
  },
  {
    id: 5,
    title: 'Postposition -को (-ko): possession',
    summary: "-ko works like English 's (apostrophe-s).",
    explanation:
      "-ko shows possession or relationship: 'Ram-ko ghar' = Ram's house. It changes to -ki for feminine and -kaa for plural: 'meri aama' (my mother), 'mera saathiharu' (my friends).",
    examples: [
      { nepali: 'रामको घर', roman: 'Ram-ko ghar', english: "Ram's house" },
      { nepali: 'मेरो नाम', roman: 'Mero naam', english: 'My name' },
      { nepali: 'नेपालको राजधानी', roman: 'Nepal-ko rajdhani', english: 'The capital of Nepal' },
    ],
  },
  {
    id: 6,
    title: 'Present Tense Verbs: -छु / -छ / -छौं',
    summary: 'Verb endings change with the subject.',
    explanation:
      'Nepali verbs conjugate by person. From the root "khaa-" (eat): ma khaanchhu (I eat), timi khaanchhau (you eat), u khaanchha (he eats), haami khaanchhaun (we eat).',
    examples: [
      { nepali: 'म खान्छु', roman: 'Ma khanchhu', english: 'I eat' },
      { nepali: 'ऊ खान्छ', roman: 'U khanchha', english: 'He eats' },
      { nepali: 'हामी खान्छौं', roman: 'Haami khanchhaun', english: 'We eat' },
    ],
  },
  {
    id: 7,
    title: 'Honorifics: तँ / तिमी / तपाईं',
    summary: 'Three levels of "you" — pick the right one.',
    explanation:
      'Nepali has three second-person pronouns by respect level: "ta" (very informal, can be rude), "timi" (informal, friends/younger people), "tapaai" (polite, safe default). When unsure, always use tapaai.',
    examples: [
      { nepali: 'तपाईं कस्तो हुनुहुन्छ?', roman: 'Tapaai kasto hunuhunchha?', english: 'How are you? (polite)' },
      { nepali: 'तिमी कस्तो छौ?', roman: 'Timi kasto chhau?', english: 'How are you? (informal)' },
      { nepali: 'तपाईंको नाम के हो?', roman: 'Tapaai-ko naam ke ho?', english: 'What is your name? (polite)' },
    ],
  },
  {
    id: 8,
    title: 'Negation: -दैन / -दिनँ',
    summary: 'Negate verbs by changing the ending.',
    explanation:
      'To make a verb negative, the -chha ending changes to -daina (and -chhu to -dina for "I"). "Ma khanchhu" (I eat) becomes "Ma khaadina" (I do not eat). "Chha" (is) becomes "chhaina" (is not).',
    examples: [
      { nepali: 'म मासु खाँदिनँ', roman: 'Ma maasu khaadina', english: 'I do not eat meat' },
      { nepali: 'ऊ आउँदैन', roman: 'U aaudaina', english: 'He does not come' },
      { nepali: 'पानी छैन', roman: 'Paani chhaina', english: 'There is no water' },
    ],
  },
  {
    id: 9,
    title: 'Questions with के (ke) and Question Words',
    summary: 'Add "ke" or a question word — word order stays the same.',
    explanation:
      'Yes/no questions keep normal word order with rising intonation, often starting with "ke". Question words (ke = what, ko = who, kahaa = where, kahile = when, kina = why, kasari = how) go where the answer would appear.',
    examples: [
      { nepali: 'के तपाईं नेपाली बोल्नुहुन्छ?', roman: 'Ke tapaai Nepali bolnuhunchha?', english: 'Do you speak Nepali?' },
      { nepali: 'तपाईं कहाँ जानुहुन्छ?', roman: 'Tapaai kahaa jaanuhunchha?', english: 'Where are you going?' },
      { nepali: 'यो कति हो?', roman: 'Yo kati ho?', english: 'How much is this?' },
    ],
  },
  {
    id: 10,
    title: 'छ (chha) vs हो (ho): two kinds of "is"',
    summary: 'Use "ho" for identity, "chha" for state and location.',
    explanation:
      '"Ho" links two nouns (this IS a book). "Chha" describes state, location, or existence (the book IS on the table / there IS water). Mixing them up is the most common beginner mistake.',
    examples: [
      { nepali: 'यो किताब हो', roman: 'Yo kitab ho', english: 'This is a book' },
      { nepali: 'किताब यहाँ छ', roman: 'Kitab yahaa chha', english: 'The book is here' },
      { nepali: 'ऊ मेरो साथी हो', roman: 'U mero saathi ho', english: 'He is my friend' },
    ],
  },
  {
    id: 11,
    title: 'Formality Tiers: when to use which "you"',
    summary: 'ta = intimate/rude, timi = casual, tapaai = respectful.',
    explanation:
      'Choosing the wrong tier can offend. Use "tapaai" with strangers, elders, teachers, and in shops. Use "timi" with close friends, younger siblings, and children. "Ta" is only for very close same-age friends or small children — with anyone else it sounds insulting. Elders and in-laws often get the even higher "hajur".',
    examples: [
      { nepali: 'तपाईं आउनुहोस्', roman: 'Tapaai aaunuhos', english: 'Please come (respectful)' },
      { nepali: 'तिमी आऊ', roman: 'Timi aau', english: 'Come (casual, friends)' },
      { nepali: 'हजुर, भन्नुहोस्', roman: 'Hajur, bhannuhos', english: 'Yes sir/madam, please tell me (very respectful)' },
    ],
  },
  {
    id: 12,
    title: 'Verb Endings Follow Formality',
    summary: 'Same verb, different ending for ta / timi / tapaai.',
    explanation:
      'The verb ending must match the pronoun tier. For "go": tapaai jaanuhunchha (-nuhunchha), timi jaanchhau (-chhau), ta jaanchhas (-chhas). Commands change too: jaanuhos (polite), jaau (casual), jaa (blunt). If you use "tapaai" with a casual ending it sounds broken — keep pronoun and ending in the same tier.',
    examples: [
      { nepali: 'तपाईं खानुहुन्छ', roman: 'Tapaai khaanuhunchha', english: 'You eat (respectful)' },
      { nepali: 'तिमी खान्छौ', roman: 'Timi khaanchhau', english: 'You eat (casual)' },
      { nepali: 'तँ खान्छस्', roman: 'Ta khaanchhas', english: 'You eat (intimate/blunt)' },
    ],
  },
];
