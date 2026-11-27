// Tes aturan Firestore: harus dijalankan di dalam Emulator (npm run test:rules). Satu berkas satu waktu karena berbagi satu emulator.
export default {test:{include:['tests/rules/**/*.test.js'],environment:'node',testTimeout:30000,hookTimeout:30000,fileParallelism:false}};
