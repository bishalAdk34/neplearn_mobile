export type Phrase = {
  id: number;
  nepali: string;
  roman: string;
  english: string;
  category: string;
};

export const phrases: Phrase[] = [
  { id: 1, nepali: 'विजया दशमी को शुभकामना', roman: 'Vijaya Dashami ko Shuvakamana', english: 'Happy Vijaya Dashami!', category: 'greetings' },
  { id: 2, nepali: 'दशैं को शुभकामना', roman: 'Dashain ko Shuvakamana', english: 'Best wishes for Dashain', category: 'greetings' },
  { id: 3, nepali: 'तपाईंलाई दशैं को शुभकामना', roman: 'Tapailai Dashain ko Shuvakamana', english: 'Wishing you a happy Dashain', category: 'greetings' },
  { id: 4, nepali: 'मेरो दशैं रमाइलो छ', roman: 'Mero Dashain ramailo chha', english: 'My Dashain is fun', category: 'festival' },
  { id: 5, nepali: 'टीका लगाउनुहुन्छ?', roman: 'Tika lagaaunuhunchha?', english: 'Will you receive tika?', category: 'festival' },
  { id: 6, nepali: 'घर जानुहुन्छ?', roman: 'Ghar jaanuhunchha?', english: 'Are you going home?', category: 'festival' },
  { id: 7, nepali: 'नयाँ लुगा किन्ने', roman: 'Naya luga kinne', english: 'Buying new clothes', category: 'festival' },
  { id: 8, nepali: 'पिङ खेल्ने', roman: 'Pinga khelne', english: 'Playing on the swing', category: 'festival' },
  { id: 9, nepali: 'मिठाई खाने', roman: 'Mithaai khaane', english: 'Eating sweets', category: 'festival' },
  { id: 10, nepali: 'आशीर्वाद लिने', roman: 'Aashirwad line', english: 'Receiving blessings', category: 'festival' },
];
