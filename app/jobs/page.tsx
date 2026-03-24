"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Batch {
  id: number;
  batchName: string;
  campaignName: string | null;
  adSetName: string | null;
  status: "draft" | "uploading" | "complete" | "error";
  adsCreated: number;
  adsErrored: number;
  errorLog: string[];
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  complete: "bg-green-900/50 text-green-300 border border-green-800",
  error: "bg-red-900/50 text-red-300 border border-red-800",
  uploading: "bg-amber-900/50 text-amber-300 border border-amber-800",
  draft: "bg-zinc-800 text-zinc-400 border border-zinc-700",
};

export default function JobsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/batch")
      .then((r) => r.json())
      .then(({ batches }) => setBatches(batches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">History</h1>
        <p className="mt-1 text-sm text-zinc-400">
          All upload batches, newest first.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500 py-16">
          <span className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
          Loading...
        </div>
      ) : batches.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-400">No batches yet</p>
          <p className="mt-1 text-xs text-zinc-600 max-w-xs mb-6">
            Upload your first batch of ad creatives to get started.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Upload First Batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-100 truncate">{b.batchName}</p>
                  {(b.campaignName || b.adSetName) && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {b.campaignName && <span>{b.campaignName}</span>}
                      {b.campaignName && b.adSetName && <span className="mx-1">→</span>}
                      {b.adSetName && <span>{b.adSetName}</span>}
                    </p>
                  )}
                  <p className="text-xs text-zinc-600 mt-1">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {b.adsCreated > 0 && (
                    <span className="text-xs font-semibold text-green-400">
                      {b.adsCreated} created
                    </span>
                  )}
                  {b.adsErrored > 0 && (
                    <span className="text-xs font-semibold text-red-400">
                      {b.adsErrored} errors
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[b.status]}`}>
                    {b.status}
                  </span>
                </div>
              </div>

              {b.errorLog?.length > 0 && b.status === "error" && (
                <div className="mt-3 rounded-lg bg-red-950/40 border border-red-900/50 p-3">
                  <p className="text-xs font-semibold text-red-400 mb-1">Errors</p>
                  <ul className="space-y-1">
                    {b.errorLog.map((e, i) => (
                      <li key={i} className="text-xs text-red-500 font-mono break-all">
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
