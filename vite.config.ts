import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, Plugin } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

const problematicPackages = [
  "@platejs/math",
  "react-lite-youtube-embed",
  "react-tweet",
  "katex" // KaTeX CSS is often problematic too
];

/*
This plugin ignores CSS files from specific packages in the SSR build which causes an "unknown extension error".
The offending packages are: @platejs/math, react-lite-youtube-embed, react-tweet
*/
function ssrIgnoreCss(): Plugin {
  return {
    name: "ssr-ignore-css",
    load(id, options) {
      if (options?.ssr && id.endsWith(".css")) {
        // Only ignore CSS from problematic packages, allow Tailwind and other CSS through


        if (problematicPackages.some(pkg => id.includes(pkg))) {
          return "";
        }
      }
    },
  };
}

export default defineConfig({
  ssr: {
    external: ["react", "react-dom"],
    noExternal: problematicPackages,
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
      target: process.env.TANSTACK_TARGET
    }),
  ],
});
