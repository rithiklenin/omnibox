import { useState, useCallback, useEffect } from 'react';
import type { Integration, Platform } from '../types';

const STORAGE_KEY = 'omnibox_integrations';

const VALID_PLATFORMS: Platform[] = ['gmail', 'slack'];

function loadIntegrations(): Integration[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Integration[] = JSON.parse(stored);
      const filtered = parsed.filter((i) => VALID_PLATFORMS.includes(i.platform));
      const defaults = getDefaultIntegrations();
      for (const def of defaults) {
        if (!filtered.some((i) => i.platform === def.platform)) {
          filtered.push(def);
        }
      }
      return filtered;
    }
  } catch {}
  return getDefaultIntegrations();
}

function saveIntegrations(integrations: Integration[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
}

function getDefaultIntegrations(): Integration[] {
  return [
    {
      id: 'int-gmail',
      platform: 'gmail',
      status: 'disconnected',
      lastSyncedAt: null,
      platformMetadata: {},
    },
    {
      id: 'int-slack',
      platform: 'slack',
      status: 'disconnected',
      lastSyncedAt: null,
      platformMetadata: {},
    },
  ];
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>(loadIntegrations);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveIntegrations(integrations);
  }, [integrations]);

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 200));
    setIntegrations(loadIntegrations());
    setLoading(false);
  }, []);

  const connectPlatform = useCallback((platform: Platform, metadata: Record<string, unknown>) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.platform === platform
          ? {
              ...i,
              status: 'connected' as const,
              lastSyncedAt: new Date().toISOString(),
              platformMetadata: metadata,
              syncError: undefined,
            }
          : i
      )
    );
  }, []);

  const disconnectIntegration = useCallback((platform: Platform) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.platform === platform
          ? {
              ...i,
              status: 'disconnected' as const,
              lastSyncedAt: null,
              platformMetadata: {},
              syncError: undefined,
            }
          : i
      )
    );
  }, []);

  const getIntegration = useCallback(
    (platform: Platform): Integration | undefined => {
      return integrations.find((i) => i.platform === platform);
    },
    [integrations]
  );

  return {
    integrations,
    loading,
    fetchIntegrations,
    connectPlatform,
    disconnectIntegration,
    getIntegration,
  };
}
