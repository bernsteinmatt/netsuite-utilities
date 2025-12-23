import type { PlasmoCSConfig } from "plasmo";

import { Storage } from "@plasmohq/storage";

export const config: PlasmoCSConfig = {
    matches: ["*://*.netsuite.com/*"],
};

const storage = new Storage();

const addRoleSearch = async () => {
    try {
        const isRoleSearchEnabled = await storage.get("feature_role_search");
        const isShowAccountIdsEnabled = await storage.get("feature_show_account_ids");

        if (!isRoleSearchEnabled) {
            return;
        }

        // Check if dialog is already open on page load
        const checkExistingDialog = () => {
            const existingDialog = document.querySelector('[role="dialog"][data-widget="Popover"]');
            if (existingDialog) {
                injectSearchBox(existingDialog as HTMLElement, !!isShowAccountIdsEnabled);
            }
        };

        // Check immediately and after a short delay
        checkExistingDialog();
        setTimeout(checkExistingDialog, 500);
        setTimeout(checkExistingDialog, 1000);

        // Use MutationObserver to detect when the role menu is opened
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of Array.from(mutation.addedNodes)) {
                    if (node instanceof HTMLElement) {
                        // Check if this is the role menu dialog
                        const dialog = node.querySelector('[role="dialog"][data-widget="Popover"]');
                        if (dialog) {
                            injectSearchBox(dialog as HTMLElement, !!isShowAccountIdsEnabled);
                        }
                        // Also check if the node itself is the dialog
                        if (
                            node.getAttribute("role") === "dialog" &&
                            node.getAttribute("data-widget") === "Popover"
                        ) {
                            injectSearchBox(node, !!isShowAccountIdsEnabled);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    } catch (e) {
        console.error("[Role Search] Error initializing:", e);
    }
};

const injectSearchBox = (dialog: HTMLElement, showAccountIds: boolean = true) => {
    // Check if search box already exists (use our unique ID)
    if (dialog.querySelector("#netsuite-utilities-role-search")) {
        return;
    }

    // Find the menu groups
    const menuGroups = dialog.querySelectorAll('[data-widget="MenuGroup"]');

    if (menuGroups.length === 0) {
        return;
    }

    // Find the roles group and accounts group
    let rolesGroup: Element | null = null;
    let accountsGroup: Element | null = null;

    for (const group of Array.from(menuGroups)) {
        // Look for a group that contains role menu items with change role links
        const hasRoleLinks = group.querySelector('a[href*="changerole.nl"]');
        const hasAccountLinks = group.querySelector('a[href*="changeaccount.nl"]');

        if (hasRoleLinks && !rolesGroup) {
            rolesGroup = group;
        }

        if (hasAccountLinks && !accountsGroup) {
            accountsGroup = group;
        }
    }

    if (!rolesGroup) {
        return;
    }

    // Create search container
    const searchContainer = document.createElement("div");
    searchContainer.className = "netsuite-utilities-role-search-container";
    searchContainer.style.padding = "10px";
    searchContainer.style.borderBottom = "1px solid #e0e0e0";

    // Create search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.id = "netsuite-utilities-role-search";
    searchInput.placeholder = "Search roles and accounts...";
    searchInput.style.width = "100%";
    searchInput.style.height = "32px";
    searchInput.style.padding = "0 10px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.borderRadius = "4px";
    searchInput.style.fontSize = "14px";
    searchInput.style.boxSizing = "border-box";

    searchContainer.appendChild(searchInput);

    // Insert search box at the beginning of the roles group
    rolesGroup.insertBefore(searchContainer, rolesGroup.firstChild);

    // Get all role menu items from BOTH groups
    const roleItems = Array.from(rolesGroup.querySelectorAll('[data-widget="MenuItem"]'));
    const accountItems = accountsGroup
        ? Array.from(accountsGroup.querySelectorAll('[data-widget="MenuItem"]'))
        : [];
    const allItems = [...roleItems, ...accountItems];

    // Add account IDs to account items if enabled
    if (showAccountIds && accountsGroup) {
        accountItems.forEach((item) => {
            const linkElement = item.querySelector("a");
            const contentElement = item.querySelector('[data-widget="MenuItemContent"]');

            if (linkElement && contentElement) {
                // Extract account ID from URL
                const url = linkElement.href;
                const match = url.match(/[?&]company=([^&]+)/);
                const accountId = match ? match[1] : null;

                // Check if account ID already exists (don't add duplicates)
                const existingAccountId = contentElement.querySelector(
                    ".netsuite-utilities-account-id"
                );

                if (accountId && !existingAccountId) {
                    const accountIdSpan = document.createElement("span");
                    accountIdSpan.className = "netsuite-utilities-account-id";
                    accountIdSpan.textContent = accountId;
                    accountIdSpan.style.fontSize = "11px";
                    accountIdSpan.style.fontWeight = "600";
                    accountIdSpan.style.color = "#666";
                    accountIdSpan.style.marginLeft = "8px";
                    accountIdSpan.style.userSelect = "text";

                    contentElement.appendChild(accountIdSpan);
                }
            }
        });
    }

    // Reset all items to be visible initially (in case they were hidden from a previous search)
    allItems.forEach((item) => {
        (item as HTMLElement).style.display = "";
    });

    // Add search functionality
    searchInput.addEventListener("input", (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();

        allItems.forEach((item) => {
            const textElement = item.querySelector('[data-widget="Text"]');
            const linkElement = item.querySelector("a");

            if (!textElement) {
                return;
            }

            const roleName = textElement.textContent?.toLowerCase() || "";
            // Also search in the href for account IDs
            const accountId = linkElement?.href?.toLowerCase() || "";

            const matches = roleName.includes(searchTerm) || accountId.includes(searchTerm);

            if (matches) {
                (item as HTMLElement).style.display = "";
            } else {
                (item as HTMLElement).style.display = "none";
            }
        });
    });

    // Focus the search input after a short delay
    setTimeout(() => {
        searchInput.focus();
    }, 100);
};

void addRoleSearch();
