#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <cmath>
#include <cstdlib>
#include <cuda_runtime.h>

// Configuration
const int N = 3000000;    // Number of historical games
const int D = 20;         // Statistical dimensions per game
const int K = 5;          // Number of clusters
const int MAX_ITERS = 50; // Max iterations
const float TOLERANCE = 1e-4f;

// CUDA Error Checking

#define CHECK_CUDA(call)                                                       \
    do {                                                                       \
        cudaError_t err = (call);                                              \
        if (err != cudaSuccess) {                                              \
            std::cerr << "CUDA error at " << __FILE__ << ":" << __LINE__      \
                      << " (" << (int)err << "): "                            \
                      << cudaGetErrorString(err) << "\n";                     \
            exit(EXIT_FAILURE);                                                \
        }                                                                      \
    } while (0)

// Data Loader & Initialization

void loadCSVData(float* h_games, int n, int d, const std::string& filename) {
    std::ifstream file(filename);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open " << filename << "\n";
        exit(EXIT_FAILURE);
    }
    std::cout << "Loading MLB data from " << filename << "...\n";

    std::string line;
    int gameCount = 0;
    while (std::getline(file, line) && gameCount < n) {
        std::stringstream ss(line);
        std::string value;
        int dimCount = 0;
        while (std::getline(ss, value, ',') && dimCount < d) {
            h_games[gameCount * d + dimCount] = std::stof(value);
            ++dimCount;
        }
        ++gameCount;
    }
    std::cout << "Loaded " << gameCount << " games.\n";
    file.close();
}

void initializeCentroids(const float* h_games, float* h_centroids, int k, int d) {
    for (int c = 0; c < k; ++c) {
        for (int dim = 0; dim < d; ++dim) {
            h_centroids[c * d + dim] = h_games[c * d + dim];
        }
    }
}

// CUDA Kernels

// Each thread assigns one or more games to nearest centroid.
__global__ void assignClustersKernel(const float* __restrict__ d_games,
                                     const float* __restrict__ d_centroids,
                                     int* d_assignments,
                                     int n, int k, int d) {
    int stride = blockDim.x * gridDim.x;
    for (int gameIdx = blockIdx.x * blockDim.x + threadIdx.x; gameIdx < n; gameIdx += stride) {
        float minDist = 1e30f;
        int bestCluster = 0;
        for (int c = 0; c < k; ++c) {
            float dist = 0.0f;
            for (int dim = 0; dim < d; ++dim) {
                float diff = d_games[gameIdx * d + dim] - d_centroids[c * d + dim];
                dist += diff * diff;
            }
            if (dist < minDist) {
                minDist = dist;
                bestCluster = c;
            }
        }
        d_assignments[gameIdx] = bestCluster;
    }
}

// Each thread accumulates one or more games into cluster centroid sums
__global__ void sumCentroidsKernel(const float* __restrict__ d_games,
                                   const int* __restrict__ d_assignments,
                                   float* d_newCentroids,
                                   int* d_counts,
                                   int n, int d) {
    int stride = blockDim.x * gridDim.x;
    for (int gameIdx = blockIdx.x * blockDim.x + threadIdx.x; gameIdx < n; gameIdx += stride) {
        int clusterId = d_assignments[gameIdx];
        atomicAdd(&d_counts[clusterId], 1);
        for (int dim = 0; dim < d; ++dim) {
            atomicAdd(&d_newCentroids[clusterId * d + dim], d_games[gameIdx * d + dim]);
        }
    }
}

// Each thread finalizes one cluster's centroid by dividing by count
__global__ void averageCentroidsKernel(float* d_centroids, const int* d_counts, int k, int d) {
    int clusterId = blockIdx.x * blockDim.x + threadIdx.x;
    if (clusterId >= k) return;

    int count = d_counts[clusterId];
    if (count > 0) {
        for (int dim = 0; dim < d; ++dim) {
            d_centroids[clusterId * d + dim] /= static_cast<float>(count);
        }
    }
}

// Host Code & Execution

int main(int argc, char* argv[]) {
    int threadsPerBlock = (argc > 1) ? std::atoi(argv[1]) : 256;
    int blocksPerGrid   = (argc > 2) ? std::atoi(argv[2])
                                     : (N + threadsPerBlock - 1) / threadsPerBlock;
    int averageBlocks = (K + threadsPerBlock - 1) / threadsPerBlock;

    std::cout << "Configuration: threadsPerBlock=" << threadsPerBlock
              << ", blocksPerGrid=" << blocksPerGrid << "\n";

    size_t gamesSize       = (size_t)N * D * sizeof(float);
    size_t centroidsSize   = (size_t)K * D * sizeof(float);
    size_t assignmentsSize = (size_t)N * sizeof(int);
    size_t countsSize      = (size_t)K * sizeof(int);

    float* h_games        = (float*)malloc(gamesSize);
    float* h_centroids    = (float*)malloc(centroidsSize);
    float* h_old_centroids= (float*)malloc(centroidsSize);
    int*   h_assignments  = (int*)  malloc(assignmentsSize);

    if (!h_games || !h_centroids || !h_old_centroids || !h_assignments) {
        std::cerr << "Host malloc failed.\n";
        return EXIT_FAILURE;
    }

    loadCSVData(h_games, N, D, "mlb_historical_data.csv");
    initializeCentroids(h_games, h_centroids, K, D);

    int deviceCount = 0;
    cudaGetDeviceCount(&deviceCount);
    if (deviceCount == 0) {
        std::cerr << "No CUDA-capable GPU found. Check driver installation.\n";
        exit(EXIT_FAILURE);
    }
    cudaSetDevice(0);
    cudaDeviceProp prop;
    cudaGetDeviceProperties(&prop, 0);
    std::cout << "GPU: " << prop.name
              << " (Compute " << prop.major << "." << prop.minor << ")\n";

    // Check available VRAM
    size_t freeMem = 0, totalMem = 0;
    cudaMemGetInfo(&freeMem, &totalMem);
    size_t needed = gamesSize + centroidsSize + assignmentsSize + countsSize;
    std::cout << "GPU memory: " << freeMem / (1024*1024) << " MB free / "
              << totalMem / (1024*1024) << " MB total\n";
    std::cout << "Memory needed: " << needed / (1024*1024) << " MB\n";
    if (needed > freeMem) {
        std::cerr << "Not enough GPU memory. Reduce N in the source and recompile.\n";
        exit(EXIT_FAILURE);
    }

    float *d_games, *d_centroids;
    int   *d_assignments, *d_counts;
    CHECK_CUDA(cudaMalloc((void**)&d_games,       gamesSize));
    CHECK_CUDA(cudaMalloc((void**)&d_centroids,   centroidsSize));
    CHECK_CUDA(cudaMalloc((void**)&d_assignments, assignmentsSize));
    CHECK_CUDA(cudaMalloc((void**)&d_counts,      countsSize));

    // Time data transfer (H->D) separately
    cudaEvent_t evXferStart, evXferStop;
    CHECK_CUDA(cudaEventCreate(&evXferStart));
    CHECK_CUDA(cudaEventCreate(&evXferStop));
    CHECK_CUDA(cudaEventRecord(evXferStart));

    CHECK_CUDA(cudaMemcpy(d_games,     h_games,     gamesSize,     cudaMemcpyHostToDevice));
    CHECK_CUDA(cudaMemcpy(d_centroids, h_centroids, centroidsSize, cudaMemcpyHostToDevice));

    CHECK_CUDA(cudaEventRecord(evXferStop));
    CHECK_CUDA(cudaEventSynchronize(evXferStop));
    float xferMs = 0;
    CHECK_CUDA(cudaEventElapsedTime(&xferMs, evXferStart, evXferStop));
    std::cout << "H->D transfer time: " << xferMs << " ms\n";

    // Main K-Means loop
    cudaEvent_t evStart, evStop;
    CHECK_CUDA(cudaEventCreate(&evStart));
    CHECK_CUDA(cudaEventCreate(&evStop));

    std::cout << "Launching K-Means...\n";
    CHECK_CUDA(cudaEventRecord(evStart));

    int iter = 0;
    for (iter = 0; iter < MAX_ITERS; ++iter) {
        // Save current centroids to check convergence after update
        CHECK_CUDA(cudaMemcpy(h_old_centroids, d_centroids, centroidsSize, cudaMemcpyDeviceToHost));

        // Step 1: Assign each game to nearest centroid
        assignClustersKernel<<<blocksPerGrid, threadsPerBlock>>>(
            d_games, d_centroids, d_assignments, N, K, D);
        CHECK_CUDA(cudaGetLastError());
        CHECK_CUDA(cudaDeviceSynchronize());

        // Step 2: Accumulate sums (zero buffers first)
        CHECK_CUDA(cudaMemset(d_centroids, 0, centroidsSize));
        CHECK_CUDA(cudaMemset(d_counts,    0, countsSize));

        sumCentroidsKernel<<<blocksPerGrid, threadsPerBlock>>>(
            d_games, d_assignments, d_centroids, d_counts, N, D);
        CHECK_CUDA(cudaGetLastError());
        CHECK_CUDA(cudaDeviceSynchronize());

        // Step 3: Divide sums by counts to get new centroids
        averageCentroidsKernel<<<averageBlocks, threadsPerBlock>>>(
            d_centroids, d_counts, K, D);
        CHECK_CUDA(cudaGetLastError());
        CHECK_CUDA(cudaDeviceSynchronize());

        // Step 4: Check convergence
        CHECK_CUDA(cudaMemcpy(h_centroids, d_centroids, centroidsSize, cudaMemcpyDeviceToHost));

        float maxShift = 0.0f;
        for (int c = 0; c < K; ++c) {
            float shift = 0.0f;
            for (int dim = 0; dim < D; ++dim) {
                float diff = h_centroids[c * D + dim] - h_old_centroids[c * D + dim];
                shift += diff * diff;
            }
            if (shift > maxShift) maxShift = shift;
        }

        if (maxShift < TOLERANCE * TOLERANCE) {
            std::cout << "Converged at iteration " << iter + 1 << "\n";
            break;
        }
    }

    CHECK_CUDA(cudaEventRecord(evStop));
    CHECK_CUDA(cudaEventSynchronize(evStop));

    float computeMs = 0;
    CHECK_CUDA(cudaEventElapsedTime(&computeMs, evStart, evStop));

    // Copy assignments to host
    CHECK_CUDA(cudaMemcpy(h_assignments, d_assignments, assignmentsSize, cudaMemcpyDeviceToHost));

    // Report
    int totalIters = (iter == MAX_ITERS) ? iter : iter + 1;
    std::cout << "Total iterations:     " << totalIters << "\n";
    std::cout << "Compute time:         " << computeMs << " ms\n";
    std::cout << "Total time (w/ xfer): " << computeMs + xferMs << " ms\n";

    // Cluster populations
    int clusterPop[K] = {};
    for (int i = 0; i < N; ++i) clusterPop[h_assignments[i]]++;
    std::cout << "\nCluster populations:\n";
    for (int c = 0; c < K; ++c)
        std::cout << "  Cluster " << c << ": " << clusterPop[c] << " games\n";

    std::cout << "\nFinal centroids (first 5 dims):\n";
    for (int c = 0; c < K; ++c) {
        std::cout << "  Cluster " << c << ": [";
        for (int dim = 0; dim < 5; ++dim) {
            std::cout << h_centroids[c * D + dim];
            if (dim < 4) std::cout << ", ";
        }
        std::cout << ", ...]\n";
    }

    // Cleanup
    CHECK_CUDA(cudaFree(d_games));
    CHECK_CUDA(cudaFree(d_centroids));
    CHECK_CUDA(cudaFree(d_assignments));
    CHECK_CUDA(cudaFree(d_counts));
    CHECK_CUDA(cudaEventDestroy(evStart));
    CHECK_CUDA(cudaEventDestroy(evStop));
    CHECK_CUDA(cudaEventDestroy(evXferStart));
    CHECK_CUDA(cudaEventDestroy(evXferStop));

    free(h_games);
    free(h_centroids);
    free(h_old_centroids);
    free(h_assignments);

    return 0;
}
