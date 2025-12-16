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
        console.log("[Role Search] Feature enabled:", isRoleSearchEnabled);
        console.log("[Role Search] Show Account IDs enabled:", isShowAccountIdsEnabled);

        if (!isRoleSearchEnabled) {
            console.log("[Role Search] Feature is disabled, exiting");
            return;
        }

        console.log("[Role Search] Initializing...");

        // Check if dialog is already open on page load
        const checkExistingDialog = () => {
            const existingDialog = document.querySelector('[role="dialog"][data-widget="Popover"]');
            if (existingDialog) {
                console.log("[Role Search] Found existing dialog on page load");
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
                            console.log("[Role Search] Dialog detected via MutationObserver");
                            injectSearchBox(dialog as HTMLElement, !!isShowAccountIdsEnabled);
                        }
                        // Also check if the node itself is the dialog
                        if (
                            node.getAttribute("role") === "dialog" &&
                            node.getAttribute("data-widget") === "Popover"
                        ) {
                            console.log("[Role Search] Dialog node detected directly");
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

        console.log("[Role Search] MutationObserver started");
    } catch (e) {
        console.error("[Role Search] Error initializing:", e);
    }
};

const injectSearchBox = (dialog: HTMLElement, showAccountIds: boolean = true) => {
    console.log("[Role Search] Show Account IDs:", showAccountIds);

    // Check if search box already exists (use our unique ID)
    if (dialog.querySelector("#netsuite-utilities-role-search")) {
        console.log("[Role Search] Search box already exists, skipping");
        return;
    }

    // Find the menu groups
    const menuGroups = dialog.querySelectorAll('[data-widget="MenuGroup"]');
    console.log("[Role Search] Found menu groups:", menuGroups.length);

    if (menuGroups.length === 0) {
        console.log("[Role Search] No menu groups found, exiting");
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
            console.log("[Role Search] Found roles group:", group);
            rolesGroup = group;
        }

        if (hasAccountLinks && !accountsGroup) {
            console.log("[Role Search] Found accounts group:", group);
            accountsGroup = group;
        }
    }

    if (!rolesGroup) {
        console.log("[Role Search] No roles group found, exiting");
        return;
    }

    console.log("[Role Search] Injecting search box into roles group");

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

    console.log("[Role Search] Found role items:", roleItems.length);
    console.log("[Role Search] Found account items:", accountItems.length);
    console.log("[Role Search] Total items to filter:", allItems.length);

    // Add account IDs to account items if enabled
    if (showAccountIds && accountsGroup) {
        console.log("[Role Search] Adding account IDs to account items");
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

    // Log the first few role names for debugging
    allItems.slice(0, 3).forEach((item, idx) => {
        const textElement = item.querySelector('[data-widget="Text"]');
        console.log(`[Role Search] Item ${idx}:`, textElement?.textContent);
    });

    // Reset all items to be visible initially (in case they were hidden from a previous search)
    allItems.forEach((item) => {
        (item as HTMLElement).style.display = "";
    });
    console.log("[Role Search] Reset all items to visible");

    // Add search functionality
    searchInput.addEventListener("input", (e) => {
        const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
        console.log("[Role Search] Searching for:", searchTerm);

        let visibleCount = 0;
        let hiddenCount = 0;

        allItems.forEach((item) => {
            const textElement = item.querySelector('[data-widget="Text"]');
            const linkElement = item.querySelector("a");

            if (!textElement) {
                console.log("[Role Search] Item has no text element, skipping");
                return;
            }

            const roleName = textElement.textContent?.toLowerCase() || "";
            // Also search in the href for account IDs
            const accountId = linkElement?.href?.toLowerCase() || "";

            const matches = roleName.includes(searchTerm) || accountId.includes(searchTerm);

            if (matches) {
                (item as HTMLElement).style.display = "";
                visibleCount++;
            } else {
                (item as HTMLElement).style.display = "none";
                hiddenCount++;
            }
        });

        console.log(
            `[Role Search] After filter - Visible: ${visibleCount}, Hidden: ${hiddenCount}`
        );
    });

    // Focus the search input after a short delay
    setTimeout(() => {
        searchInput.focus();
    }, 100);

    console.log("[Role Search] Search box successfully injected!");
};

void addRoleSearch();
