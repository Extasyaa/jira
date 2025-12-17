import { useEffect, useState } from 'react';
import { JiraIssue, ColorRule } from '@jira/shared';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { addComment, getComments } from '../lib/api';
import './issue-card.css';

const IssueCard: React.FC<{ issue: JiraIssue; colorRule?: ColorRule }> = ({ issue, colorRule }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: issue.key, data: { status: issue.fields.status?.name } });
  const [comments, setComments] = useState<{ author: any; body: string }[]>([]);
  const [comment, setComment] = useState('');

  useEffect(() => {
    getComments(issue.key)
      .then((res) => setComments(res.comments || []))
      .catch(() => {});
  }, [issue.key]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: colorRule?.border,
    background: colorRule?.background
  } as React.CSSProperties;

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    await addComment(issue.key, { body: comment });
    setComment('');
    const res = await getComments(issue.key);
    setComments(res.comments || []);
  };

  return (
    <motion.div ref={setNodeRef} style={style} className="issue-card card" layout {...attributes} {...listeners}>
      <div className="issue-top">
        <a href={`https://example.com/browse/${issue.key}`} target="_blank" rel="noreferrer" className="issue-key">
          {issue.key}
        </a>
        {colorRule && <span className="badge" style={{ background: colorRule.badge }}>{colorRule.label}</span>}
      </div>
      <div className="issue-summary">{issue.fields.summary}</div>
      <div className="meta">
        {issue.fields.assignee && (
          <span className="chip">
            {issue.fields.assignee.avatarUrls ? (
              <img src={issue.fields.assignee.avatarUrls['16x16']} alt="" />
            ) : (
              issue.fields.assignee.displayName?.[0]
            )}
            {issue.fields.assignee.displayName}
          </span>
        )}
        {issue.fields.priority && <span className="chip">{issue.fields.priority.name}</span>}
        {issue.fields.duedate && <span className="chip">Due {issue.fields.duedate}</span>}
      </div>
      <form className="comment-form" onSubmit={submitComment}>
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add comment" />
      </form>
      <div className="comments">
        {comments.slice(0, 2).map((c) => (
          <div key={c.body} className="comment-row">
            <span className="comment-author">{c.author?.displayName || 'Unknown'}</span>
            <span className="comment-body">{c.body}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default IssueCard;
