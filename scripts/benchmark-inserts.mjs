async function runBenchmark() {
  const numRecords = 10;
  console.log(`Benchmarking with ${numRecords} records...`);

  // Simulated Individual inserts
  const startIndiv = performance.now();
  for (let i = 0; i < numRecords; i++) {
    // Simulated DB call
    await new Promise(resolve => setTimeout(resolve, 1));
  }
  const endIndiv = performance.now();
  console.log(`Simulated Individual Insert: ${(endIndiv - startIndiv).toFixed(4)}ms`);

  // Simulated Batch insert
  const startBatch = performance.now();
  // Simulated single DB call for batch
  await new Promise(resolve => setTimeout(resolve, 1));
  const endBatch = performance.now();
  console.log(`Simulated Batch Insert: ${(endBatch - startBatch).toFixed(4)}ms`);
}

runBenchmark().catch(console.error);
