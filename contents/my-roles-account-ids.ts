import type { PlasmoCSConfig } from "plasmo";

import { Storage } from "@plasmohq/storage";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/app/login/secure/myroles/myroles.nl*"],
};

const storage = new Storage();

interface AccountData {
    accountId: string;
    accountName: string;
    accountType: string;
    changeAccountUrl: string;
}

interface PageData {
    data?: {
        allAccounts?: AccountData[];
    };
    app?: {
        data?: {
            data?: {
                allAccounts?: AccountData[];
            };
        };
    };
}

// Find and parse the JSON data embedded in the page
const getAccountsData = (): Map<string, string> => {
    const accountMap = new Map<string, string>();

    // Find all JSON script tags
    const jsonScripts = document.querySelectorAll('script[type="application/json"]');

    for (const script of Array.from(jsonScripts)) {
        try {
            const data: PageData = JSON.parse(script.textContent || "");

            // Check both possible data structures
            const allAccounts = data?.data?.allAccounts || data?.app?.data?.data?.allAccounts;

            if (allAccounts && Array.isArray(allAccounts)) {
                for (const account of allAccounts) {
                    if (account.accountId && account.accountName) {
                        accountMap.set(account.accountName, account.accountId);
                    }
                }
                console.log("[My Roles Account IDs] Found accounts data:", accountMap.size);
                break;
            }
        } catch {
            // Not valid JSON or doesn't have our data, continue
        }
    }

    return accountMap;
};

const injectSearchBox = (accountsMap: Map<string, string>) => {
    // Check if search box already exists
    if (document.querySelector("#netsuite-utilities-myroles-search")) {
        console.log("[My Roles Search] Search box already exists, skipping");
        return;
    }

    // Find the page heading "My Roles"
    const pageHeading = document.querySelector('[data-widget="Heading"][data-kind="page"]');
    if (!pageHeading) {
        console.log("[My Roles Search] Page heading not found");
        return;
    }

    // Create search container
    const searchContainer = document.createElement("div");
    searchContainer.className = "netsuite-utilities-myroles-search-container";
    searchContainer.style.padding = "16px 0";
    searchContainer.style.maxWidth = "400px";

    // Create search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "netsuite-utilities-myroles-search";
    searchInput.placeholder = "Search accounts...";
    searchInput.style.width = "100%";
    searchInput.style.height = "36px";
    searchInput.style.padding = "0 12px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.borderRadius = "4px";
    searchInput.style.fontSize = "14px";
    searchInput.style.boxSizing = "border-box";

    searchContainer.appendChild(searchInput);

    // Insert after the page heading
    pageHeading.parentElement?.insertBefore(searchContainer, pageHeading.nextSibling);

    // Store original positions for reset
    const originalPositions = new Map<Element, string>();

    // Add search functionality
    searchInput.addEventListener("input", (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        console.log("[My Roles Search] Searching for:", searchTerm);

        // Find the accounts grid - it's the one under "Or switch to another account" heading
        // Look for the heading and then find the DataGrid that follows it
        const headings = document.querySelectorAll('[data-widget="Heading"]');
        let accountsGrid: Element | null = null;

        for (const heading of Array.from(headings)) {
            const headingText = heading.textContent?.toLowerCase() || "";
            if (headingText.includes("switch to another account")) {
                // Find the next DataGrid sibling or in the parent's children
                let sibling = heading.nextElementSibling;
                while (sibling) {
                    const grid = sibling.matches('[data-widget="DataGrid"]')
                        ? sibling
                        : sibling.querySelector('[data-widget="DataGrid"]');
                    if (grid) {
                        accountsGrid = grid;
                        break;
                    }
                    sibling = sibling.nextElementSibling;
                }
                break;
            }
        }

        if (!accountsGrid) {
            console.log("[My Roles Search] Accounts grid not found");
            return;
        }

        // Get all data rows within this grid's body segment
        const bodySegment = accountsGrid.querySelector(
            '[data-widget="GridSegment"][data-row-section="body"][data-column-section="body"]'
        );
        if (!bodySegment) return;

        const rows = Array.from(
            bodySegment.querySelectorAll('[data-widget="GridRowSegment"][data-row-type="data"]')
        );

        let visibleIndex = 0;
        const rowHeight = 42; // Standard row height from the HTML

        rows.forEach((row) => {
            const htmlRow = row as HTMLElement;

            // Store original position if not already stored
            if (!originalPositions.has(row)) {
                originalPositions.set(row, htmlRow.style.top);
            }

            // Get text content from the row
            const textElements = row.querySelectorAll('[data-widget="Text"], label');
            let rowText = "";

            textElements.forEach((el) => {
                rowText += " " + (el.textContent || "");
            });

            // Also check aria-labels on buttons
            const buttons = row.querySelectorAll("button[aria-label]");
            buttons.forEach((btn) => {
                const ariaLabel = btn.getAttribute("aria-label");
                if (ariaLabel) {
                    rowText += " " + ariaLabel;
                    const accountId = accountsMap.get(ariaLabel);
                    if (accountId) {
                        rowText += " " + accountId;
                    }
                }
            });

            rowText = rowText.toLowerCase();
            const matches = searchTerm === "" || rowText.includes(searchTerm);

            if (matches) {
                htmlRow.style.display = "";
                // Reposition visible rows to stack without gaps
                if (searchTerm !== "") {
                    htmlRow.style.top = `${visibleIndex * rowHeight}px`;
                } else {
                    // Reset to original position
                    htmlRow.style.top = originalPositions.get(row) || htmlRow.style.top;
                }
                visibleIndex++;
            } else {
                htmlRow.style.display = "none";
            }
        });

        // Adjust the grid segment container height
        const segmentContainer = bodySegment.querySelector("div") as HTMLElement;
        if (segmentContainer && searchTerm !== "") {
            segmentContainer.style.height = `${visibleIndex * rowHeight}px`;
        }

        console.log("[My Roles Search] Search complete for:", searchTerm);
    });

    // Focus the search input after injection
    setTimeout(() => {
        searchInput.focus();
    }, 100);

    console.log("[My Roles Search] Search box injected successfully");
};

const addAccountIdsToMyRolesPage = async () => {
    try {
        const isShowAccountIdsEnabled = await storage.get("feature_show_account_ids");
        console.log("[My Roles Account IDs] Feature enabled:", isShowAccountIdsEnabled);

        if (!isShowAccountIdsEnabled) {
            console.log("[My Roles Account IDs] Feature is disabled, exiting");
            return;
        }

        console.log("[My Roles Account IDs] Initializing...");

        const processGridRows = () => {
            // Get account data from embedded JSON
            const accountsMap = getAccountsData();

            if (accountsMap.size === 0) {
                console.log("[My Roles Account IDs] No accounts data found");
                return;
            }

            // Inject search box
            injectSearchBox(accountsMap);

            // Find all buttons with account names in the "switch to another account" section
            const buttons = document.querySelectorAll(
                'button[data-widget="Button"][data-type="link"]'
            );

            buttons.forEach((button) => {
                // Check if we already added the account ID
                if (button.querySelector(".netsuite-utilities-account-id")) return;

                // Get the account name from the button's aria-label or label text
                const ariaLabel = button.getAttribute("aria-label");
                const label = button.querySelector("label");
                const accountName = ariaLabel || label?.textContent;

                if (!accountName) return;

                // Look up account ID by name
                const accountId = accountsMap.get(accountName);

                if (!accountId) return;

                // Skip if the account name already contains the ID in brackets
                if (accountName.includes(`[${accountId}]`)) return;

                if (label) {
                    const accountIdSpan = document.createElement("span");
                    accountIdSpan.className = "netsuite-utilities-account-id";
                    accountIdSpan.textContent = ` [${accountId}]`;
                    accountIdSpan.style.fontSize = "12px";
                    accountIdSpan.style.fontWeight = "normal";
                    accountIdSpan.style.color = "#888";
                    accountIdSpan.style.marginLeft = "4px";
                    accountIdSpan.style.userSelect = "text";

                    label.appendChild(accountIdSpan);
                    console.log("[My Roles Account IDs] Added account ID:", accountId);
                }
            });
        };

        // Process initially and set up observer for dynamic content
        const runWithRetry = (attempts = 5, delay = 500) => {
            processGridRows();
            if (attempts > 0) {
                setTimeout(() => runWithRetry(attempts - 1, delay), delay);
            }
        };

        // Initial run with retries
        runWithRetry();

        // Also observe for dynamic changes
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldProcess = true;
                    break;
                }
            }
            if (shouldProcess) {
                processGridRows();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        console.log("[My Roles Account IDs] MutationObserver started");
    } catch (e) {
        console.error("[My Roles Account IDs] Error:", e);
    }
};

void addAccountIdsToMyRolesPage();
