// Version: 1.0
// Centralized read helpers — keeps SQL out of pages.
import { getDb } from "./db";
import type {
  Project,
  Client,
  PipelineStage,
  Task,
  Deliverable,
  Revision,
  Feedback,
  User,
  SessionUser,
} from "./types";

export function listStages(): PipelineStage[] {
  return getDb().prepare("SELECT * FROM pipeline_stages ORDER BY position ASC").all() as PipelineStage[];
}

export function getStage(id: number): PipelineStage | undefined {
  return getDb().prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as PipelineStage | undefined;
}

export function listClients(): Client[] {
  return getDb().prepare("SELECT * FROM clients ORDER BY name ASC").all() as Client[];
}

export function getClient(id: number): Client | undefined {
  return getDb().prepare("SELECT * FROM clients WHERE id = ?").get(id) as Client | undefined;
}

export interface ProjectWithExtras extends Project {
  client_name: string;
  stage_name: string;
  stage_color: string;
  stage_position: number;
  stage_is_terminal: number;
  team_count: number;
  task_count: number;
  open_feedback: number;
  owner_name: string | null;
  owner_color: string | null;
}

export function listProjects(filter?: { user?: SessionUser; status?: string }): ProjectWithExtras[] {
  const db = getDb();
  let sql = `
    SELECT p.*,
           c.company AS client_name,
           s.name AS stage_name,
           s.color AS stage_color,
           s.position AS stage_position,
           s.is_terminal AS stage_is_terminal,
           o.name AS owner_name,
           o.avatar_color AS owner_color,
           (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id) AS team_count,
           (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') AS task_count,
           (SELECT COUNT(*) FROM feedback f WHERE f.project_id = p.id AND f.resolved = 0) AS open_feedback
    FROM projects p
    JOIN clients c ON c.id = p.client_id
    JOIN pipeline_stages s ON s.id = p.current_stage_id
    LEFT JOIN users o ON o.id = p.owner_id
`;
  const where: string[] = [];
  const params: unknown[] = [];

  if (filter?.user) {
    const u = filter.user;
    if (u.role === "client" && u.client_id) {
      where.push("p.client_id = ?");
      params.push(u.client_id);
    } else if (u.role === "designer") {
      where.push("p.id IN (SELECT project_id FROM project_assignments WHERE user_id = ?)");
      params.push(u.id);
    }
  }
  if (filter?.status) {
    where.push("p.status = ?");
    params.push(filter.status);
  }

  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY p.created_at DESC";

  return db.prepare(sql).all(...params) as ProjectWithExtras[];
}

export function getProject(id: number): ProjectWithExtras | undefined {
  const arr = getDb()
    .prepare(
      `SELECT p.*,
              c.company AS client_name,
              s.name AS stage_name,
              s.color AS stage_color,
              s.position AS stage_position,
              s.is_terminal AS stage_is_terminal,
              o.name AS owner_name,
              o.avatar_color AS owner_color,
              (SELECT COUNT(*) FROM project_assignments pa WHERE pa.project_id = p.id) AS team_count,
              (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status != 'done') AS task_count,
              (SELECT COUNT(*) FROM feedback f WHERE f.project_id = p.id AND f.resolved = 0) AS open_feedback
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       JOIN pipeline_stages s ON s.id = p.current_stage_id
       LEFT JOIN users o ON o.id = p.owner_id
       WHERE p.id = ?`
    )
    .all(id) as ProjectWithExtras[];
  return arr[0];
}

export function getProjectTeam(projectId: number): User[] {
  return getDb()
    .prepare(
      `SELECT u.* FROM users u
       JOIN project_assignments pa ON pa.user_id = u.id
       WHERE pa.project_id = ?
       ORDER BY u.name ASC`
    )
    .all(projectId) as User[];
}

export interface TaskWithExtras extends Task {
  assignee_name: string | null;
  assignee_color: string | null;
  project_name: string | null;
  client_name: string | null;
}

export function listTasks(filter?: {
  projectId?: number;
  assigneeId?: number;
  category?: string;
}): TaskWithExtras[] {
  const db = getDb();
  let sql = `
    SELECT t.*,
           u.name AS assignee_name,
           u.avatar_color AS assignee_color,
           p.name AS project_name,
           c.company AS client_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id
    LEFT JOIN projects p ON p.id = t.project_id
    LEFT JOIN clients c ON c.id = p.client_id
  `;
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter?.projectId !== undefined) {
    where.push("t.project_id = ?");
    params.push(filter.projectId);
  }
  if (filter?.assigneeId !== undefined) {
    where.push("t.assignee_id = ?");
    params.push(filter.assigneeId);
  }
  if (filter?.category) {
    where.push("t.category = ?");
    params.push(filter.category);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY (t.status = 'done') ASC, t.due_date IS NULL, t.due_date ASC, t.created_at DESC";
  return db.prepare(sql).all(...params) as TaskWithExtras[];
}

export interface DeliverableWithExtras extends Deliverable {
  latest_url: string | null;
  latest_notes: string | null;
  feedback_count: number;
}

export function listDeliverables(projectId: number): DeliverableWithExtras[] {
  return getDb()
    .prepare(
      `SELECT d.*,
              (SELECT file_url FROM revisions r WHERE r.deliverable_id = d.id ORDER BY r.version DESC LIMIT 1) AS latest_url,
              (SELECT notes FROM revisions r WHERE r.deliverable_id = d.id ORDER BY r.version DESC LIMIT 1) AS latest_notes,
              (SELECT COUNT(*) FROM feedback f WHERE f.deliverable_id = d.id) AS feedback_count
       FROM deliverables d
       WHERE d.project_id = ?
       ORDER BY d.created_at ASC`
    )
    .all(projectId) as DeliverableWithExtras[];
}

export function listRevisions(deliverableId: number): Revision[] {
  return getDb()
    .prepare("SELECT * FROM revisions WHERE deliverable_id = ? ORDER BY version DESC")
    .all(deliverableId) as Revision[];
}

export interface FeedbackWithExtras extends Feedback {
  user_name: string | null;
  user_color: string | null;
  user_role: string | null;
  deliverable_name: string | null;
}

export function listFeedback(filter: { projectId?: number; deliverableId?: number }): FeedbackWithExtras[] {
  const db = getDb();
  let sql = `
    SELECT f.*,
           u.name AS user_name,
           u.avatar_color AS user_color,
           u.role AS user_role,
           d.name AS deliverable_name
    FROM feedback f
    LEFT JOIN users u ON u.id = f.user_id
    LEFT JOIN deliverables d ON d.id = f.deliverable_id
  `;
  const where: string[] = [];
  const params: unknown[] = [];
  if (filter.projectId !== undefined) {
    where.push("f.project_id = ?");
    params.push(filter.projectId);
  }
  if (filter.deliverableId !== undefined) {
    where.push("f.deliverable_id = ?");
    params.push(filter.deliverableId);
  }
  if (where.length) sql += " WHERE " + where.join(" AND ");
  sql += " ORDER BY f.created_at DESC";
  return db.prepare(sql).all(...params) as FeedbackWithExtras[];
}

export function listDesigners(): User[] {
  return getDb()
    .prepare("SELECT * FROM users WHERE role IN ('admin','designer') ORDER BY name ASC")
    .all() as User[];
}

export function listAllUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY name ASC").all() as User[];
}

export interface DesignerWorkload extends User {
  active_projects: number;
  open_tasks: number;
  upcoming_deadline: number | null;
}

export function listDesignerWorkload(): DesignerWorkload[] {
  return getDb()
    .prepare(
      `SELECT u.*,
              (SELECT COUNT(DISTINCT p.id)
                 FROM projects p
                 JOIN project_assignments pa ON pa.project_id = p.id
                 WHERE pa.user_id = u.id AND p.status = 'active') AS active_projects,
              (SELECT COUNT(*) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'done') AS open_tasks,
              (SELECT MIN(t.due_date) FROM tasks t WHERE t.assignee_id = u.id AND t.status != 'done' AND t.due_date IS NOT NULL) AS upcoming_deadline
       FROM users u
       WHERE u.role IN ('admin','designer')
       ORDER BY u.name ASC`
    )
    .all() as DesignerWorkload[];
}
