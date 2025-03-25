// Rollup Native Module Patcher
// This script creates patched versions of Rollup's native.js/native.mjs files
// to avoid the problematic native module loading that causes deployment failures

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 ROLLUP NATIVE MODULE PATCHER 🔧');
console.log(`Working in directory: ${process.cwd()}`);

// Create the rollup/dist directory if it doesn't exist
const rollupDistDir = path.join(process.cwd(), 'node_modules', 'rollup', 'dist');
try {
  fs.mkdirSync(rollupDistDir, { recursive: true });
  console.log(`Created directory: ${rollupDistDir}`);
} catch (err) {
  console.log(`Directory ${rollupDistDir} already exists or couldn't be created`);
}

// Create the CommonJS version (native.js)
const nativeJsContent = `// PATCHED by patch-rollup-native.js - stub implementation that avoids native modules
exports.loadAndInitializeWasm = async function() {
  console.log("Using patched Rollup native.js that skips native modules");
  return { exports: {} };
};

// Make all other functions no-ops
function noop() {}
exports.checkWasmModuleSupportWithInfo = noop;
exports.needsWasmFallback = false;
exports.wasmHelpers = { instantiateWebAssembly: noop };

// Don't try to load the native module - skip this part
function requireWithFriendlyError() {
  console.log("Skipping native module loading in Rollup");
  return null;
}

// Just return null instead of trying to load the native module
const nodeModule = null;`;

// Create the ESM version (native.mjs)
const nativeMjsContent = `// PATCHED by patch-rollup-native.js - stub implementation that avoids native modules
export default class RollupWasm {
  static async initialize() {
    console.log("Using patched Rollup ESM native.mjs that skips native modules");
    return {
      // Stub implementation that won't crash
      instantiate: () => ({ exports: {} }),
      ready: Promise.resolve()
    };
  }
}`;

// Write the files
try {
  const nativeJsPath = path.join(rollupDistDir, 'native.js');
  fs.writeFileSync(nativeJsPath, nativeJsContent);
  console.log(`✅ Created patched native.js at ${nativeJsPath}`);
  
  const nativeMjsPath = path.join(rollupDistDir, 'native.mjs');
  fs.writeFileSync(nativeMjsPath, nativeMjsContent);
  console.log(`✅ Created patched native.mjs at ${nativeMjsPath}`);
  
  console.log('✅ Successfully patched Rollup native modules');
} catch (err) {
  console.error('❌ Error patching Rollup native modules:', err);
}

// Set environment variable to skip native dependencies
process.env.ROLLUP_SKIP_NODEJS_NATIVE = '1';
console.log('Set ROLLUP_SKIP_NODEJS_NATIVE=1 environment variable');

console.log('Rollup native module patching complete!');