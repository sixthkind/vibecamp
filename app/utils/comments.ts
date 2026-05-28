export const COMMENT_TARGET_COLLECTIONS = {
  boardPosts: 'board_posts',
  docsItems: 'docs_items',
  calendarEvents: 'calendar_events',
  todoItems: 'todo_items',
  tasks: 'tasks',
} as const;

export type CommentTargetCollection =
  (typeof COMMENT_TARGET_COLLECTIONS)[keyof typeof COMMENT_TARGET_COLLECTIONS];

export const COMMENT_TARGET_LABELS: Record<CommentTargetCollection, string> = {
  board_posts: 'post',
  docs_items: 'item',
  calendar_events: 'event',
  todo_items: 'to-do',
  tasks: 'task',
};

export function isCommentTargetCollection(value: string): value is CommentTargetCollection {
  return Object.values(COMMENT_TARGET_COLLECTIONS).includes(value as CommentTargetCollection);
}
