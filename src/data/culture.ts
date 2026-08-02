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
  {
    id: 7,
    emoji: '🥟',
    title: 'Ordering at a momo shop',
    summary: 'How to order politely — and share the plate.',
    explanation:
      'At a momo shop or restaurant, order with "tapaai" forms and the phrase "dinuhos" (please give). Ask how many plates, veg or buff (buffalo), and spice level. Meals are often shared — plates go in the middle and everyone eats together. Calling for the waiter with "dai/didi" is warm and normal. When you are done, just say "bill dinuhos".',
    examples: [
      { nepali: 'मोमो दुई प्लेट दिनुहोस्', roman: 'Momo dui plate dinuhos', english: 'Two plates of momos, please' },
      { nepali: 'के खानुहुन्छ?', roman: 'Ke khanuhunchha?', english: 'What would you like to eat?' },
      { nepali: 'बिल दिनुहोस्', roman: 'Bill dinuhos', english: 'The bill, please' },
    ],
  },
  {
    id: 8,
    emoji: '🙇',
    title: 'Showing respect to elders',
    summary: 'Bend, touch feet, ask for blessings — and never say "ta".',
    explanation:
      'When greeting elders, bend slightly with namaste, and close family often touch the elder\'s feet ("paau chhune") asking for blessings (aashirwad). Address elders with "hajur" or "dai/didi" — never their first name. Use the polite "tapaai" form only; "timi"/"ta" with an elder is rude. Always greet elders first, before anyone else in the room.',
    examples: [
      { nepali: 'पाउ छुन्छु, आशीर्वाद दिनुहोस्', roman: 'Pau chhunchhu, aashirwad dinuhos', english: 'I touch your feet, please bless me' },
      { nepali: 'कस्तो छ हजुर?', roman: 'Kasto chha hajur?', english: 'How are you, respected one?' },
      { nepali: 'हजुर, बाबु', roman: 'Hajur, baabu', english: 'Yes, dear (respectful reply)' },
    ],
  },
  {
    id: 9,
    emoji: '🎨',
    title: 'Holi: festival of colors',
    summary: 'Phagu Purnima — color, water balloons, and forgiveness.',
    explanation:
      'Holi (Feb–Mar) is the festival of colors marking the start of spring. Friends and strangers alike smear each other with colored powder (abeer) and squirt water. It is a great equalizer — everyone is fair game, and nobody gets offended. In the days before, watch Holika Dahan bonfires. Wearing old clothes is smart, and playing with abandon is the point.',
    examples: [
      { nepali: 'होलीको शुभकामना', roman: 'Holi ko shubhakamana', english: 'Happy Holi!' },
      { nepali: 'रंग लगाउने', roman: 'Rang lagaune', english: 'To play with colors' },
      { nepali: 'होलीमा रंगाउनुहुन्छ?', roman: 'Holi-ma rangaunuhunchha?', english: 'Will you play Holi?' },
    ],
  },
  {
    id: 10,
    emoji: '🍵',
    title: '"Have you eaten?" is a greeting',
    summary: '"Khana khanubhayo?" — food is care in Nepal.',
    explanation:
      'Asking "khana khanubhayo?" (have you eaten?) is a warm, everyday greeting — not really a question about your stomach. Expect to be offered chiya (tea) or food the moment you enter any home; refusing is fine, but accepting at least a little is polite. If you are full, say "bharien" with a smile. Tea is almost always worth saying yes to.',
    examples: [
      { nepali: 'खाना खानुभयो?', roman: 'Khana khanubhayo?', english: 'Have you eaten? (a common greeting)' },
      { nepali: 'चिया पिउनुहोस्', roman: 'Chiya piunuhos', english: 'Please have some tea' },
      { nepali: 'भरिएँ, धन्यवाद', roman: 'Bharien, dhanyabaad', english: 'I\'m full, thank you' },
    ],
  },
  {
    id: 11,
    emoji: '☀️',
    title: 'Chhath: the sun festival',
    summary: 'Terai\'s great river festival — arghya at sunrise.',
    explanation:
      'Chhath (Oct–Nov) is four days of fasting and devotion to the sun god Surya, celebrated big in Nepal\'s Terai and by Madhesi communities everywhere. Devotees stand waist-deep in rivers at sunrise and sunset offering arghya (water and offerings), after days of purification and fasting. Songs float across the water as families gather on the banks.',
    examples: [
      { nepali: 'छठ पर्वको शुभकामना', roman: 'Chhath parv-ko shubhakamana', english: 'Happy Chhath!' },
      { nepali: 'नदीमा अर्घ्य दिन्छु', roman: 'Nadi-ma arghya dinchhu', english: 'I offer arghya at the river' },
      { nepali: 'छठ व्रत बस्नुहुन्छ?', roman: 'Chhath brat basnuhunchha?', english: 'Are you keeping the Chhath fast?' },
    ],
  },
  {
    id: 12,
    emoji: '🎭',
    title: 'Indra Jatra: Kathmandu\'s street festival',
    summary: 'The living goddess Kumari rides out — and the demon mask dance.',
    explanation:
      'Indra Jatra (Sep) turns Kathmandu\'s old town into a procession-filled carnival. The living goddess Kumari is carried through the streets in a chariot — her only outing of the year. Masked Lakhe demons dance, the giant lingo pole rises at Hanuman Dhoka, and on the final day the sacred Bhoto (vest) is shown to the crowd. If you are in Kathmandu in September, do not miss it.',
    examples: [
      { nepali: 'इन्द्रजात्रा हेर्न जाने?', roman: 'Indra Jaatra herna jaane?', english: 'Going to see Indra Jatra?' },
      { nepali: 'कुमारीको रथ देख्नुभयो?', roman: 'Kumaari-ko rath dekh-nubhayo?', english: 'Did you see the Kumari\'s chariot?' },
      { nepali: 'लिङ्गो ठड्याइयो', roman: 'Lingo thadayiyo', english: 'The lingo pole has been raised' },
    ],
  },
];
