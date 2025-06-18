import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

/*
This plugin ignores CSS files in the SSR build which causes an "unknown extension error".
The offending packages are in the `ssr.noExternal` array.
*/
function ssrIgnoreCss(): Plugin {
  return {
    name: "ssr-ignore-css",
    load(id, options) {
      if (options?.ssr && id.endsWith(".css")) {
        return "";
      }
    },
  };
}

export default defineConfig({
  ssr: {
    external: ["react", "react-dom"],
    noExternal: ["@platejs/math", "react-lite-youtube-embed", "react-tweet"],
  },
  plugins: [
    ssrIgnoreCss(),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      // https://react.dev/learn/react-compiler
      react: {
        babel: {
          plugins: [
            [
              "babel-plugin-react-compiler",
              {
                target: "19",
              },
            ],
          ],
        },
      },

      tsr: {
        quoteStyle: "double",
        semicolons: true,
        // verboseFileRoutes: false,
      },

      // https://tanstack.com/start/latest/docs/framework/react/hosting#deployment
      // target: "node-server",
    }),
  ],
});
