import Link from "next/link";

const stats = [
  { label: "Total Ads Uploaded", value: "0", change: "—" },
  { label: "Active Campaigns", value: "0", change: "—" },
  { label: "Upload Jobs", value: "0", change: "—" },
  { label: "API Errors", value: "0", change: "—" },
];

export default function DashboardPage() {
  return (
    <main className="flex-1 px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Monitor your bulk upload jobs and ad account activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
          >
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-zinc-100">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Recent jobs empty state */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider">
          Recent Upload Jobs
        </h2>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-400">
              No upload jobs yet
            </p>
            <p className="mt-1 text-xs text-zinc-600 max-w-xs">
              Start your first bulk upload by importing a CSV with your ad
              creatives and targeting parameters.
            </p>
            <Link
              href="/upload"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Start First Upload
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
