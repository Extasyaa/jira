import { useEffect, useMemo, useState } from 'react';
import {
  ColumnConfig,
  JiraIssue,
  evaluateColorRule,
  defaultSettings,
  defaultColumns,
  defaultColorRules
} from '@jira/shared';
import { searchIssues, transitionIssue } from '../lib/api';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import IssueCard from '../components/IssueCard';
import './board.css';
import { motion } from 'framer-motion';

const BoardPage = () => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    setLoading(true);
    searchIssues(settings.jql)
      .then((data) => {
        setIssues(data.issues || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [settings.jql]);

  const columns = useMemo(() => settings.statuses || defaultColumns, [settings.statuses]);

  const handleDrop = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.data.current?.status === over.id) return;
    try {
      await transitionIssue(active.id as string, { toStatus: over.id as string });
      setIssues((prev) =>
        prev.map((issue) =>
          issue.key === active.id
            ? { ...issue, fields: { ...issue.fields, status: { ...issue.fields.status, name: over.id as string } } }
            : issue
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const grouped = useMemo(() => {
    const map: Record<string, JiraIssue[]> = {};
    columns.forEach((c) => (map[c.name] = []));
    issues.forEach((issue) => {
      const col = columns.find((c) => c.statuses.includes(issue.fields.status?.name));
      const key = col?.name || columns[0].name;
      map[key] = map[key] || [];
      map[key].push(issue);
    });
    return map;
  }, [issues, columns]);

  return (
    <div className="board">
      <div className="board-header">
        <div>
          <h1>Analyst Kanban</h1>
          <p className="muted">Drag & drop between statuses with live Jira transitions.</p>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="skeleton-grid">Loading board…</div>
      ) : (
        <div className="columns">
          <DndContext onDragEnd={handleDrop}>
            {columns.map((col) => (
              <div key={col.name} className="column glass">
                <div className="column-header">
                  <div>
                    <div className="title">{col.name}</div>
                    <div className="muted">{grouped[col.name]?.length || 0} issues</div>
                  </div>
                  {col.wipLimit && <span className="badge">WIP {col.wipLimit}</span>}
                </div>
                <SortableContext items={grouped[col.name]?.map((i) => i.key) || []} strategy={verticalListSortingStrategy}>
                  <div className="issue-stack">
                    {(grouped[col.name] || []).map((issue) => (
                      <IssueCard
                        key={issue.key}
                        issue={issue}
                        colorRule={evaluateColorRule(issue, { ...settings, colorRules: settings.colorRules || defaultColorRules })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            ))}
          </DndContext>
        </div>
      )}
    </div>
  );
};

export default BoardPage;
