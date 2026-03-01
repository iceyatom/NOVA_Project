"use client";

import { useActionState } from "react";
import { useRef } from "react";
import Link from "next/link";
import { hashAction, verifyAction } from "./actions";

type HashState = { hash?: string; error?: string } | null;
type VerifyState = { match?: boolean; error?: string } | null;

export default function PasswordHashTestPage() {
  const [hashState, hashDispatch, hashPending] = useActionState<
    HashState,
    FormData
  >(async (_prev, formData) => hashAction(formData), null);

  const [verifyState, verifyDispatch, verifyPending] = useActionState<
    VerifyState,
    FormData
  >(async (_prev, formData) => verifyAction(formData), null);

  const verifyHashRef = useRef<HTMLInputElement>(null);

  function copyHashToVerify() {
    if (hashState?.hash && verifyHashRef.current) {
      verifyHashRef.current.value = hashState.hash;
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Banner */}
        <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 px-6 py-4 text-center">
          <p className="text-yellow-400 font-bold tracking-widest text-sm uppercase">
            ⚠ Developer Only — Not for Public Use ⚠
          </p>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Password Hash Test</h1>
          <Link
            href="/staff/dev-hub"
            className="text-sm text-blue-400 hover:underline"
          >
            ← Back to Dev Hub
          </Link>
        </div>

        {/* Hash section */}
        <section className="rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Hash a Password</h2>
          <form action={hashDispatch} className="space-y-3">
            <div>
              <label
                htmlFor="hash-plaintext"
                className="block text-sm text-gray-400 mb-1"
              >
                Plaintext password
              </label>
              <input
                id="hash-plaintext"
                name="plaintext"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Enter password to hash…"
              />
            </div>
            <button
              type="submit"
              disabled={hashPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {hashPending ? "Hashing…" : "Hash"}
            </button>
          </form>

          {hashState?.error && (
            <p className="text-sm text-red-400">{hashState.error}</p>
          )}

          {hashState?.hash && (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Result:</p>
              <code className="block rounded-lg bg-gray-800 border border-gray-600 px-4 py-3 text-xs break-all text-green-400 font-mono">
                {hashState.hash}
              </code>
              <button
                type="button"
                onClick={copyHashToVerify}
                className="text-xs text-blue-400 hover:underline"
              >
                Copy to Verify section ↓
              </button>
            </div>
          )}
        </section>

        {/* Verify section */}
        <section className="rounded-xl border border-gray-700 bg-gray-900 p-6 space-y-4">
          <h2 className="text-xl font-semibold">Verify a Password</h2>
          <form action={verifyDispatch} className="space-y-3">
            <div>
              <label
                htmlFor="verify-plaintext"
                className="block text-sm text-gray-400 mb-1"
              >
                Plaintext password
              </label>
              <input
                id="verify-plaintext"
                name="plaintext"
                type="text"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Enter plaintext…"
              />
            </div>
            <div>
              <label
                htmlFor="verify-hash"
                className="block text-sm text-gray-400 mb-1"
              >
                Hash to compare against
              </label>
              <input
                id="verify-hash"
                name="hash"
                type="text"
                autoComplete="off"
                ref={verifyHashRef}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                placeholder="Paste bcrypt hash…"
              />
            </div>
            <button
              type="submit"
              disabled={verifyPending}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition"
            >
              {verifyPending ? "Verifying…" : "Verify"}
            </button>
          </form>

          {verifyState?.error && (
            <p className="text-sm text-red-400">{verifyState.error}</p>
          )}

          {verifyState?.match !== undefined && (
            <div>
              {verifyState.match ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-green-500/20 border border-green-500 px-4 py-1.5 text-sm font-bold text-green-400">
                  PASS ✓
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/20 border border-red-500 px-4 py-1.5 text-sm font-bold text-red-400">
                  FAIL ✗
                </span>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
