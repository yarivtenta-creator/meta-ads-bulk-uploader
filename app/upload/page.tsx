"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// ─── Creative row sub-component (avoids useRef inside .map()) ─────────────────

function CreativeRow({
  creative,
  adName,
  thumbLoading,
  thumbDone,
  onNameChange,
  onThumbUpload,
}: {
  creative: CreativeRecord;
  adName: string;
  thumbLoading: boolean;
  thumbDone: boolean;
  onNameChange: (name: string) => void;
  onThumbUpload: (file: File) => void;
}) {
  const thumbRef = useRef<HTMLInputElement>(null);
  return (
    <li className="flex items-center gap-3">
      <span className="text-base">{creative.fileType === "video" ? "📹" : "🖼️"}</span>
      <span className="text-sm text-zinc-400 truncate max-w-[160px]">{creative.fileName}</span>
      <input
        type="text"
        value={adName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Ad name"
        className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
      />
      {creative.fileType === "video" && (
        <>
          <button
            onClick={() => thumbRef.current?.click()}
            disabled={thumbLoading}
            className={`shrink-0 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
              thumbDone
                ? "border-green-700 text-green-400"
                : "border-zinc-600 text-zinc-400 hover:border-zinc-500"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {thumbLoading ? "..." : thumbDone ? "✓ Thumb" : "+ Thumb"}
          </button>
          <input
            ref={thumbRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onThumbUpload(f);
            }}
          />
        </>
      )}
    </li>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectedFile {
  file: File;
  id: string; // local temp id
}

interface CreativeRecord {
  id: number;
  batchId: number;
  fileName: string;
  fileType: "image" | "video";
  adName: string;
  thumbnailPath?: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
}

interface LaunchResult {
  adsCreated: number;
  adsErrored: number;
  errorLog: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMB(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
}

function todayString() {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const CTA_OPTIONS = [
  "LEARN_MORE",
  "SHOP_NOW",
  "SIGN_UP",
  "SUBSCRIBE",
  "GET_OFFER",
  "ORDER_NOW",
  "BOOK_NOW",
  "CONTACT_US",
  "DOWNLOAD",
  "GET_QUOTE",
  "APPLY_NOW",
  "BUY_NOW",
  "WATCH_MORE",
  "SEE_MENU",
  "SEND_MESSAGE",
  "GET_STARTED",
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ["Upload Creatives", "Ad Copy & URL", "Campaign & Launch"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  done ? "text-green-500" : active ? "text-blue-400" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-16 mx-2 mb-5 transition-colors ${
                  step > num ? "bg-green-700" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UploadPage() {
  const [settingsOk, setSettingsOk] = useState<boolean | null>(null);
  const [step, setStep] = useState(1);

  // Step 1
  const [batchName, setBatchName] = useState(`Batch ${todayString()}`);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Step 2
  const [batchId, setBatchId] = useState<number | null>(null);
  const [uploadedCreatives, setUploadedCreatives] = useState<CreativeRecord[]>([]);
  const [adNames, setAdNames] = useState<Record<number, string>>({});
  const [thumbLoading, setThumbLoading] = useState<Record<number, boolean>>({});
  const [thumbDone, setThumbDone] = useState<Record<number, boolean>>({});
  const [primaryTexts, setPrimaryTexts] = useState<string[]>([""]);
  const [headlines, setHeadlines] = useState<string[]>([""]);
  const [descriptions, setDescriptions] = useState<string[]>([""]);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [displayLink, setDisplayLink] = useState("");
  const [ctaType, setCtaType] = useState("LEARN_MORE");
  const [step2Error, setStep2Error] = useState("");

  // Step 3
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [selectedAdSet, setSelectedAdSet] = useState("");
  const [createMode, setCreateMode] = useState(false);
  const [sourceAdSet, setSourceAdSet] = useState("");
  const [newAdSetName, setNewAdSetName] = useState("");
  const [creatingAdSet, setCreatingAdSet] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loadingAdSets, setLoadingAdSets] = useState(false);
  const [launchAsPaused, setLaunchAsPaused] = useState(true);
  const [enhancementsEnabled, setEnhancementsEnabled] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
  const [launchError, setLaunchError] = useState("");

  // Check settings on load (Prompt 14)
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(({ settings }) => {
        setSettingsOk(!!(settings?.metaAccessToken && settings?.adAccountId));
      })
      .catch(() => setSettingsOk(false));
  }, []);

  // Load campaigns when step 3 loads
  useEffect(() => {
    if (step !== 3) return;
    setLoadingCampaigns(true);
    fetch("/api/meta/campaigns")
      .then((r) => r.json())
      .then(({ campaigns }) => setCampaigns(campaigns ?? []))
      .catch(() => {})
      .finally(() => setLoadingCampaigns(false));
  }, [step]);

  // Load ad sets when campaign changes
  useEffect(() => {
    if (!selectedCampaign) return;
    setAdSets([]);
    setSelectedAdSet("");
    setLoadingAdSets(true);
    fetch(`/api/meta/adsets?campaignId=${selectedCampaign}`)
      .then((r) => r.json())
      .then(({ adSets }) => setAdSets(adSets ?? []))
      .catch(() => {})
      .finally(() => setLoadingAdSets(false));
  }, [selectedCampaign]);

  // ── File handling ──────────────────────────────────────────────────────────

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const valid = arr.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    setSelectedFiles((prev) => [
      ...prev,
      ...valid.map((f) => ({ file: f, id: `${Date.now()}-${Math.random()}` })),
    ]);
  }

  function removeFile(id: string) {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }

  // ── Step 1 → 2 upload ─────────────────────────────────────────────────────

  async function handleUpload() {
    if (!selectedFiles.length || !batchName) return;
    setUploading(true);
    setUploadError("");
    try {
      // Create batch
      const batchRes = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchName }),
      });
      const batchData = await batchRes.json();
      if (!batchRes.ok) throw new Error(batchData.error ?? "Failed to create batch");
      const newBatchId: number = batchData.batch.id;
      setBatchId(newBatchId);

      // Upload files
      const form = new FormData();
      form.append("batchId", String(newBatchId));
      for (const sf of selectedFiles) form.append("files", sf.file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? "Upload failed");

      const recs: CreativeRecord[] = uploadData.creatives ?? [];
      setUploadedCreatives(recs);
      const names: Record<number, string> = {};
      for (const r of recs) names[r.id] = r.adName;
      setAdNames(names);
      setStep(2);
    } catch (e) {
      setUploadError(String(e));
    } finally {
      setUploading(false);
    }
  }

  // ── Step 2 helpers ─────────────────────────────────────────────────────────

  async function saveAdName(id: number, name: string) {
    setAdNames((prev) => ({ ...prev, [id]: name }));
    await fetch("/api/creative", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adName: name }),
    });
  }

  async function uploadThumbnail(creativeId: number, file: File) {
    setThumbLoading((p) => ({ ...p, [creativeId]: true }));
    const form = new FormData();
    form.append("creativeId", String(creativeId));
    form.append("thumbnail", file);
    await fetch("/api/creative/thumbnail", { method: "POST", body: form });
    setThumbLoading((p) => ({ ...p, [creativeId]: false }));
    setThumbDone((p) => ({ ...p, [creativeId]: true }));
  }

  function addVariation(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    max = 5
  ) {
    setter((prev) => (prev.length < max ? [...prev, ""] : prev));
  }

  function updateVariation(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    value: string
  ) {
    setter((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function removeVariation(
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) {
    setter((prev) => prev.filter((_, i) => i !== index));
  }

  function handleStep2Next() {
    setStep2Error("");
    if (!primaryTexts.some((t) => t.trim())) {
      setStep2Error("At least one primary text is required.");
      return;
    }
    if (!headlines.some((h) => h.trim())) {
      setStep2Error("At least one headline is required.");
      return;
    }
    if (!websiteUrl.trim()) {
      setStep2Error("Website URL is required.");
      return;
    }
    setStep(3);
  }

  // ── Step 3 / Launch ────────────────────────────────────────────────────────

  async function handleCreateAdSet() {
    if (!newAdSetName || !selectedCampaign || !sourceAdSet) return;
    setCreatingAdSet(true);
    try {
      const res = await fetch("/api/meta/adsets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAdSetName,
          campaignId: selectedCampaign,
          sourceAdSetId: sourceAdSet,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create ad set");
      const newSet: AdSet = {
        id: data.adSet.id as string,
        name: newAdSetName,
        status: "PAUSED",
      };
      setAdSets((prev) => [...prev, newSet]);
      setSelectedAdSet(newSet.id);
      setCreateMode(false);
      setNewAdSetName("");
    } catch (e) {
      alert(String(e));
    } finally {
      setCreatingAdSet(false);
    }
  }

  async function handleLaunch() {
    if (!batchId || !selectedAdSet) return;
    setLaunchError("");
    setLaunching(true);

    // Save batch settings first
    const campaignObj = campaigns.find((c) => c.id === selectedCampaign);
    const adSetObj = adSets.find((a) => a.id === selectedAdSet);
    await fetch("/api/batch", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: batchId,
        campaignId: selectedCampaign,
        campaignName: campaignObj?.name ?? "",
        adSetId: selectedAdSet,
        adSetName: adSetObj?.name ?? "",
        primaryTexts: primaryTexts.filter((t) => t.trim()),
        headlines: headlines.filter((h) => h.trim()),
        descriptions: descriptions.filter((d) => d.trim()),
        ctaType,
        websiteUrl,
        displayLink,
        launchAsPaused,
        enhancementsEnabled,
      }),
    });

    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Launch failed");
      setLaunchResult(data as LaunchResult);
    } catch (e) {
      setLaunchError(String(e));
    } finally {
      setLaunching(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setSelectedFiles([]);
    setBatchName(`Batch ${todayString()}`);
    setBatchId(null);
    setUploadedCreatives([]);
    setAdNames({});
    setThumbDone({});
    setPrimaryTexts([""]);
    setHeadlines([""]);
    setDescriptions([""]);
    setWebsiteUrl("");
    setDisplayLink("");
    setCtaType("LEARN_MORE");
    setSelectedCampaign("");
    setSelectedAdSet("");
    setAdSets([]);
    setCreateMode(false);
    setNewAdSetName("");
    setLaunchResult(null);
    setLaunchError("");
    setLaunchAsPaused(true);
    setEnhancementsEnabled(false);
  }

  // ── Settings guard (Prompt 14) ─────────────────────────────────────────────

  if (settingsOk === null) {
    return (
      <main className="flex-1 px-8 py-8">
        <div className="flex items-center justify-center py-24 text-zinc-500 text-sm">
          Loading...
        </div>
      </main>
    );
  }

  if (!settingsOk) {
    return (
      <main className="flex-1 px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100">Bulk Upload</h1>
        </div>
        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-8 text-center">
          <p className="text-lg font-semibold text-amber-300 mb-2">Setup Required</p>
          <p className="text-sm text-amber-600/80 mb-6">
            You need to connect your Meta account before uploading ads.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            Go to Settings
          </Link>
        </div>
      </main>
    );
  }

  // ── Launch result screen ───────────────────────────────────────────────────

  if (launchResult) {
    return (
      <main className="flex-1 px-8 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-100">Launch Results</h1>
        </div>

        {launchResult.adsCreated > 0 && (
          <div className="rounded-xl border border-green-800 bg-green-950/40 p-6 mb-4">
            <p className="text-lg font-semibold text-green-300">
              ✓ {launchResult.adsCreated} ad{launchResult.adsCreated !== 1 ? "s" : ""} created successfully
            </p>
          </div>
        )}

        {launchResult.adsErrored > 0 && (
          <div className="rounded-xl border border-red-800 bg-red-950/40 p-6 mb-4">
            <p className="text-sm font-semibold text-red-300 mb-3">
              ⚠ {launchResult.adsErrored} ad{launchResult.adsErrored !== 1 ? "s" : ""} failed
            </p>
            <ul className="space-y-1">
              {launchResult.errorLog.map((e, i) => (
                <li key={i} className="text-xs text-red-400 font-mono break-all">
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={resetWizard}
          className="mt-4 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          Upload Another Batch
        </button>
      </main>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="flex-1 px-8 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Bulk Upload</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Upload ad creatives and launch dozens of ads at once.
        </p>
      </div>

      <StepIndicator step={step} />

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Batch Name */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Batch Name
            </label>
            <input
              type="text"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Drop zone */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-3">
              Creative Files
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                dragging
                  ? "border-blue-500 bg-blue-950/20"
                  : "border-zinc-700 hover:border-zinc-600"
              }`}
            >
              <div className="flex justify-center mb-3">
                <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-300">Drag & drop images or videos</p>
              <p className="text-xs text-zinc-600 mt-1">JPG, PNG, WebP, MP4, MOV, AVI</p>
              <button
                type="button"
                className="mt-4 px-4 py-1.5 rounded-lg border border-zinc-600 text-zinc-300 text-sm hover:border-zinc-500 transition-colors"
              >
                Browse Files
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            {/* File list */}
            {selectedFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedFiles.map((sf) => (
                  <li
                    key={sf.id}
                    className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">
                        {sf.file.type.startsWith("video/") ? "📹" : "🖼️"}
                      </span>
                      <span className="text-sm text-zinc-200 truncate">{sf.file.name}</span>
                      <span className="text-xs text-zinc-500 shrink-0">
                        {formatMB(sf.file.size)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(sf.id); }}
                      className="text-zinc-600 hover:text-red-400 transition-colors ml-2 shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {uploadError && (
            <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
              {uploadError}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploading || !selectedFiles.length || !batchName}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              `Upload ${selectedFiles.length > 0 ? selectedFiles.length + " file" + (selectedFiles.length !== 1 ? "s" : "") : "Files"}`
            )}
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Creatives summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Uploaded Creatives
            </h2>
            <ul className="space-y-3">
              {uploadedCreatives.map((c) => (
                <CreativeRow
                  key={c.id}
                  creative={c}
                  adName={adNames[c.id] ?? c.adName}
                  thumbLoading={!!thumbLoading[c.id]}
                  thumbDone={!!thumbDone[c.id]}
                  onNameChange={(name) => saveAdName(c.id, name)}
                  onThumbUpload={(file) => uploadThumbnail(c.id, file)}
                />
              ))}
            </ul>
          </div>

          {/* Primary Text */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Primary Text</h2>
                <p className="text-xs text-zinc-600 mt-0.5">Meta rotates them automatically</p>
              </div>
              {primaryTexts.length < 5 && (
                <button
                  onClick={() => addVariation(setPrimaryTexts)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add variation
                </button>
              )}
            </div>
            <div className="space-y-2">
              {primaryTexts.map((t, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={t}
                    onChange={(e) => updateVariation(setPrimaryTexts, i, e.target.value)}
                    rows={2}
                    placeholder={`Primary text ${i + 1}`}
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  {primaryTexts.length > 1 && (
                    <button
                      onClick={() => removeVariation(setPrimaryTexts, i)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Headlines */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Headlines</h2>
              {headlines.length < 5 && (
                <button
                  onClick={() => addVariation(setHeadlines)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add variation
                </button>
              )}
            </div>
            <div className="space-y-2">
              {headlines.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={h}
                    onChange={(e) => updateVariation(setHeadlines, i, e.target.value)}
                    placeholder={`Headline ${i + 1}`}
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  {headlines.length > 1 && (
                    <button
                      onClick={() => removeVariation(setHeadlines, i)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Descriptions */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Descriptions</h2>
              {descriptions.length < 5 && (
                <button
                  onClick={() => addVariation(setDescriptions)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  + Add variation
                </button>
              )}
            </div>
            <div className="space-y-2">
              {descriptions.map((d, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={d}
                    onChange={(e) => updateVariation(setDescriptions, i, e.target.value)}
                    placeholder={`Description ${i + 1}`}
                    className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  {descriptions.length > 1 && (
                    <button
                      onClick={() => removeVariation(setDescriptions, i)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Destination & CTA */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
              Destination & CTA
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Website URL *</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Display Link (optional)</label>
                <input
                  type="text"
                  value={displayLink}
                  onChange={(e) => setDisplayLink(e.target.value)}
                  placeholder="example.com"
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 block mb-1">Call to Action</label>
                <select
                  value={ctaType}
                  onChange={(e) => setCtaType(e.target.value)}
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {CTA_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {step2Error && (
            <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
              {step2Error}
            </div>
          )}

          <button
            onClick={handleStep2Next}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
          >
            Continue to Campaign →
          </button>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Campaign */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">Campaign</h2>
            {loadingCampaigns ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                Loading campaigns...
              </div>
            ) : (
              <select
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a campaign...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ad Set */}
          {selectedCampaign && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Ad Set</h2>
                <button
                  onClick={() => setCreateMode(!createMode)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {createMode ? "← Use existing" : "Create new ad set"}
                </button>
              </div>

              {!createMode ? (
                loadingAdSets ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <span className="inline-block w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                    Loading ad sets...
                  </div>
                ) : (
                  <select
                    value={selectedAdSet}
                    onChange={(e) => setSelectedAdSet(e.target.value)}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select an ad set...</option>
                    {adSets.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} — {a.status}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">Copy settings from</label>
                    <select
                      value={sourceAdSet}
                      onChange={(e) => setSourceAdSet(e.target.value)}
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select source ad set...</option>
                      {adSets.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 block mb-1">New ad set name</label>
                    <input
                      type="text"
                      value={newAdSetName}
                      onChange={(e) => setNewAdSetName(e.target.value)}
                      placeholder="My Ad Set Copy"
                      className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleCreateAdSet}
                    disabled={creatingAdSet || !newAdSetName || !sourceAdSet}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {creatingAdSet ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Ad Set"
                    )}
                  </button>
                  <p className="text-xs text-zinc-600">
                    Dynamic Creative ad sets only allow 1 ad — use Create new ad set for bulk uploads.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Launch Options */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-4">Launch Options</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={launchAsPaused}
                  onChange={(e) => setLaunchAsPaused(e.target.checked)}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <p className="text-sm text-zinc-200 font-medium">Launch as paused</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Review in Ads Manager before activating</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enhancementsEnabled}
                  onChange={(e) => setEnhancementsEnabled(e.target.checked)}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <p className="text-sm text-zinc-200 font-medium">Enable creative enhancements</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Meta AI auto-adjusts your creative</p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Creatives</dt>
                <dd className="text-zinc-200 font-medium">{uploadedCreatives.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Text variations</dt>
                <dd className="text-zinc-200">{primaryTexts.filter(Boolean).length}P / {headlines.filter(Boolean).length}H / {descriptions.filter(Boolean).length}D</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">CTA</dt>
                <dd className="text-zinc-200">{ctaType.replace(/_/g, " ")}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">URL</dt>
                <dd className="text-zinc-200 truncate max-w-[200px]">{websiteUrl || "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Enhancements</dt>
                <dd className="text-zinc-200">{enhancementsEnabled ? "On" : "Off"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Launch status</dt>
                <dd className="text-zinc-200">{launchAsPaused ? "Paused" : "Active"}</dd>
              </div>
            </dl>
          </div>

          {launchError && (
            <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
              {launchError}
            </div>
          )}

          <button
            onClick={handleLaunch}
            disabled={launching || !selectedAdSet}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {launching ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Launching {uploadedCreatives.length} ad{uploadedCreatives.length !== 1 ? "s" : ""}...
              </>
            ) : (
              `Launch ${uploadedCreatives.length} Ad${uploadedCreatives.length !== 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </main>
  );
}
