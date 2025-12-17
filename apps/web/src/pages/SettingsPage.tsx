import { useEffect, useState } from 'react';
import { ColorRule, ColumnConfig, Settings, defaultSettings, defaultColorRules, defaultColumns } from '@jira/shared';
import { fetchSettings, saveSettings, health } from '../lib/api';
import './settings.css';

const SettingsPage = () => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveSettings(settings);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1500);
  };

  const testConnection = async () => {
    const res = await health(settings);
    setStatus(res.ok ? `Connected as ${res.user?.displayName || 'user'}` : 'Failed to connect');
  };

  const updateColorRule = (idx: number, next: Partial<ColorRule>) => {
    const updated = [...(settings.colorRules || defaultColorRules)];
    updated[idx] = { ...updated[idx], ...next } as ColorRule;
    setSettings({ ...settings, colorRules: updated });
  };

  const addStatusColumn = () => {
    setSettings({ ...settings, statuses: [...(settings.statuses || defaultColumns), { id: `col-${Date.now()}`, name: 'New', statuses: [] }] });
  };

  return (
    <div className="settings-grid">
      <form className="glass card" onSubmit={onSubmit}>
        <h2>Connection</h2>
        <div className="form-row form-two">
          <div>
            <label>Jira Base URL</label>
            <input value={settings.baseUrl} onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })} required />
          </div>
          <div>
            <label>Username (for Basic auth)</label>
            <input value={settings.username || ''} onChange={(e) => setSettings({ ...settings, username: e.target.value })} />
          </div>
        </div>
        <div className="form-row form-two">
          <div>
            <label>API Token / PAT</label>
            <input value={settings.apiToken} onChange={(e) => setSettings({ ...settings, apiToken: e.target.value })} required />
          </div>
          <div>
            <label>Filter ID</label>
            <input value={settings.filterId || ''} onChange={(e) => setSettings({ ...settings, filterId: e.target.value })} />
          </div>
        </div>
        <div className="form-row form-two">
          <div>
            <label>JQL</label>
            <input value={settings.jql} onChange={(e) => setSettings({ ...settings, jql: e.target.value })} />
          </div>
          <div>
            <label>Due date field</label>
            <input value={settings.dueDateField || ''} onChange={(e) => setSettings({ ...settings, dueDateField: e.target.value })} />
          </div>
        </div>
        <div className="form-row form-two">
          <div>
            <label>Cost field id</label>
            <input value={settings.costFieldId || ''} onChange={(e) => setSettings({ ...settings, costFieldId: e.target.value })} />
          </div>
          <div>
            <label>Sprint field id</label>
            <input value={settings.sprintFieldId || ''} onChange={(e) => setSettings({ ...settings, sprintFieldId: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <label>Dashboard URL (for analytics)</label>
          <input value={settings.dashboardUrl || ''} onChange={(e) => setSettings({ ...settings, dashboardUrl: e.target.value })} />
        </div>
        <div className="actions">
          <button type="submit" className="primary">Save</button>
          <button type="button" className="ghost" onClick={testConnection}>Test connection</button>
          {status && <span className="muted">{status}</span>}
        </div>
      </form>

      <div className="glass card">
        <div className="header-row">
          <h3>Columns & workflow</h3>
          <button type="button" className="ghost" onClick={addStatusColumn}>Add column</button>
        </div>
        <div className="column-list">
          {(settings.statuses || []).map((col, idx) => (
            <div key={col.id} className="column-row">
              <input
                value={col.name}
                onChange={(e) => {
                  const updated = [...settings.statuses];
                  updated[idx] = { ...col, name: e.target.value } as ColumnConfig;
                  setSettings({ ...settings, statuses: updated });
                }}
              />
              <input
                value={col.statuses.join(', ')}
                onChange={(e) => {
                  const updated = [...settings.statuses];
                  updated[idx] = { ...col, statuses: e.target.value.split(',').map((s) => s.trim()) } as ColumnConfig;
                  setSettings({ ...settings, statuses: updated });
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="glass card">
        <div className="header-row">
          <h3>Color rules</h3>
        </div>
        <div className="color-rules">
          {(settings.colorRules || defaultColorRules).map((rule, idx) => (
            <div key={rule.id} className="rule">
              <div className="form-row form-two">
                <div>
                  <label>Label</label>
                  <input value={rule.label} onChange={(e) => updateColorRule(idx, { label: e.target.value })} />
                </div>
                <div>
                  <label>Condition</label>
                  <select value={rule.condition} onChange={(e) => updateColorRule(idx, { condition: e.target.value as any })}>
                    <option value="overdue">Overdue</option>
                    <option value="due-today">Due today</option>
                    <option value="due-soon">Due soon</option>
                    <option value="no-due">No due</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div className="form-row form-two">
                <div>
                  <label>Badge color</label>
                  <input type="color" value={rule.badge} onChange={(e) => updateColorRule(idx, { badge: e.target.value })} />
                </div>
                <div>
                  <label>Border</label>
                  <input
                    type="text"
                    value={rule.border}
                    onChange={(e) => updateColorRule(idx, { border: e.target.value })}
                    style={{ borderColor: rule.border }}
                  />
                </div>
                <div>
                  <label>Background</label>
                  <input
                    type="text"
                    value={rule.background}
                    onChange={(e) => updateColorRule(idx, { background: e.target.value })}
                    style={{ borderColor: rule.background }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
