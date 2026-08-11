import React, { type ComponentProps } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme';
import { hapticLight } from '../../utils/haptics';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';
type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  title?: string;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
}

const sizeStyles: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
  md: { paddingVertical: 12, paddingHorizontal: 20, fontSize: 16 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 18 },
};

export default function Button({
  title,
  icon,
  iconPosition = 'left',
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  haptic = true,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: sizeStyles[size].paddingVertical,
    paddingHorizontal: sizeStyles[size].paddingHorizontal,
    opacity: isDisabled ? 0.6 : 1,
  };

  const textStyle: TextStyle = {
    fontWeight: '700',
    fontSize: sizeStyles[size].fontSize,
  };

  switch (variant) {
    case 'primary':
      containerStyle.backgroundColor = isDisabled ? colors.disabled : colors.primary;
      textStyle.color = '#FFFFFF';
      break;
    case 'secondary':
      containerStyle.backgroundColor = colors.border;
      textStyle.color = colors.ink;
      break;
    case 'outline':
      containerStyle.backgroundColor = colors.surface;
      containerStyle.borderWidth = 1;
      containerStyle.borderColor = colors.border;
      textStyle.color = colors.ink;
      break;
    case 'ghost':
      containerStyle.backgroundColor = 'transparent';
      textStyle.color = colors.primary;
      break;
    case 'danger':
      containerStyle.backgroundColor = isDisabled ? colors.disabled : colors.danger;
      textStyle.color = '#FFFFFF';
      break;
    case 'success':
      containerStyle.backgroundColor = isDisabled ? colors.disabled : colors.success;
      textStyle.color = '#FFFFFF';
      break;
  }

  const handlePress = () => {
    if (haptic) hapticLight();
    onPress();
  };

  return (
    <TouchableOpacity
      style={[containerStyle, style]}
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' || variant === 'secondary' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizeStyles[size].fontSize + 4}
              color={textStyle.color}
              style={{ marginRight: title ? 8 : 0 }}
            />
          )}
          {title ? <Text style={textStyle}>{title}</Text> : null}
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizeStyles[size].fontSize + 4}
              color={textStyle.color}
              style={{ marginLeft: title ? 8 : 0 }}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
