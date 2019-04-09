import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import resolve from 'rollup-plugin-node-resolve';

export default {
    input: "src/index.js",
    output: {
        file: "dest/bundle.js",
        format: "iife"
    },
    plugins: [
        resolve(),
        serve(),
        livereload()
    ],
    onwarn: function (warning, warn) {
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        warn(warning);
    }
}