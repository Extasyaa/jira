import { useEffect, useState } from 'react';
import { Settings, defaultSettings } from '@jira/shared';
import { fetchSettings } from './api';

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((data) => setSettings(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { settings, setSettings, loading, error };
}
