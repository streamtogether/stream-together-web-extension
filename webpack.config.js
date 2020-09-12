const Path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "production",
    devtool: "inline-source-map",
    entry: {
        background: Path.join(__dirname, "src", "background", "background.ts"),
        session: Path.join(__dirname, "src", "session", "session.ts"),
        popup: Path.join(__dirname, "src", "popup", "popup.ts"),
    },
    output: {
        path: Path.join(__dirname, "dist", "js"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            },
            {
                test: /\.svelte$/,
                loader: "svelte-loader",
                options: {
                    emitCss: true,
                    hotReload: true,
                    preprocess: require("svelte-preprocess")({})
                }
            },
            {
                test: /\.css/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".svelte", ".mjs", ".js"]
    },
    plugins: [
        new CopyPlugin(
            [
                {
                    from: ".",
                    to: ".."
                }
            ],
            {
                context: "public"
            }
        )
    ]
};
