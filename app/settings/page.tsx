"use client";

import { useEffect, useState } from "react";

interface AdAccount {
  id: string;
  name: string;
}

interface Page {
  id: string;
  name: string;
}

interface Settings {
  metaAccessToken?: string | null;
  adAccountId?: string | null;
  adAccountName?: string | null;
  facebookPageId?: string | null;
  facebookPageName?: string | null;
}

export default function SettingsPage() {
  const [token, setToken] = useState("");
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  // Load existing settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ settings }: { settings: Settings | null }) => {
        if (settings) {
          setToken(settings.metaAccessToken ?? "");
          setSelectedAccount(settings.adAccountId ?? "");
          setSelectedPage(settings.facebookPageId ?? "");
          if (settings.adAccountId && settings.adAccountName) {
            setAdAccounts([{ id: settings.adAccountId, name: settings.adAccountName }]);
          }
          if (settings.facebookPageId && settings.facebookPageName) {
            setPages([{ id: settings.facebookPageId, name: settings.facebookPageName }]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoad(false));
  }, []);

  async function fetchAccountsAndPages() {
    setError("");
    setFetching(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch accounts");
      setAdAccounts(data.adAccounts ?? []);
      setPages(data.pages ?? []);
      if (data.adAccounts?.length > 0) setSelectedAccount(data.adAccounts[0].id);
      if (data.pages?.length > 0) setSelectedPage(data.pages[0].id);
    } catch (e) {
      setError(String(e));
    } finally {
      setFetching(false);
    }
  }

  async function save() {
    setError("");
    setLoading(true);
    setSaved(false);
    try {
      const account = adAccounts.find((a) => a.id === selectedAccount);
      const page = pages.find((p) => p.id === selectedPage);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metaAccessToken: token,
          adAccountId: selectedAccount || null,
          adAccountName: account?.name ?? null,
          facebookPageId: selectedPage || null,
          facebookPageName: page?.name ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  if (initialLoad) {
    return (
      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configure your Meta app credentials, ad account, and Facebook page.
        </p>
      </div>

      <div className="space-y-6">
        {/* Access Token */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Meta Access Token</h2>
          <p className="text-xs text-zinc-500 mb-4">
            System User token with{" "}
            <code className="text-zinc-400">ads_management</code>,{" "}
            <code className="text-zinc-400">ads_read</code>,{" "}
            <code className="text-zinc-400">business_management</code>, and{" "}
            <code className="text-zinc-400">pages_show_list</code> permissions.
          </p>
          <div className="flex gap-3">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your access token..."
              className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={fetchAccountsAndPages}
              disabled={!token || fetching}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
            >
              {fetching ? (
                <>
                  <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                "Fetch Accounts"
              )}
            </button>
          </div>
        </div>

        {/* Ad Account */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Ad Account</h2>
          <p className="text-xs text-zinc-500 mb-4">
            The ad account where ads will be created.
          </p>
          {adAccounts.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">
              Fetch accounts first by entering your token above.
            </p>
          ) : (
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select an ad account...</option>
              {adAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.id})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Facebook Page */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-200 mb-1">Facebook Page</h2>
          <p className="text-xs text-zinc-500 mb-4">
            The Facebook page that ads will be published from.
          </p>
          {pages.length === 0 ? (
            <p className="text-xs text-zinc-600 italic">
              Fetch accounts first by entering your token above.
            </p>
          ) : (
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a Facebook page...</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={save}
            disabled={loading || !token}
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
          {saved && (
            <span className="text-sm text-green-400 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </span>
          )}
        </div>

        {/* Meta App Setup hint */}
        <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-5">
          <p className="text-xs font-semibold text-amber-400 mb-1">
            ⚠ Your Meta app must be in Live mode
          </p>
          <p className="text-xs text-amber-600/80">
            Development mode cannot create ads. See{" "}
            <code className="text-amber-500">META-APP-SETUP.md</code> in the repo for
            step-by-step instructions.
          </p>
        </div>
      </div>
    </main>
  );
}
