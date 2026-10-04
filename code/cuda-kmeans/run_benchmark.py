"""
run_benchmark.py
Runs kmeans.exe across all configurations, saves results to benchmark_results.csv,
and generates speedup plots for the report.

Usage (from x64 Native Tools Command Prompt):
    python run_benchmark.py

Requirements: pip install matplotlib
"""

import subprocess
import csv
import re
import sys
import os
import time

EXE = "kmeans.exe"
RESULTS_CSV = "benchmark_results.csv"
PLOT_THREADS = "plot_vary_threads.png"
PLOT_BLOCKS  = "plot_vary_blocks.png"

# ── Configurations ──────────────────────────────────────────────────────────
# (threadsPerBlock, blocksPerGrid)  blocksPerGrid=None → auto from N
N = 3_000_000

def auto_blocks(tpb):
    return (N + tpb - 1) // tpb

CONFIGS_THREADS = [
    # label,  tpb,   bpg
    ("serial",   1,     1),
    ("32",      32,  auto_blocks(32)),
    ("64",      64,  auto_blocks(64)),
    ("128",    128,  auto_blocks(128)),
    ("256",    256,  auto_blocks(256)),
    ("512",    512,  auto_blocks(512)),
    ("1024", 1024,  auto_blocks(1024)),
]

CONFIGS_BLOCKS = [
    # label, tpb, bpg   (threads fixed at 256)
    ("1",      256,     1),
    ("4",      256,     4),
    ("16",     256,    16),
    ("64",     256,    64),
    ("128",    256,   128),
    ("256",    256,   256),
    ("512",    256,   512),
    ("1024",   256,  1024),
    ("2048",   256,  2048),
    ("4096",   256,  4096),
    ("8192",   256,  8192),
    ("11719",  256, 11719),
]

ALL_CONFIGS = CONFIGS_THREADS + CONFIGS_BLOCKS[1:]  # skip duplicate 256/11719

# ── Runner ───────────────────────────────────────────────────────────────────
def run_config(tpb, bpg):
    cmd = [EXE, str(tpb), str(bpg)]
    print(f"  Running: threadsPerBlock={tpb}, blocksPerGrid={bpg} ... ", end="", flush=True)
    t0 = time.time()
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        output = result.stdout + result.stderr
    except subprocess.TimeoutExpired:
        print("TIMEOUT")
        return None
    except FileNotFoundError:
        print(f"\nERROR: {EXE} not found. Compile with: nvcc -O2 -o kmeans main.cu")
        sys.exit(1)

    compute  = re.search(r"Compute time:\s+([\d.]+)", output)
    xfer     = re.search(r"H->D transfer time:\s+([\d.]+)", output)
    total    = re.search(r"Total time \(w/ xfer\):\s+([\d.]+)", output)
    iters    = re.search(r"Total iterations:\s+(\d+)", output)

    if not compute:
        print("FAILED (could not parse output)")
        print("  Output was:", output[:300])
        return None

    row = {
        "compute_ms": float(compute.group(1)),
        "xfer_ms":    float(xfer.group(1))   if xfer  else 0.0,
        "total_ms":   float(total.group(1))  if total else 0.0,
        "iterations": int(iters.group(1))    if iters else 0,
    }
    print(f"{row['compute_ms']:.1f} ms ({time.time()-t0:.0f}s elapsed)")
    return row

# ── Main ────────────────────────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  K-Means CUDA Benchmark")
    print("=" * 60)

    results = []
    for label, tpb, bpg in ALL_CONFIGS:
        row = run_config(tpb, bpg)
        if row:
            results.append({"label": label, "tpb": tpb, "bpg": bpg, **row})

    if not results:
        print("No results collected.")
        return

    # Serial baseline for speedup
    serial = next((r for r in results if r["tpb"] == 1 and r["bpg"] == 1), None)
    if serial:
        serial_t = serial["compute_ms"]
        for r in results:
            r["speedup"] = round(serial_t / r["compute_ms"], 4) if r["compute_ms"] > 0 else 0
    else:
        print("Warning: serial baseline not found, speedup = N/A")
        for r in results:
            r["speedup"] = ""

    # ── Save CSV ─────────────────────────────────────────────────────────────
    fields = ["tpb", "bpg", "compute_ms", "xfer_ms", "total_ms", "iterations", "speedup"]
    with open(RESULTS_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)
    print(f"\nResults saved to {RESULTS_CSV}")

    # ── Plots ─────────────────────────────────────────────────────────────────
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not installed — skipping plots.")
        print("Install with: pip install matplotlib")
        return

    # Vary-threads experiment: configs where bpg was auto-calculated (one entry per tpb)
    seen_tpb = set()
    thread_results = []
    for r in results:
        if r["tpb"] != 1 and r["bpg"] == auto_blocks(r["tpb"]) and r["tpb"] not in seen_tpb:
            thread_results.append(r)
            seen_tpb.add(r["tpb"])

    # Vary-blocks experiment: tpb==256, one entry per unique bpg, sorted
    seen_bpg = set()
    block_results = []
    for r in sorted([r for r in results if r["tpb"] == 256], key=lambda r: r["bpg"]):
        if r["bpg"] not in seen_bpg:
            block_results.append(r)
            seen_bpg.add(r["bpg"])

    # Plot 1: Vary threads per block
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    tpb_labels  = [r["tpb"]       for r in thread_results]
    tpb_times   = [r["compute_ms"] for r in thread_results]
    tpb_speedup = [r["speedup"]    for r in thread_results]

    ax1.plot(tpb_labels, tpb_times, "o-", color="steelblue", linewidth=2, markersize=7)
    ax1.set_xlabel("Threads per Block")
    ax1.set_ylabel("Compute Time (ms)")
    ax1.set_title("Execution Time vs. Threads per Block\n(blocks auto-calculated)")
    ax1.set_xscale("log", base=2)
    ax1.set_xticks(tpb_labels)
    ax1.set_xticklabels(tpb_labels)
    ax1.grid(True, alpha=0.3)

    ax2.plot(tpb_labels, tpb_speedup, "s-", color="darkorange", linewidth=2, markersize=7)
    ax2.set_xlabel("Threads per Block")
    ax2.set_ylabel("Speedup (vs. serial)")
    ax2.set_title("Speedup vs. Threads per Block")
    ax2.set_xscale("log", base=2)
    ax2.set_xticks(tpb_labels)
    ax2.set_xticklabels(tpb_labels)
    ax2.axhline(y=1, color="gray", linestyle="--", alpha=0.5, label="Baseline")
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(PLOT_THREADS, dpi=150)
    print(f"Plot saved: {PLOT_THREADS}")
    plt.close()

    # Plot 2: Fix threads=256, vary blocks
    bpg_labels  = [r["bpg"]        for r in block_results]
    bpg_times   = [r["compute_ms"] for r in block_results]
    bpg_speedup = [r["speedup"]    for r in block_results]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    ax1.plot(range(len(bpg_labels)), bpg_times, "o-", color="steelblue", linewidth=2, markersize=7)
    ax1.set_xlabel("Number of Blocks")
    ax1.set_ylabel("Compute Time (ms)")
    ax1.set_title("Execution Time vs. Blocks\n(threadsPerBlock = 256)")
    ax1.set_xticks(range(len(bpg_labels)))
    ax1.set_xticklabels(bpg_labels, rotation=45)
    ax1.grid(True, alpha=0.3)

    ax2.plot(range(len(bpg_labels)), bpg_speedup, "s-", color="darkorange", linewidth=2, markersize=7)
    ax2.set_xlabel("Number of Blocks")
    ax2.set_ylabel("Speedup (vs. serial)")
    ax2.set_title("Speedup vs. Blocks\n(threadsPerBlock = 256)")
    ax2.set_xticks(range(len(bpg_labels)))
    ax2.set_xticklabels(bpg_labels, rotation=45)
    ax2.axhline(y=1, color="gray", linestyle="--", alpha=0.5, label="Baseline")
    ax2.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(PLOT_BLOCKS, dpi=150)
    print(f"Plot saved: {PLOT_BLOCKS}")
    plt.close()

    # ── Print summary table ──────────────────────────────────────────────────
    print("\n--- Results Summary ---")
    print(f"{'TPB':>6} {'BPG':>7} {'Compute(ms)':>12} {'Xfer(ms)':>10} {'Speedup':>9}")
    print("-" * 50)
    for r in results:
        print(f"{r['tpb']:>6} {r['bpg']:>7} {r['compute_ms']:>12.2f} "
              f"{r['xfer_ms']:>10.2f} {r['speedup']:>9}")

if __name__ == "__main__":
    main()
