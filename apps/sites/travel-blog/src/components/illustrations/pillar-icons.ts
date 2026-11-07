import { BookOpen, Compass, Globe, Heart, Shield, Sparkles, type LucideIcon } from 'lucide-react';

/** Decorative icons for the owner's value cards, cycled in order. */
export const PILLAR_ICONS: readonly LucideIcon[] = [
  Compass,
  Globe,
  Shield,
  Sparkles,
  BookOpen,
  Heart,
];

export function pillarIcon(index: number): LucideIcon {
  return PILLAR_ICONS[index % PILLAR_ICONS.length] ?? Sparkles;
}
