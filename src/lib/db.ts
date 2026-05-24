// Version: 1.0
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company TEXT,
      contact_email TEXT,
      brand_brief TEXT,
      target_audience TEXT,
      brand_values TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','designer','client')),
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      avatar_color TEXT NOT NULL DEFAULT '#7c5cff',
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS pipeline_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position INTEGER NOT NULL,
      color TEXT NOT NULL DEFAULT '#7c5cff',
      is_terminal INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      description TEXT,
      current_stage_id INTEGER NOT NULL REFERENCES pipeline_stages(id),
      deadline INTEGER,
      budget REAL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS project_assignments (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('project','social_media','adhoc')),
      title TEXT NOT NULL,
      description TEXT,
      assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      due_date INTEGER,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
      priority TEXT NOT NULL DEFAULT 'med' CHECK (priority IN ('low','med','high')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      CHECK ((category = 'project' AND project_id IS NOT NULL) OR (category != 'project'))
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','revision_requested','approved')),
      current_version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deliverable_id INTEGER NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      version INTEGER NOT NULL,
      file_url TEXT,
      notes TEXT,
      uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      deliverable_id INTEGER REFERENCES deliverables(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      comment TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
    CREATE INDEX IF NOT EXISTS idx_projects_stage ON projects(current_stage_id);
    CREATE INDEX IF NOT EXISTS idx_assign_user ON project_assignments(user_id);
    CREATE INDEX IF NOT EXISTS idx_deliv_project ON deliverables(project_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_project ON feedback(project_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_deliv ON feedback(deliverable_id);
  `);

  // v1.2 — additive migrations on projects (brief_url, owner_id, priority)
  const cols = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
  const colNames = new Set(cols.map((c) => c.name));
  if (!colNames.has("brief_url")) db.exec("ALTER TABLE projects ADD COLUMN brief_url TEXT");
  if (!colNames.has("owner_id")) db.exec("ALTER TABLE projects ADD COLUMN owner_id INTEGER REFERENCES users(id)");
  if (!colNames.has("priority")) db.exec("ALTER TABLE projects ADD COLUMN priority TEXT DEFAULT 'med'");
}

export function nowSec(): number {
  return Math.floor(Date.now() / 1000);
}

export function tsToDate(ts: number | null): Date | null {
  return ts ? new Date(ts * 1000) : null;
}
