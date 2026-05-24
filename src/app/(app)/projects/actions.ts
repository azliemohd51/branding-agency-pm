// Version: 1.0
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, nowSec } from "@/lib/db";
import { requireUser, requireRole } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

export async function createProject(formData: FormData) {
  const user = await requireRole("admin");
  const db = getDb();
  const name = String(formData.get("name") || "").trim();
  const client_id = Number(formData.get("client_id"));
  const description = String(formData.get("description") || "").trim() || null;
  const current_stage_id = Number(formData.get("current_stage_id"));
  const deadline = parseDateInput(formData.get("deadline") as string);
  const budgetRaw = formData.get("budget") as string;
  const budget = budgetRaw ? Number(budgetRaw) : null;
  const brief_url = String(formData.get("brief_url") || "").trim() || null;
  const ownerRaw = formData.get("owner_id") as string;
  const owner_id = ownerRaw ? Number(ownerRaw) : user.id;
  const priority = (String(formData.get("priority") || "med") as "low" | "med" | "high");
  const assignees = formData.getAll("assignees").map((v) => Number(v));

  if (!name || !client_id || !current_stage_id) throw new Error("Missing required fields");

  const r = db
    .prepare(
      `INSERT INTO projects (name, client_id, description, current_stage_id, deadline, budget, status, brief_url, owner_id, priority)
       VALUES (?,?,?,?,?,?, 'active', ?,?,?)`
    )
    .run(name, client_id, description, current_stage_id, deadline, budget, brief_url, owner_id, priority);
  const projectId = Number(r.lastInsertRowid);

  const insAssign = db.prepare("INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?,?)");
  for (const u of assignees) insAssign.run(projectId, u);

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  redirect(`/projects/${projectId}`);
}

export async function updateProjectMeta(formData: FormData) {
  await requireRole("admin", "designer");
  const id = Number(formData.get("id"));
  if (!id) return;
  const brief_url = String(formData.get("brief_url") || "").trim() || null;
  const ownerRaw = formData.get("owner_id") as string;
  const owner_id = ownerRaw ? Number(ownerRaw) : null;
  const priority = String(formData.get("priority") || "med");
  getDb()
    .prepare("UPDATE projects SET brief_url = ?, owner_id = ?, priority = ? WHERE id = ?")
    .run(brief_url, owner_id, priority, id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
}

export async function advanceStage(projectId: number, stageId: number) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  getDb().prepare("UPDATE projects SET current_stage_id = ? WHERE id = ?").run(stageId, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function updateProjectStatus(projectId: number, status: string) {
  await requireRole("admin", "designer");
  getDb().prepare("UPDATE projects SET status = ? WHERE id = ?").run(status, projectId);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects");
}

export async function addProjectMember(projectId: number, userId: number) {
  await requireRole("admin");
  getDb()
    .prepare("INSERT OR IGNORE INTO project_assignments (project_id, user_id) VALUES (?,?)")
    .run(projectId, userId);
  revalidatePath(`/projects/${projectId}`);
}

export async function removeProjectMember(projectId: number, userId: number) {
  await requireRole("admin");
  getDb()
    .prepare("DELETE FROM project_assignments WHERE project_id = ? AND user_id = ?")
    .run(projectId, userId);
  revalidatePath(`/projects/${projectId}`);
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  const db = getDb();
  const category = String(formData.get("category") || "project") as "project" | "social_media" | "adhoc";
  const projectIdRaw = formData.get("project_id") as string | null;
  const project_id = category === "project" && projectIdRaw ? Number(projectIdRaw) : null;
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const assigneeRaw = formData.get("assignee_id") as string | null;
  const assignee_id = assigneeRaw ? Number(assigneeRaw) : null;
  const due_date = parseDateInput(formData.get("due_date") as string);
  const priority = String(formData.get("priority") || "med");

  if (!title) throw new Error("Title required");
  if (category === "project" && !project_id) throw new Error("Project required for project tasks");

  db.prepare(
    `INSERT INTO tasks (project_id, category, title, description, assignee_id, due_date, status, priority)
     VALUES (?,?,?,?,?,?, 'todo', ?)`
  ).run(project_id, category, title, description, assignee_id, due_date, priority);

  if (project_id) revalidatePath(`/projects/${project_id}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(taskId: number, status: string) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  getDb().prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, taskId);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  // Best-effort revalidate project page if known
  const row = getDb().prepare("SELECT project_id FROM tasks WHERE id = ?").get(taskId) as { project_id: number | null };
  if (row?.project_id) revalidatePath(`/projects/${row.project_id}`);
}

export async function deleteTask(taskId: number) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  const row = getDb().prepare("SELECT project_id FROM tasks WHERE id = ?").get(taskId) as { project_id: number | null };
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
  revalidatePath("/tasks");
  if (row?.project_id) revalidatePath(`/projects/${row.project_id}`);
}

export async function createDeliverable(formData: FormData) {
  await requireRole("admin", "designer");
  const project_id = Number(formData.get("project_id"));
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "other");
  const file_url = String(formData.get("file_url") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!project_id || !name) throw new Error("Missing fields");

  const db = getDb();
  const dr = db
    .prepare(`INSERT INTO deliverables (project_id, name, type, status, current_version) VALUES (?,?,?, 'draft', 1)`)
    .run(project_id, name, type);
  const deliverableId = Number(dr.lastInsertRowid);
  if (file_url || notes) {
    const user = await requireUser();
    db.prepare(
      `INSERT INTO revisions (deliverable_id, version, file_url, notes, uploaded_by) VALUES (?, 1, ?, ?, ?)`
    ).run(deliverableId, file_url, notes, user.id);
  }
  revalidatePath(`/projects/${project_id}`);
}

export async function addRevision(formData: FormData) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  const deliverable_id = Number(formData.get("deliverable_id"));
  const file_url = String(formData.get("file_url") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const db = getDb();
  const d = db.prepare("SELECT * FROM deliverables WHERE id = ?").get(deliverable_id) as { id: number; project_id: number; current_version: number } | undefined;
  if (!d) throw new Error("Deliverable not found");
  const newVersion = d.current_version + 1;
  db.prepare(
    `INSERT INTO revisions (deliverable_id, version, file_url, notes, uploaded_by) VALUES (?,?,?,?,?)`
  ).run(deliverable_id, newVersion, file_url, notes, user.id);
  db.prepare("UPDATE deliverables SET current_version = ?, status = 'in_review' WHERE id = ?").run(newVersion, deliverable_id);
  revalidatePath(`/projects/${d.project_id}`);
}

export async function updateDeliverableStatus(deliverableId: number, status: string) {
  await requireUser();
  const db = getDb();
  const d = db.prepare("SELECT project_id FROM deliverables WHERE id = ?").get(deliverableId) as { project_id: number } | undefined;
  if (!d) return;
  db.prepare("UPDATE deliverables SET status = ? WHERE id = ?").run(status, deliverableId);
  revalidatePath(`/projects/${d.project_id}`);
  revalidatePath("/portal");
}

export async function addFeedback(formData: FormData) {
  const user = await requireUser();
  const project_id = Number(formData.get("project_id")) || null;
  const deliverableRaw = formData.get("deliverable_id") as string | null;
  const deliverable_id = deliverableRaw ? Number(deliverableRaw) : null;
  const comment = String(formData.get("comment") || "").trim();
  if (!comment) return;
  getDb()
    .prepare(`INSERT INTO feedback (project_id, deliverable_id, user_id, comment, resolved) VALUES (?,?,?,?,0)`)
    .run(project_id, deliverable_id, user.id, comment);
  if (project_id) revalidatePath(`/projects/${project_id}`);
  revalidatePath("/portal");
}

export async function toggleFeedback(feedbackId: number) {
  const user = await requireUser();
  if (user.role === "client") return;
  const db = getDb();
  const row = db.prepare("SELECT project_id, resolved FROM feedback WHERE id = ?").get(feedbackId) as { project_id: number | null; resolved: number } | undefined;
  if (!row) return;
  db.prepare("UPDATE feedback SET resolved = ? WHERE id = ?").run(row.resolved ? 0 : 1, feedbackId);
  if (row.project_id) revalidatePath(`/projects/${row.project_id}`);
  revalidatePath("/portal");
}

// Pipeline stages CRUD (admin)
export async function addStage(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#7c5cff");
  const is_terminal = formData.get("is_terminal") ? 1 : 0;
  if (!name) return;
  const db = getDb();
  const maxPos = (db.prepare("SELECT COALESCE(MAX(position),0) as m FROM pipeline_stages").get() as { m: number }).m;
  db.prepare("INSERT INTO pipeline_stages (name, position, color, is_terminal) VALUES (?,?,?,?)").run(
    name,
    maxPos + 1,
    color,
    is_terminal
  );
  revalidatePath("/settings/pipeline");
}

export async function updateStage(formData: FormData) {
  await requireRole("admin");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") || "").trim();
  const color = String(formData.get("color") || "#7c5cff");
  const is_terminal = formData.get("is_terminal") ? 1 : 0;
  if (!id || !name) return;
  getDb()
    .prepare("UPDATE pipeline_stages SET name = ?, color = ?, is_terminal = ? WHERE id = ?")
    .run(name, color, is_terminal, id);
  revalidatePath("/settings/pipeline");
  revalidatePath("/projects");
}

export async function moveStage(stageId: number, direction: "up" | "down") {
  await requireRole("admin");
  const db = getDb();
  const all = db.prepare("SELECT * FROM pipeline_stages ORDER BY position ASC").all() as { id: number; position: number }[];
  const idx = all.findIndex((s) => s.id === stageId);
  if (idx < 0) return;
  const swap = direction === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  const a = all[idx];
  const b = all[swap];
  const upd = db.prepare("UPDATE pipeline_stages SET position = ? WHERE id = ?");
  upd.run(b.position, a.id);
  upd.run(a.position, b.id);
  revalidatePath("/settings/pipeline");
  revalidatePath("/projects");
}

export async function deleteStage(stageId: number) {
  await requireRole("admin");
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) as c FROM projects WHERE current_stage_id = ?").get(stageId) as { c: number }).c;
  if (count > 0) throw new Error(`Cannot delete — ${count} project(s) currently on this stage. Migrate them first.`);
  db.prepare("DELETE FROM pipeline_stages WHERE id = ?").run(stageId);
  revalidatePath("/settings/pipeline");
}

// Client CRUD
export async function createClient(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") || "").trim();
  const company = String(formData.get("company") || "").trim() || null;
  const contact_email = String(formData.get("contact_email") || "").trim() || null;
  const brand_brief = String(formData.get("brand_brief") || "").trim() || null;
  const target_audience = String(formData.get("target_audience") || "").trim() || null;
  const brand_values = String(formData.get("brand_values") || "").trim() || null;
  if (!name) throw new Error("Name required");
  const r = getDb()
    .prepare(
      `INSERT INTO clients (name, company, contact_email, brand_brief, target_audience, brand_values) VALUES (?,?,?,?,?,?)`
    )
    .run(name, company, contact_email, brand_brief, target_audience, brand_values);
  revalidatePath("/clients");
  redirect(`/clients/${Number(r.lastInsertRowid)}`);
}

// ===== Inline-edit field updates =====

const PROJECT_FIELD_TRANSFORMS: Record<string, (v: string | null) => unknown> = {
  name: (v) => (v ?? "").trim(),
  brief_url: (v) => (v && v.trim()) || null,
  description: (v) => (v && v.trim()) || null,
  client_id: (v) => (v ? Number(v) : null),
  owner_id: (v) => (v ? Number(v) : null),
  current_stage_id: (v) => (v ? Number(v) : null),
  priority: (v) => v ?? "med",
  status: (v) => v ?? "active",
  budget: (v) => (v ? Number(v) : null),
  deadline: (v) => (v ? parseDateInput(v) : null),
};

export async function updateProjectField(id: number, field: string, value: string | null) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  if (!(field in PROJECT_FIELD_TRANSFORMS)) throw new Error("Invalid field: " + field);
  const transformed = PROJECT_FIELD_TRANSFORMS[field](value);
  getDb().prepare(`UPDATE projects SET ${field} = ? WHERE id = ?`).run(transformed as never, id);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/dashboard");
}

const TASK_FIELD_TRANSFORMS: Record<string, (v: string | null) => unknown> = {
  title: (v) => (v ?? "").trim(),
  description: (v) => (v && v.trim()) || null,
  assignee_id: (v) => (v ? Number(v) : null),
  due_date: (v) => (v ? parseDateInput(v) : null),
  status: (v) => v ?? "todo",
  priority: (v) => v ?? "med",
};

export async function updateTaskField(id: number, field: string, value: string | null) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  if (!(field in TASK_FIELD_TRANSFORMS)) throw new Error("Invalid field: " + field);
  const transformed = TASK_FIELD_TRANSFORMS[field](value);
  getDb().prepare(`UPDATE tasks SET ${field} = ? WHERE id = ?`).run(transformed as never, id);
  const row = getDb().prepare("SELECT project_id FROM tasks WHERE id = ?").get(id) as { project_id: number | null };
  revalidatePath("/projects");
  revalidatePath("/tasks");
  if (row?.project_id) revalidatePath(`/projects/${row.project_id}`);
  revalidatePath("/dashboard");
}

// ===== Custom columns =====

export async function addCustomColumn(formData: FormData) {
  await requireRole("admin");
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "text") as "text" | "number" | "date" | "url";
  if (!name) throw new Error("Name required");
  if (!["text", "number", "date", "url"].includes(type)) throw new Error("Invalid type");
  const db = getDb();
  const maxPos = (db.prepare("SELECT COALESCE(MAX(position), 0) as m FROM custom_columns").get() as { m: number }).m;
  db.prepare("INSERT INTO custom_columns (name, type, position) VALUES (?,?,?)").run(name, type, maxPos + 1);
  revalidatePath("/projects");
}

export async function deleteCustomColumn(id: number) {
  await requireRole("admin");
  getDb().prepare("DELETE FROM custom_columns WHERE id = ?").run(id);
  revalidatePath("/projects");
}

export async function setCustomColumnValue(columnId: number, projectId: number, value: string | null) {
  const user = await requireUser();
  if (user.role === "client") throw new Error("Forbidden");
  const db = getDb();
  const v = value && value.trim() ? value.trim() : null;
  if (v === null) {
    db.prepare("DELETE FROM custom_column_values WHERE column_id = ? AND project_id = ?").run(columnId, projectId);
  } else {
    db.prepare(
      `INSERT INTO custom_column_values (column_id, project_id, value) VALUES (?,?,?)
       ON CONFLICT(column_id, project_id) DO UPDATE SET value = excluded.value`
    ).run(columnId, projectId, v);
  }
  revalidatePath("/projects");
}

export async function updateClient(formData: FormData) {
  await requireRole("admin");
  const id = Number(formData.get("id"));
  if (!id) return;
  const name = String(formData.get("name") || "").trim();
  const company = String(formData.get("company") || "").trim() || null;
  const contact_email = String(formData.get("contact_email") || "").trim() || null;
  const brand_brief = String(formData.get("brand_brief") || "").trim() || null;
  const target_audience = String(formData.get("target_audience") || "").trim() || null;
  const brand_values = String(formData.get("brand_values") || "").trim() || null;
  getDb()
    .prepare(
      `UPDATE clients SET name = ?, company = ?, contact_email = ?, brand_brief = ?, target_audience = ?, brand_values = ? WHERE id = ?`
    )
    .run(name, company, contact_email, brand_brief, target_audience, brand_values, id);
  revalidatePath(`/clients/${id}`);
  revalidatePath("/clients");
}
