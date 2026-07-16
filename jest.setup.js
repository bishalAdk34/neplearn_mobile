jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Supabase client is created at import time and requires env config;
// stub it so pure-logic modules that transitively import it stay testable.
jest.mock('./src/services/supabase', () => ({ supabase: {} }));
