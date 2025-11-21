import {defineConfig} from 'tsup';

export default defineConfig([
    // Main SDK bundle
    {
        entry: ['src/index.ts'],
        format: ['cjs', 'esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        external: ['react', '@solana/web3.js', '@solana/spl-token', 'ethers', 'x402', 'viem', 'zod', 'antd', '@ant-design/icons'],
    },
    // React package bundle
    {
        entry: ['src/react/index.ts'],
        outDir: 'dist/react',
        format: ['cjs', 'esm'],
        dts: true,
        sourcemap: true,
        external: ['react', '@solana/web3.js', '@solana/spl-token', 'ethers', 'x402', 'viem', 'zod', 'antd', '@ant-design/icons'],
        // 保持 CSS 作为外部依赖，由打包工具处理
        esbuildOptions(options) {
            options.external = [...(options.external || []), '*.css'];
        },
    },
]);

