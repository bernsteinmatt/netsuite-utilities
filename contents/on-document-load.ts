import type { PlasmoCSConfig } from "plasmo";

import { Storage } from "@plasmohq/storage";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
};

const storage = new Storage();

const addSearchKeyboardShortcut = async () => {
    try {
        const isSearchShortcut = await storage.get("feature_netsuite_shortcut");

        if (isSearchShortcut) {
            const maxTryCount = 10;
            let currentTryCount = 0;
            let isFoundSearchContainer = false;

            const addShortcutIconToSearch = () => {
                if (isFoundSearchContainer) {
                    currentTryCount = maxTryCount + 1;
                    return;
                }
                setTimeout(() => {
                    const searchContainer = document.querySelector<HTMLDivElement>(
                        '[data-automation-id="GlobalSearchTextBox"]'
                    );

                    if (searchContainer) {
                        isFoundSearchContainer = true;
                    } else if (currentTryCount < maxTryCount) {
                        addShortcutIconToSearch();
                    }
                    currentTryCount += 1;

                    if (
                        searchContainer &&
                        !searchContainer.querySelector(".netsuite-shortcut-icon")
                    ) {
                        const wrapper = document.createElement("span");
                        wrapper.className = "netsuite-shortcut-icon";
                        wrapper.style.display = "inline-flex";
                        wrapper.style.alignItems = "center";
                        wrapper.style.marginLeft = "4px";
                        wrapper.style.cursor = "pointer";
                        const isMac = navigator.platform.toUpperCase().includes("MAC");
                        wrapper.innerHTML = isMac
                            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-command-icon lucide-command"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>`
                            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`;
                        const label = document.createElement("span");
                        label.textContent = "K";
                        label.style.margin = "0 4px 0 2px";
                        label.style.fontSize = "16px";
                        wrapper.appendChild(label);
                        searchContainer.appendChild(wrapper);
                    }
                }, 1500);
            };

            addShortcutIconToSearch();
            // Delay icon injection to let NetSuite render the search box

            // Always listen for the shortcut to focus the input immediately
            document.addEventListener("keydown", (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                    e.preventDefault();
                    const input = document.querySelector<HTMLInputElement>(
                        'input[placeholder="Search"]'
                    );
                    input?.focus();
                }
            });
        }
    } catch (e) {
        console.error(e);
    }
};

const onDocumentLoad = async () => {
    addSearchKeyboardShortcut();
};

void onDocumentLoad();
