// Version: 1.0
// Run: npm run seed (or node-run via tsx)
import { getDb, nowSec } from "./db";
import bcrypt from "bcryptjs";

function seed() {
  const db = getDb();

  const existing = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (existing.c > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  const pw = bcrypt.hashSync("password", 10);
  const now = nowSec();
  const day = 86400;

  // Pipeline stages (admin can edit later)
  const stages = [
    { name: "Discovery", position: 1, color: "#3b82f6", is_terminal: 0 },
    { name: "Strategy", position: 2, color: "#8b5cf6", is_terminal: 0 },
    { name: "Design", position: 3, color: "#ec4899", is_terminal: 0 },
    { name: "Refinement", position: 4, color: "#f59e0b", is_terminal: 0 },
    { name: "Delivery", position: 5, color: "#10b981", is_terminal: 0 },
    { name: "Completed", position: 6, color: "#22c55e", is_terminal: 1 },
  ];
  const insStage = db.prepare(
    "INSERT INTO pipeline_stages (name, position, color, is_terminal) VALUES (?,?,?,?)"
  );
  const stageIds: number[] = [];
  for (const s of stages) {
    const r = insStage.run(s.name, s.position, s.color, s.is_terminal);
    stageIds.push(Number(r.lastInsertRowid));
  }

  // Clients
  const insClient = db.prepare(`
    INSERT INTO clients (name, company, contact_email, brand_brief, target_audience, brand_values)
    VALUES (?,?,?,?,?,?)
  `);
  const acmeId = Number(
    insClient.run(
      "Sarah Chen",
      "Acme Co.",
      "sarah@acme.com",
      "Acme is rebranding from a sleepy hardware vendor into a modern AI-tools company. We need a confident, technical identity that doesn't lose its craftsmanship roots.",
      "Engineering managers and CTOs at mid-market SaaS companies, 35-55 years old, value reliability and craftsmanship.",
      "Reliability · Craft · Precision · Quiet confidence"
    ).lastInsertRowid
  );
  const verdaId = Number(
    insClient.run(
      "Marcus Verda",
      "Verda Botanicals",
      "marcus@verda.co",
      "Verda is launching a line of small-batch botanical wellness products. Need a brand that feels alive, organic, and trustworthy — not corporate.",
      "Wellness-conscious millennials in urban centers who shop at Erewhon and read The Cut.",
      "Living · Honest · Grounded · Warm"
    ).lastInsertRowid
  );
  const northId = Number(
    insClient.run(
      "Aiko Tanaka",
      "Northbound Coffee",
      "aiko@northbound.coffee",
      "Specialty coffee roaster opening their first flagship. Brand needs to balance third-wave seriousness with neighborhood warmth.",
      "Coffee enthusiasts 25-45 in dense urban neighborhoods. Aesthetic-driven, Instagram-aware.",
      "Considered · Direct · Local · Quietly proud"
    ).lastInsertRowid
  );

  // Users — admin, designers, clients
  const insUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, client_id, avatar_color)
    VALUES (?,?,?,?,?,?)
  `);
  const adminId = Number(
    insUser.run("admin@studio.com", pw, "Azlie M.", "admin", null, "#7c5cff").lastInsertRowid
  );
  const d1Id = Number(
    insUser.run("designer@studio.com", pw, "Lin Park", "designer", null, "#ec4899").lastInsertRowid
  );
  const d2Id = Number(
    insUser.run("rio@studio.com", pw, "Rio Aziz", "designer", null, "#10b981").lastInsertRowid
  );
  const c1Id = Number(
    insUser.run("client@acme.com", pw, "Sarah Chen", "client", acmeId, "#3b82f6").lastInsertRowid
  );
  const c2Id = Number(
    insUser.run("marcus@verda.co", pw, "Marcus Verda", "client", verdaId, "#22c55e").lastInsertRowid
  );

  // Projects (assign to stages 0-indexed into stageIds)
  const insProject = db.prepare(`
    INSERT INTO projects (name, client_id, description, current_stage_id, deadline, budget, status, brief_url, owner_id, priority)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  const insAssign = db.prepare("INSERT INTO project_assignments (project_id, user_id) VALUES (?,?)");

  const p1 = Number(
    insProject.run(
      "Acme Rebrand",
      acmeId,
      "Full identity refresh — logo system, type, color, brand guidelines, sales deck template.",
      stageIds[2], // Design
      now + day * 12,
      15000,
      "active",
      "https://notion.so/acme-brand-brief",
      adminId,
      "high"
    ).lastInsertRowid
  );
  insAssign.run(p1, d1Id);
  insAssign.run(p1, adminId);

  const p2 = Number(
    insProject.run(
      "Verda Botanicals Launch Identity",
      verdaId,
      "Brand-from-scratch — naming review, mark, packaging system across 5 SKUs, website hero direction.",
      stageIds[1], // Strategy
      now + day * 30,
      22000,
      "active",
      "https://docs.google.com/document/verda-brief",
      adminId,
      "med"
    ).lastInsertRowid
  );
  insAssign.run(p2, d1Id);
  insAssign.run(p2, d2Id);

  const p3 = Number(
    insProject.run(
      "Northbound Flagship Signage",
      northId,
      "Wayfinding + storefront identity application for new flagship location.",
      stageIds[3], // Refinement
      now + day * 6,
      8500,
      "active",
      "https://figma.com/file/northbound-signage-brief",
      d2Id,
      "high"
    ).lastInsertRowid
  );
  insAssign.run(p3, d2Id);

  const p4 = Number(
    insProject.run(
      "Acme — Sales Deck",
      acmeId,
      "Master sales deck template using new identity. 24 slide layouts.",
      stageIds[0], // Discovery
      now + day * 21,
      4500,
      "active",
      null,
      d1Id,
      "low"
    ).lastInsertRowid
  );
  insAssign.run(p4, d1Id);

  const p5 = Number(
    insProject.run(
      "Northbound Coffee Identity",
      northId,
      "Full identity — completed Q1.",
      stageIds[5], // Completed
      now - day * 30,
      18000,
      "completed",
      "https://figma.com/file/northbound-identity",
      d2Id,
      "med"
    ).lastInsertRowid
  );
  insAssign.run(p5, d2Id);
  insAssign.run(p5, d1Id);

  // Tasks — mix of project / social_media / adhoc
  const insTask = db.prepare(`
    INSERT INTO tasks (project_id, category, title, description, assignee_id, due_date, status, priority)
    VALUES (?,?,?,?,?,?,?,?)
  `);
  // Acme Rebrand tasks
  insTask.run(p1, "project", "Logo concept directions (5)", "Sketch 5 distinct directions for review", d1Id, now + day * 2, "in_progress", "high");
  insTask.run(p1, "project", "Type system pairing", "Pair primary display with body — propose 3 pairings", d1Id, now + day * 4, "todo", "med");
  insTask.run(p1, "project", "Color exploration", "Build out 3 palette options anchored on craft + tech", d1Id, now + day * 5, "todo", "med");
  insTask.run(p1, "project", "Stakeholder interview synthesis", "Distill 8 stakeholder interviews into key themes", adminId, now - day * 1, "done", "high");
  // Verda
  insTask.run(p2, "project", "Brand naming validation", "Sanity check 'Verda' for trademark + linguistic", d1Id, now + day * 3, "in_progress", "high");
  insTask.run(p2, "project", "Mood board — packaging", "Reference shelf for botanical wellness CPG", d2Id, now + day * 2, "todo", "med");
  // Northbound flagship
  insTask.run(p3, "project", "Final exterior mockup", "Mount mark on real storefront photo for client", d2Id, now + day * 1, "in_progress", "high");
  insTask.run(p3, "project", "Interior wayfinding spec", "Material spec sheet for fabricator", d2Id, now + day * 4, "todo", "med");
  // Acme deck
  insTask.run(p4, "project", "Slide layout audit", "Audit current deck for what needs replacing", d1Id, now + day * 7, "todo", "low");
  // Social media (no project)
  insTask.run(null, "social_media", "Instagram carousel: design process post", "3-slide carousel on our concept-to-final flow", d1Id, now + day * 2, "todo", "med");
  insTask.run(null, "social_media", "Weekly newsletter — May digest", "Write + lay out 3-section newsletter", d2Id, now + day * 5, "todo", "low");
  // Adhoc
  insTask.run(null, "adhoc", "Update studio business cards", "Reprint with updated address", adminId, now + day * 10, "todo", "low");
  insTask.run(null, "adhoc", "New laptop for Lin", "Procure + set up M-series machine", adminId, now + day * 14, "todo", "med");

  // Deliverables
  const insDeliv = db.prepare(`
    INSERT INTO deliverables (project_id, name, type, status, current_version)
    VALUES (?,?,?,?,?)
  `);
  const dAcme1 = Number(
    insDeliv.run(p1, "Primary Logo Mark", "logo", "in_review", 3).lastInsertRowid
  );
  const dAcme2 = Number(
    insDeliv.run(p1, "Type System", "guidelines", "draft", 1).lastInsertRowid
  );
  const dVerda1 = Number(
    insDeliv.run(p2, "Brand Strategy Document", "guidelines", "approved", 2).lastInsertRowid
  );
  const dNorth1 = Number(
    insDeliv.run(p3, "Exterior Signage Mockup", "signage", "revision_requested", 4).lastInsertRowid
  );

  // Revisions
  const insRev = db.prepare(`
    INSERT INTO revisions (deliverable_id, version, file_url, notes, uploaded_by)
    VALUES (?,?,?,?,?)
  `);
  insRev.run(dAcme1, 1, "https://figma.com/example/acme-logo-v1", "Initial 5 directions", d1Id);
  insRev.run(dAcme1, 2, "https://figma.com/example/acme-logo-v2", "Narrowed to 2 finalists per client feedback", d1Id);
  insRev.run(dAcme1, 3, "https://figma.com/example/acme-logo-v3", "Refined finalist with adjusted counter-spaces", d1Id);
  insRev.run(dAcme2, 1, "https://figma.com/example/acme-type", "Initial type pairing draft", d1Id);
  insRev.run(dVerda1, 1, "https://docs.google.com/example/verda-strategy", "First draft", d1Id);
  insRev.run(dVerda1, 2, "https://docs.google.com/example/verda-strategy-v2", "Incorporated client feedback on tone", d1Id);
  insRev.run(dNorth1, 1, "https://figma.com/example/northbound-sign-v1", "First mount on photo", d2Id);
  insRev.run(dNorth1, 2, "https://figma.com/example/northbound-sign-v2", "Adjusted scale", d2Id);
  insRev.run(dNorth1, 3, "https://figma.com/example/northbound-sign-v3", "Tested in evening light", d2Id);
  insRev.run(dNorth1, 4, "https://figma.com/example/northbound-sign-v4", "Final variant — pending client approval", d2Id);

  // Feedback
  const insFb = db.prepare(`
    INSERT INTO feedback (project_id, deliverable_id, user_id, comment, resolved)
    VALUES (?,?,?,?,?)
  `);
  insFb.run(p1, dAcme1, c1Id, "Loving direction 3 — can we explore a slightly tighter counter on the 'a'?", 0);
  insFb.run(p1, dAcme1, d1Id, "Good catch — we'll tighten in v4 and re-test at small sizes.", 1);
  insFb.run(p1, null, c1Id, "When can we expect to see the color exploration?", 0);
  insFb.run(p3, dNorth1, null, "Approved pending final material spec.", 0);

  console.log("✓ Seeded:");
  console.log("  - 6 pipeline stages");
  console.log("  - 3 clients, 5 users (1 admin, 2 designers, 2 clients)");
  console.log("  - 5 projects, 4 deliverables, 10 revisions, 13 tasks, 4 feedback items");
  console.log("");
  console.log("Login as:");
  console.log("  Admin     admin@studio.com    / password");
  console.log("  Designer  designer@studio.com / password");
  console.log("  Client    client@acme.com     / password");
}

seed();
