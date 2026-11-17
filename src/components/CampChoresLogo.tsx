import { Image, StyleSheet, View } from 'react-native';
import { colors } from '@/src/theme';

type LogoVariant = 'blue' | 'green' | 'white';

type CampChoresLogoProps = {
  variant?: LogoVariant;
  compact?: boolean;
};

const logoSource = require('../../assets/images/image.webp');

export function CampChoresLogo({ variant = 'blue', compact = false }: CampChoresLogoProps) {
  const cardColor = variant === 'green' ? '#F3FBF5' : colors.white;

  return (
    <View style={[styles.card, compact ? styles.compactCard : styles.fullCard, { backgroundColor: cardColor }]}>
      <Image source={logoSource} resizeMode="contain" style={[styles.image, compact ? styles.compactImage : styles.fullImage]} accessibilityLabel="Logo CampChores" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fullCard: {
    width: 250,
    height: 250,
    borderRadius: 28,
  },
  compactCard: {
    width: 68,
    height: 48,
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fullImage: {
    width: 250,
    height: 250,
  },
  compactImage: {
    width: 68,
    height: 68,
  },
});
