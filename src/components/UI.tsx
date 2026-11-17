import { ReactNode } from 'react';
import { Image, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '@/src/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'ghost';
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, variant = 'primary', icon, disabled = false, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.buttonText, variant === 'ghost' && styles.ghostText]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, ...props }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

type SectionTitleProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export function SectionTitle({ title, action, onAction }: SectionTitleProps) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Avatar({ name, color = colors.primary, size = 48, uri }: { name: string; color?: string; size?: number; uri?: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`Foto de ${name}`}
      />
    );
  }

  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

export function StatusPill({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'yellow' }) {
  return <Text style={[styles.statusPill, styles[`pill_${tone}`]]}>{label}</Text>;
}

export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryDeep },
  success: { backgroundColor: colors.success },
  ghost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.line },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  buttonText: { color: colors.white, fontFamily: 'Inter_700Bold', fontSize: 15 },
  ghostText: { color: colors.primaryDark },
  fieldGroup: { gap: 8 },
  fieldLabel: { color: colors.primaryDeep, fontFamily: 'Inter_700Bold', fontSize: 13 },
  input: {
    minHeight: 52,
    borderRadius: radius.small,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ink,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingHorizontal: 16,
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontFamily: 'Inter_400Regular', fontSize: 12 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { color: colors.primaryDeep, fontFamily: 'Inter_700Bold', fontSize: 19 },
  sectionAction: { color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontFamily: 'Inter_700Bold' },
  statusPill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, fontFamily: 'Inter_700Bold', fontSize: 11 },
  pill_blue: { color: colors.primaryDark, backgroundColor: colors.primarySoft },
  pill_green: { color: colors.success, backgroundColor: colors.successSoft },
  pill_yellow: { color: colors.warning, backgroundColor: colors.warningSoft },
  divider: { height: 1, backgroundColor: colors.line },
});
