import { useRouter } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

export default function NotFound() {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center p-8">
      <Text className="text-2xl font-bold mb-4">Not Found</Text>
      <Text className="text-lg text-gray-600 mb-8 text-center">Could not find requested screen</Text>
      <TouchableOpacity onPress={() => router.push('/')} className="bg-blue-500 p-4 rounded-lg">
        <Text className="text-white font-bold">Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}
