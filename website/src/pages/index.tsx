import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className="hero hero--primary py-16 text-center relative overflow-hidden">
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className="flex items-center justify-center mt-8 gap-4">
          <Link
            className="button button--secondary button--lg"
            to="/docs/getting-started/installation"
          >
            Get Started
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs"
          >
            Documentation
          </Link>
        </div>
      </div>
    </header>
  );
}

type FeatureItem = {
  title: string;
  description: string;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "SuiteQL Editor",
    description:
      "Full-featured SQL editor with syntax highlighting, autocomplete, and multi-tab support. Run queries and export results as table, JSON, or CSV.",
    link: "/docs/features/suiteql-editor",
  },
  {
    title: "Command Search",
    description:
      "Powerful command palette for quickly navigating NetSuite. Search customers, vendors, transactions, and more with smart prefixes.",
    link: "/docs/features/command-search",
  },
  {
    title: "Script Log Viewer",
    description:
      "Browse and filter SuiteScript logs with advanced filtering by type, script ID, date range, and text search. Virtual scrolling for large datasets.",
    link: "/docs/features/script-log-viewer",
  },
  {
    title: "Record Detail",
    description:
      "View any NetSuite record as structured JSON. Collapsible tree view, search, and dual data sources (XML and SuiteQL modes).",
    link: "/docs/features/record-detail",
  },
  {
    title: "Side Panel Mode",
    description:
      "Keep tools visible while browsing NetSuite in Chrome's side panel. Perfect for debugging scripts and writing queries.",
    link: "/docs/features/side-panel",
  },
  {
    title: "UI Enhancements",
    description:
      "Dark/light themes, role search, account ID display, and interface tweaks to improve your NetSuite experience.",
    link: "/docs/features/ui-enhancements",
  },
];

function Feature({ title, description, link }: FeatureItem) {
  return (
    <div className="col col--4">
      <div className="p-6 rounded-lg bg-[var(--ifm-card-background-color)] shadow-sm h-full">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <Link to={link}>Learn more →</Link>
      </div>
    </div>
  );
}

function HomepageFeatures() {
  return (
    <section className="flex items-stretch py-12">
      <div className="container">
        <div className="row gap-y-8">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HomepageShortcuts() {
  return (
    <section className="py-12 bg-[var(--ifm-color-emphasis-100)]">
      <div className="container">
        <Heading as="h2" className="text-center mb-8">
          Keyboard Shortcuts
        </Heading>
        <div className="max-w-xl mx-auto flex justify-center">
          <table>
            <thead>
              <tr>
                <th className="py-3 px-4 text-center">Shortcut</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="odd:bg-[var(--ifm-color-emphasis-100)]">
                <td className="py-3 px-4 text-center">
                  <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>
                </td>
                <td className="py-3 px-4 text-center">Command Search</td>
              </tr>
              <tr className="odd:bg-[var(--ifm-color-emphasis-100)]">
                <td className="py-3 px-4 text-center">
                  <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>U</kbd>
                </td>
                <td className="py-3 px-4 text-center">SuiteQL Editor</td>
              </tr>
              <tr className="odd:bg-[var(--ifm-color-emphasis-100)]">
                <td className="py-3 px-4 text-center">
                  <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>
                </td>
                <td className="py-3 px-4 text-center">Script Log Viewer</td>
              </tr>
              <tr className="odd:bg-[var(--ifm-color-emphasis-100)]">
                <td className="py-3 px-4 text-center">
                  <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>
                </td>
                <td className="py-3 px-4 text-center">Record Detail</td>
              </tr>
              <tr className="odd:bg-[var(--ifm-color-emphasis-100)]">
                <td className="py-3 px-4 text-center">
                  <kbd>Ctrl/Cmd</kbd> + <kbd>Shift</kbd> + <kbd>M</kbd>
                </td>
                <td className="py-3 px-4 text-center">Module Loader</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Browser Extension for NetSuite`}
      description="A browser extension that supercharges your NetSuite workflow. Run SuiteQL queries, browse script logs, search records, and more."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <HomepageShortcuts />
      </main>
    </Layout>
  );
}
