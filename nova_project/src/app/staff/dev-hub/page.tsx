import Link from "next/link";

export default function StaffDevHubPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Banner */}
        <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 px-6 py-4 text-center">
          <p className="text-yellow-400 font-bold tracking-widest text-sm uppercase">
            ⚠ Developer Only — Not for Public Use ⚠
          </p>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Staff Dev Hub</h1>
          <p className="mt-2 text-gray-400">
            Internal developer tools for testing isolated utilities. These pages
            are not linked from any public navigation.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/staff/dev-hub/password-hash-test"
            className="group block rounded-xl border border-gray-700 bg-gray-900 p-6 transition hover:border-blue-500 hover:bg-gray-800"
          >
            <h2 className="text-lg font-semibold group-hover:text-blue-400">
              Password Hash Test
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Hash a plaintext password with bcryptjs (cost 12) and verify
              plaintext against an existing hash.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
