import { Suspense } from "react";

import { StudioWorkspace } from "@/components/StudioWorkspace";

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell studio-shell">
          <section className="card">Loading studio...</section>
        </main>
      }
    >
      <StudioWorkspace />
    </Suspense>
  );
}
