# GPU-Parallel K-Means in CUDA

Source for project **P-04** on [the portfolio](../../projects/cuda-kmeans.html).
ELEC-5975 Parallel Computer Architecture, Wentworth Institute of Technology, spring 2026.
Sole author: Caleb Lawson.

K-Means clustering of 3,000,000 records × 20 features (K = 5, up to 50 iterations,
tolerance 1e-4), parallelised across an RTX 3070 Laptop GPU and benchmarked against the
same kernel run on a single GPU thread.

## Files

| File | What it does |
|---|---|
| `main.cu` | The program. Three kernels — `assignClustersKernel`, `sumCentroidsKernel` (atomicAdd accumulation), `averageCentroidsKernel` — all on a grid-stride loop, so `kmeans 1 1` is the one-thread baseline and any other launch is the parallel run. Times compute and host-to-device transfer separately with CUDA events. |
| `generate_mlb_data.py` | Builds `mlb_historical_data.csv`, the input `main.cu` reads. |
| `run_benchmark.py` | Runs every thread-per-block and block-count configuration, writes `benchmark_results.csv`, and plots both sweeps. |
| `plot_results.py` | Re-plots from an existing `benchmark_results.csv` without re-running. |

## Build and run

```sh
pip install MLB-StatsAPI pandas numpy scikit-learn matplotlib
python generate_mlb_data.py          # writes mlb_historical_data.csv (~3M rows)
nvcc -O2 -o kmeans main.cu           # CUDA 13.2 was used; any recent toolkit should do
./kmeans 256                         # parallel, blocks sized to cover the data
./kmeans 1 1                         # single-thread baseline (≈8 minutes)
python run_benchmark.py              # full sweep; expects kmeans(.exe) alongside
```

`run_benchmark.py` calls `kmeans.exe` — it was run on Windows. Change `EXE` at the top
of the file on Linux or macOS.

## About the data

`generate_mlb_data.py` pulls the real April–October 2023 MLB schedule through
`statsapi` and keeps the real box-score fields (runs, hits, errors, innings). The
advanced fields (pitcher ERA, wind, temperature, moneyline, over/under) and seven
padding dimensions are **randomly generated**, and the season is repeated until it
reaches 3,000,000 rows, then min-max scaled to 0–1. It is a load for benchmarking the
GPU, not a dataset to draw baseball conclusions from.

## Results (RTX 3070 Laptop, i7-11800H, `nvcc -O2`)

| Run | Compute time | Speedup |
|---|---|---|
| 1 block × 1 thread (baseline) | 474,221 ms | 1× |
| 23,438 blocks × 128 threads (best) | 1,856 ms | 255× |
| 4 blocks × 256 threads | — | 204× |
| 64 blocks × 256 threads | — | 252× (plateau) |

The baseline is the same kernel on **one GPU thread**, not an optimised CPU build — a
multi-core CPU comparison is the obvious next measurement. At 37 ms per iteration
against a ~25 ms floor set by 448 GB/s of memory bandwidth, the assignment kernel is
close to bandwidth-bound; the atomicAdd accumulation into five centroids is the next
thing to replace (shared-memory and warp-level reductions).
