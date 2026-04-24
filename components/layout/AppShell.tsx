import { SkipLink } from "./SkipLink";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/**
 * The app shell. Two-column flex ≥lg (sidebar on inline-start, main on
 * inline-end); single-column <lg. `main#main` is the target of the
 * skip link — keep it focusable so the browser scrolls reliably.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SkipLink />
      <div className="flex min-h-full flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
