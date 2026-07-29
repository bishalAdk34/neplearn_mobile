import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useChatsStore } from '../stores/chats';
import { formatRelativeTime } from '../utils/relativeTime';
import type { StoredConversation } from '../services/db';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.82);

export const ChatDrawer = ({ visible, onClose, userId }: Props) => {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const conversations = useChatsStore(s => s.conversations);
  const currentConversationId = useChatsStore(s => s.currentConversationId);
  const switchConversation = useChatsStore(s => s.switchConversation);
  const newConversation = useChatsStore(s => s.newConversation);
  const rename = useChatsStore(s => s.rename);
  const remove = useChatsStore(s => s.remove);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(-DRAWER_WIDTH);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, damping: 25, stiffness: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      setEditingId(null);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 250, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const startRename = (item: StoredConversation) => {
    setEditingId(item.id);
    setEditingText(item.title);
  };

  const commitRename = () => {
    if (editingId && editingText.trim()) {
      rename(userId, editingId, editingText.trim());
    }
    setEditingId(null);
  };

  const confirmDelete = (item: StoredConversation) => {
    Alert.alert('Delete chat', `Delete "${item.title}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(userId, item.id) },
    ]);
  };

  const renderItem = ({ item }: { item: StoredConversation }) => {
    const isActive = item.id === currentConversationId;
    const isEditing = editingId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => !isEditing && switchConversation(userId, item.id)}
        className="flex-row items-center px-4 py-3 rounded-2xl mb-1"
        style={{ backgroundColor: isActive ? colors.mutedSurface : 'transparent' }}
      >
        <View className="flex-1 mr-2">
          {isEditing ? (
            <TextInput
              value={editingText}
              onChangeText={setEditingText}
              onSubmitEditing={commitRename}
              onBlur={commitRename}
              autoFocus
              className="text-base"
              style={{ color: colors.ink, padding: 0 }}
            />
          ) : (
            <>
              <Text numberOfLines={1} className="text-base" style={{ color: colors.ink, fontWeight: isActive ? '700' : '400' }}>
                {item.title}
              </Text>
              <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                {formatRelativeTime(item.updated_at)}
              </Text>
            </>
          )}
        </View>
        {!isEditing && (
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => startRename(item)} className="p-2">
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDelete(item)} className="p-2">
              <Ionicons name="trash" size={16} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none">
      <View className="flex-1 flex-row">
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            backgroundColor: colors.background,
            transform: [{ translateX: slideAnim }],
          }}
          className="h-full pt-14 px-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold" style={{ color: colors.ink }}>Chats</Text>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={22} color={colors.ink} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => newConversation(userId)}
            className="flex-row items-center justify-center py-3 rounded-full mb-4"
            style={{ backgroundColor: colors.primary }}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-1">New Chat</Text>
          </TouchableOpacity>

          {conversations.length === 0 ? (
            <Text className="text-center mt-8" style={{ color: colors.textTertiary }}>
              No chats yet
            </Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>

        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <Pressable className="flex-1 bg-black/40" onPress={handleClose} />
        </Animated.View>
      </View>
    </Modal>
  );
};
