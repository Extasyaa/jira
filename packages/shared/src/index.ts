export type JiraUser = {
  accountId?: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: Record<string, string>;
};

export type JiraIssueStatus = {
  id: string;
  name: string;
};

export type JiraIssueFields = {
  summary: string;
  status: JiraIssueStatus;
  assignee?: JiraUser;
  priority?: { id: string; name: string; iconUrl?: string };
  duedate?: string;
  labels?: string[];
  components?: { id: string; name: string }[];
  issuetype?: { id: string; name: string; iconUrl?: string };
  customfield_12345?: unknown;
  [key: string]: any;
};

export type JiraIssue = {
  id: string;
  key: string;
  fields: JiraIssueFields;
};

export type ColorRule = {
  id: string;
  label: string;
  condition: 'overdue' | 'due-today' | 'due-soon' | 'no-due' | 'done';
  daysThreshold?: number;
  background: string;
  border: string;
  badge: string;
};

export type ColumnConfig = {
  id: string;
  name: string;
  statuses: string[];
  wipLimit?: number;
};

export type Settings = {
  baseUrl: string;
  apiToken: string;
  username?: string;
  jql: string;
  filterId?: string;
  statuses: ColumnConfig[];
  dueDateField?: string;
  costFieldId?: string;
  sprintFieldId?: string;
  colorRules: ColorRule[];
  dashboardUrl?: string;
};

export type TransitionRequest = {
  toStatus: string;
  fields?: Record<string, any>;
};

export type CommentPayload = {
  body: string;
};

export type JiraComment = {
  id: string;
  author: JiraUser;
  body: string;
  updated: string;
  created: string;
};

export type SettingsExport = Settings;

export const defaultColorRules: ColorRule[] = [
  {
    id: 'overdue',
    label: 'Overdue',
    condition: 'overdue',
    background: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.4)',
    badge: '#ef4444'
  },
  {
    id: 'due-today',
    label: 'Due today',
    condition: 'due-today',
    background: 'rgba(249, 115, 22, 0.12)',
    border: 'rgba(249, 115, 22, 0.4)',
    badge: '#f97316'
  },
  {
    id: 'due-soon',
    label: 'Due in <=2 days',
    condition: 'due-soon',
    daysThreshold: 2,
    background: 'rgba(234, 179, 8, 0.12)',
    border: 'rgba(234, 179, 8, 0.4)',
    badge: '#eab308'
  },
  {
    id: 'no-due',
    label: 'No due date',
    condition: 'no-due',
    background: 'rgba(148, 163, 184, 0.1)',
    border: 'rgba(148, 163, 184, 0.4)',
    badge: '#94a3b8'
  },
  {
    id: 'done',
    label: 'Done',
    condition: 'done',
    background: 'rgba(22, 163, 74, 0.1)',
    border: 'rgba(22, 163, 74, 0.3)',
    badge: '#16a34a'
  }
];

export const defaultColumns: ColumnConfig[] = [
  { id: 'todo', name: 'To Do', statuses: ['To Do', 'Open'] },
  { id: 'in-progress', name: 'In Progress', statuses: ['In Progress', 'Doing'] },
  { id: 'review', name: 'Review', statuses: ['In Review', 'QA'] },
  { id: 'done', name: 'Done', statuses: ['Done', 'Verified'] }
];

export const defaultSettings: Settings = {
  baseUrl: '',
  apiToken: '',
  username: '',
  jql: 'project = DEMO ORDER BY updated DESC',
  filterId: '',
  statuses: defaultColumns,
  dueDateField: 'duedate',
  colorRules: defaultColorRules,
  costFieldId: '',
  sprintFieldId: ''
};

export function evaluateColorRule(issue: JiraIssue, settings: Settings): ColorRule | undefined {
  const statusName = issue.fields.status?.name?.toLowerCase();
  const doneRule = settings.colorRules.find((r) => r.condition === 'done');
  if (statusName && ['done', 'closed', 'resolved', 'verified'].includes(statusName)) {
    return doneRule ?? settings.colorRules.find((r) => r.id === 'done');
  }

  const dueField = settings.dueDateField || 'duedate';
  const due = issue.fields[dueField] || issue.fields.duedate;
  const today = new Date();
  if (!due) {
    return settings.colorRules.find((r) => r.condition === 'no-due');
  }

  const dueDate = new Date(due);
  const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const overdueRule = settings.colorRules.find((r) => r.condition === 'overdue');
  if (diffDays < 0 && overdueRule) return overdueRule;

  const dueTodayRule = settings.colorRules.find((r) => r.condition === 'due-today');
  if (diffDays === 0 && dueTodayRule) return dueTodayRule;

  const soonRule = settings.colorRules.find((r) => r.condition === 'due-soon');
  if (diffDays <= (soonRule?.daysThreshold ?? 2)) return soonRule;

  return undefined;
}
