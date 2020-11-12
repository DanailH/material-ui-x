import typescript from 'rollup-plugin-typescript2';
import cleaner from 'rollup-plugin-cleaner';
import sourceMaps from 'rollup-plugin-sourcemaps';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import command from 'rollup-plugin-command';
import pkg from './gridProvider/package.json';

// dev build if watching, prod build if not
const production = !process.env.ROLLUP_WATCH;
export default [
  {
    input: './gridProvider/src/index.ts',
    output: [
      {
        file: './gridProvider/dist/index-esm.js',
        format: 'esm',
        sourcemap: !production,
      },
      {
        file: './gridProvider/dist/index-cjs.js',
        format: 'cjs',
        sourcemap: !production,
      },
    ],
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      production &&
        cleaner({
          targets: ['./gridProvider/dist/'],
        }),
      typescript({ tsconfig: 'tsconfig.build.json' }),
      !production && sourceMaps(),
      production && terser(),
    ],
  },
  {
    input: './gridProvider/dist/gridProvider/src/index.d.ts',
    output: [{ file: './gridProvider/dist/gridProvider.d.ts', format: 'es' }],
    plugins: [
      dts(),
      !production && sourceMaps(),
      production &&
        command(
          [
            `rm -rf ./gridProvider/dist/gridProvider/`,
            `rm -rf ./gridProvider/dist/_modules_ `,
            `rm -rf ./gridProvider/dist/x-grid`,
          ],
          {
            exitOnFail: true,
            wait: true,
          },
        ),
    ],
  },
];
