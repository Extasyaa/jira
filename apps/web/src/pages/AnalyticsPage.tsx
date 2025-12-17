import { useEffect, useMemo, useState } from 'react';
import { JiraIssue, defaultSettings } from '@jira/shared';
import { searchIssues } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './analytics.css';

const AnalyticsPage = () => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    searchIssues(settings.jql).then((data) => setIssues(data.issues || []));
  }, [settings.jql]);

  const bySprint = useMemo(() => {
    const field = settings.sprintFieldId || 'sprint';
    const map: Record<string, number> = {};
    issues.forEach((i) => {
      const sprint = i.fields[field]?.name || 'Unplanned';
      const estimate = Number(i.fields[settings.costFieldId || 'timeoriginalestimate'] || 1);
      map[sprint] = (map[sprint] || 0) + estimate;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [issues, settings]);

  const byAssignee = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach((i) => {
      const name = i.fields.assignee?.displayName || 'Unassigned';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    issues.forEach((i) => {
      const status = i.fields.status?.name || 'Unknown';
      map[status] = (map[status] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [issues]);

  return (
    <div className="analytics-grid">
      <div className="glass card">
        <h2>Cost by Sprint</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bySprint}>
            <XAxis dataKey="name" hide={bySprint.length > 6} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#22d3ee" onClick={(d) => console.log('drill-down', d)} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass card">
        <h2>Distribution by assignee</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={byAssignee} dataKey="value" nameKey="name" outerRadius={100} label>
              {byAssignee.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#a855f7', '#22d3ee', '#f97316', '#22c55e'][index % 4]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="glass card">
        <h2>Status flow</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byStatus}>
            <XAxis dataKey="name" hide={byStatus.length > 6} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsPage;
