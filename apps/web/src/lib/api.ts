import axios from 'axios';
import { CommentPayload, JiraComment, JiraIssue, Settings, TransitionRequest } from '@jira/shared';

export async function fetchSettings(): Promise<Settings> {
  const res = await axios.get('/api/settings');
  return res.data;
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const res = await axios.post('/api/settings', settings);
  return res.data;
}

export async function health(partialSettings?: Partial<Settings>): Promise<any> {
  const res = partialSettings
    ? await axios.post('/api/health', partialSettings)
    : await axios.get('/api/health');
  return res.data;
}

export async function searchIssues(jql: string, startAt = 0, maxResults = 50) {
  const res = await axios.post('/api/search', { jql, startAt, maxResults });
  return res.data;
}

export async function transitionIssue(key: string, request: TransitionRequest) {
  return axios.post(`/api/issue/${key}/transition`, request);
}

export async function getIssue(key: string): Promise<JiraIssue> {
  const res = await axios.get(`/api/issue/${key}`);
  return res.data;
}

export async function getComments(key: string): Promise<{ comments: JiraComment[] }> {
  const res = await axios.get(`/api/issue/${key}/comments`);
  return res.data;
}

export async function addComment(key: string, payload: CommentPayload) {
  return axios.post(`/api/issue/${key}/comments`, payload);
}
