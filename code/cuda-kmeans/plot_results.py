"""
plot_results.py
Regenerates plots from existing benchmark_results.csv without re-running benchmarks.
Usage: python plot_results.py
"""

import csv
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

N = 3_000_000
def auto_blocks(tpb):
    return (N + tpb - 1) // tpb

# ── Load CSV ─────────────────────────────────────────────────────────────────
results = []
with open("benchmark_results.csv") as f:
    for row in csv.DictReader(f):
        results.append({
            "tpb":        int(row["tpb"]),
            "bpg":        int(row["bpg"]),
            "compute_ms": float(row["compute_ms"]),
            "xfer_ms":    float(row["xfer_ms"]),
            "total_ms":   float(row["total_ms"]),
            "iterations": int(row["iterations"]),
            "speedup":    float(row["speedup"]),
        })

serial = next(r for r in results if r["tpb"] == 1 and r["bpg"] == 1)

# Vary-threads: one entry per tpb (skip serial), bpg == auto_blocks(tpb)
seen_tpb = set()
thread_results = []
for r in results:
    if r["tpb"] != 1 and r["bpg"] == auto_blocks(r["tpb"]) and r["tpb"] not in seen_tpb:
        thread_results.append(r)
        seen_tpb.add(r["tpb"])
thread_results.sort(key=lambda r: r["tpb"])

# Vary-blocks: tpb==256, one entry per unique bpg, sorted
seen_bpg = set()
block_results = []
for r in sorted([r for r in results if r["tpb"] == 256], key=lambda r: r["bpg"]):
    if r["bpg"] not in seen_bpg:
        block_results.append(r)
        seen_bpg.add(r["bpg"])

# ── Plot 1: Vary threads per block ────────────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle("K-Means CUDA: Vary Threads per Block  (N = 3,000,000 games, K = 5)", fontsize=12)

tpb_x      = [r["tpb"]        for r in thread_results]
tpb_times  = [r["compute_ms"] for r in thread_results]
tpb_speedup= [r["speedup"]    for r in thread_results]

ax1.plot(tpb_x, tpb_times, "o-", color="steelblue", linewidth=2, markersize=8)
ax1.set_xlabel("Threads per Block")
ax1.set_ylabel("Compute Time (ms)")
ax1.set_title("Execution Time vs. Threads per Block")
ax1.set_xscale("log", base=2)
ax1.set_xticks(tpb_x)
ax1.set_xticklabels(tpb_x)
ax1.set_ylim(bottom=0)
ax1.grid(True, alpha=0.3)

ax2.plot(tpb_x, tpb_speedup, "s-", color="darkorange", linewidth=2, markersize=8)
ax2.set_xlabel("Threads per Block")
ax2.set_ylabel("Speedup (vs. serial)")
ax2.set_title("Speedup vs. Threads per Block")
ax2.set_xscale("log", base=2)
ax2.set_xticks(tpb_x)
ax2.set_xticklabels(tpb_x)
ax2.axhline(y=1, color="gray", linestyle="--", alpha=0.5, label="Serial baseline")
ax2.set_ylim(bottom=0)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("plot_vary_threads.png", dpi=150)
print("Saved plot_vary_threads.png")
plt.close()

# ── Plot 2: Vary blocks (fixed tpb=256) ───────────────────────────────────────
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(13, 5))
fig.suptitle("K-Means CUDA: Vary Number of Blocks  (threadsPerBlock = 256, N = 3,000,000)", fontsize=12)

bpg_x      = list(range(len(block_results)))
bpg_labels = [str(r["bpg"]) for r in block_results]
bpg_times  = [r["compute_ms"] for r in block_results]
bpg_speedup= [r["speedup"]    for r in block_results]

ax1.plot(bpg_x, bpg_times, "o-", color="steelblue", linewidth=2, markersize=8)
ax1.set_xlabel("Number of Blocks")
ax1.set_ylabel("Compute Time (ms)")
ax1.set_title("Execution Time vs. Number of Blocks")
ax1.set_xticks(bpg_x)
ax1.set_xticklabels(bpg_labels, rotation=45)
ax1.set_ylim(bottom=0)
ax1.grid(True, alpha=0.3)

ax2.plot(bpg_x, bpg_speedup, "s-", color="darkorange", linewidth=2, markersize=8)
ax2.set_xlabel("Number of Blocks")
ax2.set_ylabel("Speedup (vs. serial)")
ax2.set_title("Speedup vs. Number of Blocks")
ax2.set_xticks(bpg_x)
ax2.set_xticklabels(bpg_labels, rotation=45)
ax2.axhline(y=1, color="gray", linestyle="--", alpha=0.5, label="Serial baseline")
ax2.set_ylim(bottom=0)
ax2.grid(True, alpha=0.3)

plt.tight_layout()
plt.savefig("plot_vary_blocks.png", dpi=150)
print("Saved plot_vary_blocks.png")
plt.close()

# ── Print tables ──────────────────────────────────────────────────────────────
print(f"\nSerial baseline: {serial['compute_ms']:.1f} ms  ({serial['compute_ms']/1000/60:.1f} min)\n")

print("Table 1: Vary Threads per Block (blocks auto-calculated)")
print(f"{'TPB':>6}  {'Blocks':>7}  {'Compute (ms)':>13}  {'Speedup':>9}")
print("-" * 45)
for r in thread_results:
    print(f"{r['tpb']:>6}  {r['bpg']:>7}  {r['compute_ms']:>13.2f}  {r['speedup']:>9.2f}x")

print("\nTable 2: Vary Number of Blocks (threadsPerBlock = 256)")
print(f"{'Blocks':>7}  {'Compute (ms)':>13}  {'Speedup':>9}")
print("-" * 35)
for r in block_results:
    print(f"{r['bpg']:>7}  {r['compute_ms']:>13.2f}  {r['speedup']:>9.2f}x")
