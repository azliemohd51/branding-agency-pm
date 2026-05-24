// Version: 1.0
import Link from "next/link";
import { requireRole } from "@/lib/session";
import { TopBar } from "@/components/TopBar";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/app/(app)/projects/actions";

export default async function NewClientPage() {
  const user = await requireRole("admin");

  return (
    <>
      <TopBar user={user} title="New client" />
      <main className="p-6 max-w-2xl mx-auto w-full">
        <PageHeader title="New client" back={{ href: "/clients", label: "Clients" }} />

        <form action={createClient} className="card p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Contact name</label>
              <input name="name" required className="input" placeholder="Sarah Chen" />
            </div>
            <div>
              <label className="label">Company</label>
              <input name="company" className="input" placeholder="Acme Co." />
            </div>
          </div>
          <div>
            <label className="label">Contact email</label>
            <input name="contact_email" type="email" className="input" placeholder="sarah@acme.com" />
          </div>
          <div>
            <label className="label">Brand brief</label>
            <textarea name="brand_brief" rows={4} className="input resize-none" placeholder="What are they trying to achieve with this brand?" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Target audience</label>
              <textarea name="target_audience" rows={3} className="input resize-none" placeholder="Who is this brand for?" />
            </div>
            <div>
              <label className="label">Brand values</label>
              <textarea name="brand_values" rows={3} className="input resize-none" placeholder="Reliability · Craft · Precision" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-line">
            <button type="submit" className="btn-primary">Create client</button>
            <Link href="/clients" className="btn-secondary">Cancel</Link>
          </div>
        </form>
      </main>
    </>
  );
}
