import { EditorView } from "@codemirror/view";

// Dark grey theme - override oneDark backgrounds with our CSS variables
export const darkGreyTheme = EditorView.theme(
    {
        "&": {
            backgroundColor: "var(--background) !important",
        },
        ".cm-gutters": {
            backgroundColor: "var(--card) !important",
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: "oklch(0.45 0.15 250) !important",
        },
    },
    { dark: true }
);

// Light theme - override light backgrounds with our CSS variables
export const lightTheme = EditorView.theme(
    {
        "&": {
            backgroundColor: "var(--background) !important",
        },
        ".cm-gutters": {
            backgroundColor: "var(--card) !important",
        },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: "oklch(0.70 0.10 250) !important",
        },
    },
    { dark: false }
);
