// Version: 1.0
export type Role = "admin" | "designer" | "client";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "med" | "high";
export type TaskCategory = "project" | "social_media" | "adhoc";

export type ProjectStatus = "active" | "on_hold" | "completed" | "cancelled";

export type DeliverableStatus = "draft" | "in_review" | "revision_requested" | "approved";

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: Role;
  client_id: number | null;
  avatar_color: string;
  created_at: number;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  client_id: number | null;
  avatar_color: string;
}

export interface Client {
  id: number;
  name: string;
  company: string | null;
  contact_email: string | null;
  brand_brief: string | null;
  target_audience: string | null;
  brand_values: string | null;
  created_at: number;
}

export interface PipelineStage {
  id: number;
  name: string;
  position: number;
  color: string;
  is_terminal: number; // 0/1
}

export interface Project {
  id: number;
  name: string;
  client_id: number;
  description: string | null;
  current_stage_id: number;
  deadline: number | null;
  budget: number | null;
  status: ProjectStatus;
  created_at: number;
}

export interface ProjectAssignment {
  project_id: number;
  user_id: number;
}

export interface Task {
  id: number;
  project_id: number | null;
  category: TaskCategory;
  title: string;
  description: string | null;
  assignee_id: number | null;
  due_date: number | null;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: number;
}

export interface Deliverable {
  id: number;
  project_id: number;
  name: string;
  type: string;
  status: DeliverableStatus;
  current_version: number;
  created_at: number;
}

export interface Revision {
  id: number;
  deliverable_id: number;
  version: number;
  file_url: string | null;
  notes: string | null;
  uploaded_by: number | null;
  created_at: number;
}

export interface Feedback {
  id: number;
  project_id: number | null;
  deliverable_id: number | null;
  user_id: number | null;
  comment: string;
  resolved: number;
  created_at: number;
}
