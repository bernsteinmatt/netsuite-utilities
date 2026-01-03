import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "NetSuite Utilities",
  tagline: "Supercharge your NetSuite workflow",
  favicon: "img/favicon.ico",

  url: "https://bernsteinmatt.github.io",
  baseUrl: "/netsuite-utilities/",

  organizationName: "bernsteinmatt",
  projectName: "netsuite-utilities",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/bernsteinmatt/netsuite-utilities/tree/main/website/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: [
    [
      "@easyops-cn/docusaurus-search-local",
      {
        hashed: true,
        docsRouteBasePath: "/docs",
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  themeConfig: {
    image: "img/social-card.jpg",

    navbar: {
      title: "NetSuite Utilities",
      logo: {
        alt: "NetSuite Utilities Logo",
        src: "img/logo.png",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Documentation",
        },
        {
          href: "https://github.com/bernsteinmatt/netsuite-utilities",
          position: "right",
          className: "header-github-link",
          "aria-label": "GitHub repository",
        },
      ],
    },

    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            { label: "Getting Started", to: "/docs/getting-started/installation" },
            { label: "Features", to: "/docs/features/command-search" },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "GitHub Issues",
              href: "https://github.com/bernsteinmatt/netsuite-utilities/issues",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Chrome Web Store",
              href: "https://chromewebstore.google.com/detail/netsuite-utilities/bcpikialpbpnlcglbniknbedfkcglppa",
            },
            {
              label: "GitHub",
              href: "https://github.com/bernsteinmatt/netsuite-utilities",
            },
            {
              label: "Changelog",
              to: "/docs/changelog",
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} Matthew Bernstein. Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["typescript", "json", "bash"],
    },

    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
