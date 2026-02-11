const { pipeline, env } = require('@xenova/transformers');
const path = require('path');

/**
 * ParadoxNote Neural Verification Script
 * This script tests the local Whisper model loading and inference capability.
 */

async function runNeuralTest() {
    console.log("--- Initializing Neural Verification ---");

    // 1. Configure paths to match the project structure
    // In Node.js, we need to point to the absolute path of the models folder
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.localModelPath = path.join(__dirname, 'public', 'models');

    console.log(`Searching for model in: ${env.localModelPath}`);

    try {
        // 2. Test Model Loading
        console.log("Step 1: Loading Whisper Tiny (Local Only)...");
        const startLoad = Date.now();

        const transcriber = await pipeline('automatic-speech-recognition', 'whisper-tiny-en', {
            quantized: true,
            local_files_only: true,
        });

        console.log(`✅ Model Loaded Successfully in ${((Date.now() - startLoad) / 1000).toFixed(2)}s`);

        // 3. Test Inference with dummy audio
        // Whisper expects a Float32Array of audio samples (typically 16kHz)
        console.log("\nStep 2: Testing Transcription Engine with dummy signal...");

        // Create 1 second of silence (16000 samples at 16kHz)
        const dummyAudio = new Float32Array(16000);

        const startInf = Date.now();
        const output = await transcriber(dummyAudio, {
            chunk_length_s: 30,
            stride_length_s: 5,
            language: 'english',
            task: 'transcribe',
            return_timestamps: false
        });

        console.log(`✅ Transcription Complete in ${((Date.now() - startInf) / 1000).toFixed(2)}s`);
        console.log(`Result: "${output.text}"`);

        console.log("\n🏁 NEURAL ENGINE VERIFIED: Offline AI is operational.");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ NEURAL VERIFICATION FAILED!");
        console.error(err);
        process.exit(1);
    }
}

runNeuralTest();
