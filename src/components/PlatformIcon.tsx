import type { Platform } from '../types';
import type { ReactNode } from 'react';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
}

export function PlatformIcon({ platform, className = 'w-5 h-5' }: PlatformIconProps) {
  const icons: Record<Platform, ReactNode> = {
    gmail: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  };

  const colors: Record<Platform, string> = {
    gmail: 'text-red-500',
  };

  return <span className={colors[platform]}>{icons[platform]}</span>;
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    gmail: 'Gmail',
  };
  return labels[platform];
}
