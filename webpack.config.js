import webpack from "webpack";
import path from "path";

export default {
    resolve: {
        alias: {
            artifacts: path.resolve(process.cwd(), "artifacts/")
        },
        extensions: ['.ts', '.js'],
        fallback: {
            "buffer": "buffer",
            "assert": "assert/",
            "stream": "stream-browserify",
            "crypto": "crypto-browserify",
            "process": "process/browser"
        }
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.DefinePlugin({
            "process.env.REACT_APP_SALT_KEY": JSON.stringify(process.env.REACT_APP_SALT_KEY)
        }),
    ],
};
