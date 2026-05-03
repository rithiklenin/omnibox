import { useState, useCallback, useEffect } from 'react';
import type { Integration, Platform } from '../types';

const STORAGE_KEY = 'omnibox_integrations';

function loadIntegrations(): Integration[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Integration[] = JSON.parse(stored);
      const defaults = getDefaultIntegrations();
      for (const def of defaults) {
        if (!parsed.some((i) => i.platform === def.platform)) {
          parsed.push(def);
        }
      }
      return parsed;
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
