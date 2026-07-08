export type Phrase = {
  id: number;
  nepali: string;
  roman: string;
  english: string;
  category: string;
};

export const PHRASE_CATEGORIES: { key: string; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '✨' },
  { key: 'greetings', label: 'Greetings', emoji: '🙏' },
  { key: 'everyday', label: 'Everyday', emoji: '💬' },
  { key: 'food', label: 'Food', emoji: '🍛' },
  { key: 'directions', label: 'Directions', emoji: '🧭' },
  { key: 'shopping', label: 'Shopping', emoji: '🛍️' },
  { key: 'emergency', label: 'Emergency', emoji: '🚨' },
  { key: 'smalltalk', label: 'Small Talk', emoji: '🗣️' },
  { key: 'festival', label: 'Festival', emoji: '🎉' },
];

export const phrases: Phrase[] = [
  // Festival & festival greetings
  { id: 1, nepali: 'विजया दशमी को शुभकामना', roman: 'Vijaya Dashami ko Shuvakamana', english: 'Happy Vijaya Dashami!', category: 'festival' },
  { id: 2, nepali: 'दशैं को शुभकामना', roman: 'Dashain ko Shuvakamana', english: 'Best wishes for Dashain', category: 'festival' },
  { id: 3, nepali: 'तपाईंलाई दशैं को शुभकामना', roman: 'Tapailai Dashain ko Shuvakamana', english: 'Wishing you a happy Dashain', category: 'festival' },
  { id: 4, nepali: 'मेरो दशैं रमाइलो छ', roman: 'Mero Dashain ramailo chha', english: 'My Dashain is fun', category: 'festival' },
  { id: 5, nepali: 'टीका लगाउनुहुन्छ?', roman: 'Tika lagaaunuhunchha?', english: 'Will you receive tika?', category: 'festival' },
  { id: 6, nepali: 'घर जानुहुन्छ?', roman: 'Ghar jaanuhunchha?', english: 'Are you going home?', category: 'festival' },
  { id: 7, nepali: 'नयाँ लुगा किन्ने', roman: 'Naya luga kinne', english: 'Buying new clothes', category: 'festival' },
  { id: 8, nepali: 'पिङ खेल्ने', roman: 'Pinga khelne', english: 'Playing on the swing', category: 'festival' },
  { id: 9, nepali: 'मिठाई खाने', roman: 'Mithaai khaane', english: 'Eating sweets', category: 'festival' },
  { id: 10, nepali: 'आशीर्वाद लिने', roman: 'Aashirwad line', english: 'Receiving blessings', category: 'festival' },

  // Greetings
  { id: 11, nepali: 'नमस्ते', roman: 'Namaste', english: 'Hello / Greetings', category: 'greetings' },
  { id: 12, nepali: 'तपाईंलाई कस्तो छ?', roman: 'Tapailai kasto chha?', english: 'How are you?', category: 'greetings' },
  { id: 13, nepali: 'मलाई सन्चै छ', roman: 'Malai sanchai chha', english: 'I am fine', category: 'greetings' },
  { id: 14, nepali: 'शुभ प्रभात', roman: 'Shubha prabhat', english: 'Good morning', category: 'greetings' },
  { id: 15, nepali: 'शुभ रात्री', roman: 'Shubha raatri', english: 'Good night', category: 'greetings' },
  { id: 16, nepali: 'फेरि भेटौंला', roman: 'Pheri bhetaula', english: 'See you again', category: 'greetings' },
  { id: 17, nepali: 'तपाईंको नाम के हो?', roman: 'Tapaiko naam ke ho?', english: 'What is your name?', category: 'greetings' },
  { id: 18, nepali: 'मेरो नाम जोन हो', roman: 'Mero naam John ho', english: 'My name is John', category: 'greetings' },
  { id: 19, nepali: 'तपाईंसँग भेटेर खुशी लाग्यो', roman: 'Tapaisanga bhetera khushi lagyo', english: 'Nice to meet you', category: 'greetings' },

  // Everyday
  { id: 20, nepali: 'धन्यवाद', roman: 'Dhanyabaad', english: 'Thank you', category: 'everyday' },
  { id: 21, nepali: 'माफ गर्नुहोस्', roman: 'Maaph garnuhos', english: 'Excuse me / Sorry', category: 'everyday' },
  { id: 22, nepali: 'हुन्छ', roman: 'Hunchha', english: 'Okay / Sure', category: 'everyday' },
  { id: 23, nepali: 'हुँदैन', roman: 'Hudaina', english: 'No, that will not do', category: 'everyday' },
  { id: 24, nepali: 'मलाई थाहा छैन', roman: 'Malai thaha chhaina', english: 'I do not know', category: 'everyday' },
  { id: 25, nepali: 'बिस्तारै बोल्नुहोस्', roman: 'Bistarai bolnuhos', english: 'Please speak slowly', category: 'everyday' },
  { id: 26, nepali: 'मैले बुझिनँ', roman: 'Maile bujhina', english: 'I did not understand', category: 'everyday' },
  { id: 27, nepali: 'तपाईं अंग्रेजी बोल्नुहुन्छ?', roman: 'Tapai angreji bolnuhunchha?', english: 'Do you speak English?', category: 'everyday' },
  { id: 28, nepali: 'एकछिन पर्खनुहोस्', roman: 'Ekchhin parkhanuhos', english: 'Please wait a moment', category: 'everyday' },
  { id: 29, nepali: 'मलाई मद्दत चाहिन्छ', roman: 'Malai maddat chahinchha', english: 'I need help', category: 'everyday' },
  { id: 30, nepali: 'यो के हो?', roman: 'Yo ke ho?', english: 'What is this?', category: 'everyday' },

  // Food
  { id: 31, nepali: 'मलाई भोक लाग्यो', roman: 'Malai bhok lagyo', english: 'I am hungry', category: 'food' },
  { id: 32, nepali: 'मलाई तिर्खा लाग्यो', roman: 'Malai tirkha lagyo', english: 'I am thirsty', category: 'food' },
  { id: 33, nepali: 'खाना मिठो छ', roman: 'Khana mitho chha', english: 'The food is delicious', category: 'food' },
  { id: 34, nepali: 'पानी दिनुहोस्', roman: 'Paani dinuhos', english: 'Please give me water', category: 'food' },
  { id: 35, nepali: 'मेनु दिनुहोस्', roman: 'Menu dinuhos', english: 'Please give me the menu', category: 'food' },
  { id: 36, nepali: 'म शाकाहारी हुँ', roman: 'Ma shakahari hu', english: 'I am vegetarian', category: 'food' },
  { id: 37, nepali: 'यो धेरै पिरो छ', roman: 'Yo dherai piro chha', english: 'This is very spicy', category: 'food' },
  { id: 38, nepali: 'बिल दिनुहोस्', roman: 'Bill dinuhos', english: 'Please bring the bill', category: 'food' },
  { id: 39, nepali: 'एक कप चिया दिनुहोस्', roman: 'Ek cup chiya dinuhos', english: 'One cup of tea, please', category: 'food' },
  { id: 40, nepali: 'दाल भात खाऔं', roman: 'Daal bhaat khaau', english: 'Let us eat daal bhaat', category: 'food' },

  // Directions
  { id: 41, nepali: 'शौचालय कहाँ छ?', roman: 'Shauchalaya kahaa chha?', english: 'Where is the toilet?', category: 'directions' },
  { id: 42, nepali: 'बसपार्क कहाँ छ?', roman: 'Bus park kahaa chha?', english: 'Where is the bus station?', category: 'directions' },
  { id: 43, nepali: 'यहाँबाट कति टाढा छ?', roman: 'Yahaabata kati taadha chha?', english: 'How far is it from here?', category: 'directions' },
  { id: 44, nepali: 'दायाँ जानुहोस्', roman: 'Daayaa jaanuhos', english: 'Go right', category: 'directions' },
  { id: 45, nepali: 'बायाँ जानुहोस्', roman: 'Baayaa jaanuhos', english: 'Go left', category: 'directions' },
  { id: 46, nepali: 'सिधा जानुहोस्', roman: 'Sidha jaanuhos', english: 'Go straight', category: 'directions' },
  { id: 47, nepali: 'म हराएँ', roman: 'Ma haraye', english: 'I am lost', category: 'directions' },
  { id: 48, nepali: 'नजिकै छ', roman: 'Najikai chha', english: 'It is nearby', category: 'directions' },

  // Shopping
  { id: 49, nepali: 'यो कति हो?', roman: 'Yo kati ho?', english: 'How much is this?', category: 'shopping' },
  { id: 50, nepali: 'धेरै महँगो भयो', roman: 'Dherai mahango bhayo', english: 'That is too expensive', category: 'shopping' },
  { id: 51, nepali: 'अलि सस्तो गर्नुहोस्', roman: 'Ali sasto garnuhos', english: 'Please make it a bit cheaper', category: 'shopping' },
  { id: 52, nepali: 'म यो किन्छु', roman: 'Ma yo kinchhu', english: 'I will buy this', category: 'shopping' },
  { id: 53, nepali: 'मलाई यो मन पर्‍यो', roman: 'Malai yo man paryo', english: 'I like this', category: 'shopping' },
  { id: 54, nepali: 'अर्को रङ छ?', roman: 'Arko rang chha?', english: 'Do you have another color?', category: 'shopping' },
  { id: 55, nepali: 'पैसा फिर्ता दिनुहोस्', roman: 'Paisa phirta dinuhos', english: 'Please give me the change', category: 'shopping' },

  // Emergency
  { id: 56, nepali: 'मलाई सहयोग गर्नुहोस्!', roman: 'Malai sahayog garnuhos!', english: 'Help me!', category: 'emergency' },
  { id: 57, nepali: 'प्रहरी बोलाउनुहोस्', roman: 'Prahari bolaunuhos', english: 'Call the police', category: 'emergency' },
  { id: 58, nepali: 'डाक्टर चाहियो', roman: 'Doctor chahiyo', english: 'I need a doctor', category: 'emergency' },
  { id: 59, nepali: 'अस्पताल कहाँ छ?', roman: 'Aspatal kahaa chha?', english: 'Where is the hospital?', category: 'emergency' },
  { id: 60, nepali: 'मलाई सन्चो छैन', roman: 'Malai sancho chhaina', english: 'I am not feeling well', category: 'emergency' },
  { id: 61, nepali: 'दुर्घटना भयो', roman: 'Durghatana bhayo', english: 'There has been an accident', category: 'emergency' },

  // Small talk
  { id: 62, nepali: 'तपाईं कहाँबाट आउनुभयो?', roman: 'Tapai kahaabata aaunubhayo?', english: 'Where are you from?', category: 'smalltalk' },
  { id: 63, nepali: 'म अमेरिकाबाट आएको हुँ', roman: 'Ma America-bata aayeko hu', english: 'I am from America', category: 'smalltalk' },
  { id: 64, nepali: 'नेपाल धेरै राम्रो छ', roman: 'Nepal dherai ramro chha', english: 'Nepal is very beautiful', category: 'smalltalk' },
  { id: 65, nepali: 'आज मौसम राम्रो छ', roman: 'Aaja mausam ramro chha', english: 'The weather is nice today', category: 'smalltalk' },
  { id: 66, nepali: 'तपाईं के काम गर्नुहुन्छ?', roman: 'Tapai ke kaam garnuhunchha?', english: 'What do you do for work?', category: 'smalltalk' },
  { id: 67, nepali: 'मलाई नेपाली सिक्न मन लाग्छ', roman: 'Malai Nepali sikna man lagchha', english: 'I want to learn Nepali', category: 'smalltalk' },
  { id: 68, nepali: 'पछि भेटौंला', roman: 'Pachhi bhetaula', english: 'See you later', category: 'smalltalk' },
];

export const getPhrasesByCategory = (category: string): Phrase[] =>
  category === 'all' ? phrases : phrases.filter(p => p.category === category);
