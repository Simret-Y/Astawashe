import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-lg font-bold text-white">
        A
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Asta<span className="text-brand-700">Washe</span>
      </span>
    </span>
  );
}

/**
 * App header with the signed-in account. "Switch account" returns to the
 * account chooser; it becomes sign-out once real authentication exists.
 */
export function AppHeader({ section, accountName, accountDetail }: { section: string; accountName: string; accountDetail?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden border-l border-slate-200 pl-3 text-sm text-slate-600 sm:inline">{section}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-sm leading-tight sm:block">
            <span className="block font-medium">{accountName}</span>
            {accountDetail && <span className="block text-slate-500">{accountDetail}</span>}
          </span>
          <Link to="/" className="btn-ghost px-3 text-sm" aria-label={`Switch account (signed in as ${accountName})`}>
            <LogOut aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">Switch account</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
