import {defineConfig} from 'tsup';

export default defineConfig([
  // Main SDK bundle
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: ['react', '@solana/web3.js', '@solana/spl-token', 'ethers', 'x402'],
  },
  // React package bundle
  {
    entry: ['src/react/index.ts'],
    outDir: 'dist/react',
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    external: ['react', '@solana/web3.js', '@solana/spl-token', 'ethers', 'x402'],
    loader: {
      '.css': 'copy',
    },
    publicDir: 'src/react',
  },
]);

