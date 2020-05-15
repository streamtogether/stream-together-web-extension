const Path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: "production",
    devtool: "inline-source-map",
    entry: {
        background: Path.join(__dirname, "src", "background", "background.ts"),
        session: Path.join(__dirname, "src", "session", "session.ts")
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
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"]
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
