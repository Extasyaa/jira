import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import pino from 'pino';
import pinoHttp from 'pino-http';
import morgan from 'morgan';
import {
  Settings,
  JiraIssue,
  TransitionRequest,
  CommentPayload,
  defaultSettings,
  SettingsExport
} from '@jira/shared';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const app = express();
const port = process.env.PORT || 4000;
const settingsPath = path.resolve(process.cwd(), 'data/settings.json');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
app.use(pinoHttp({ logger }));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

async function loadSettings(): Promise<Settings> {
  if (!(await fs.pathExists(settingsPath))) {
    await fs.outputJSON(settingsPath, defaultSettings, { spaces: 2 });
    return defaultSettings;
  }
  const data = await fs.readJSON(settingsPath);
  return { ...defaultSettings, ...data, statuses: data.statuses ?? defaultSettings.statuses } as Settings;
}

async function saveSettings(settings: Settings) {
  await fs.outputJSON(settingsPath, settings, { spaces: 2 });
}

function jiraClient(settings: Settings) {
  if (!settings.baseUrl) {
    throw new Error('Missing Jira baseUrl');
  }
  const token = settings.apiToken || process.env.API_TOKEN || '';
  const username = settings.username || process.env.JIRA_USERNAME || '';
  const isBasic = Boolean(username || token.includes(':'));
  const authorization = isBasic
    ? `Basic ${Buffer.from(username ? `${username}:${token}` : token).toString('base64')}`
    : `Bearer ${token}`;

  const headers: Record<string, string> = {
    Authorization: authorization,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
  return axios.create({
    baseURL: settings.baseUrl.replace(/\/$/, ''),
    headers
  });
}

app.get('/api/health', async (_req, res) => {
  const settings = await loadSettings();
  try {
    const client = jiraClient(settings);
    const response = await client.get('/rest/api/2/myself');
    res.json({ ok: true, user: response.data });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ ok: false, error: error.message });
  }
});

app.post('/api/health', async (req, res) => {
  const bodySettings: Partial<Settings> = req.body || {};
  const fileSettings = await loadSettings();
  const settings = { ...fileSettings, ...bodySettings } as Settings;
  try {
    const client = jiraClient(settings);
    const response = await client.get('/rest/api/2/myself');
    res.json({ ok: true, user: response.data });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ ok: false, error: error.message });
  }
});

app.get('/api/settings', async (_req, res) => {
  const settings = await loadSettings();
  res.json(settings);
});

app.post('/api/settings', async (req, res) => {
  const settings: Settings = req.body;
  await saveSettings(settings);
  res.json(settings);
});

app.post('/api/settings/export', async (_req, res) => {
  const settings = await loadSettings();
  res.json({ export: settings });
});

app.post('/api/settings/import', async (req, res) => {
  const settings: SettingsExport = req.body;
  await saveSettings(settings as Settings);
  res.json(settings);
});

app.post('/api/search', async (req, res) => {
  const settings = await loadSettings();
  const { jql, startAt = 0, maxResults = 50, fields = [
    'summary',
    settings.dueDateField || 'duedate',
    settings.costFieldId || 'timeestimate',
    'status',
    'assignee',
    'priority',
    'labels',
    'components'
  ] } = req.body;
  try {
    const client = jiraClient(settings);
    const response = await client.post('/rest/api/2/search', {
      jql: jql || settings.jql,
      startAt,
      maxResults,
      fields,
      expand: ['changelog']
    });
    res.json(response.data);
  } catch (error: any) {
    logger.error(error.message);
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

app.get('/api/issue/:key', async (req, res) => {
  const settings = await loadSettings();
  try {
    const client = jiraClient(settings);
    const response = await client.get(`/rest/api/2/issue/${req.params.key}`, { params: { expand: 'changelog' } });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

app.post('/api/issue/:key/transition', async (req, res) => {
  const settings = await loadSettings();
  const payload: TransitionRequest = req.body;
  try {
    const client = jiraClient(settings);
    const transitions = await client.get(`/rest/api/2/issue/${req.params.key}/transitions`);
    const transition = transitions.data.transitions.find((t: any) => t.to.name.toLowerCase() === payload.toStatus.toLowerCase());
    if (!transition) {
      return res.status(400).json({ message: 'Transition not available for this status' });
    }
    await client.post(`/rest/api/2/issue/${req.params.key}/transitions`, {
      transition: { id: transition.id },
      fields: payload.fields
    });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ message: error.message, details: error.response?.data });
  }
});

app.get('/api/issue/:key/comments', async (req, res) => {
  const settings = await loadSettings();
  try {
    const client = jiraClient(settings);
    const response = await client.get(`/rest/api/2/issue/${req.params.key}/comment`);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

app.post('/api/issue/:key/comments', async (req, res) => {
  const settings = await loadSettings();
  const payload: CommentPayload = req.body;
  try {
    const client = jiraClient(settings);
    await client.post(`/rest/api/2/issue/${req.params.key}/comment`, payload);
    res.json({ ok: true });
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ message: error.message });
  }
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(port, () => {
  logger.info(`API listening on port ${port}`);
});
