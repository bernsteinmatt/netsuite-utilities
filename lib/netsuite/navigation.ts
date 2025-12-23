import { isNetSuite } from "@/lib/is-netsuite";

export interface NavMenuItem {
    type: "TAB" | "OVERVIEW" | "CATEGORY" | "TASK" | "TASK_MODE";
    id?: string;
    label: string;
    url?: string;
    submenu: NavMenuItem[];
}

export interface FlatNavMenuItem {
    id: string;
    label: string;
    url: string;
    breadcrumb: string;
}

const flattenNavMenu = (
    items: NavMenuItem[],
    breadcrumb: string[] = []
): FlatNavMenuItem[] => {
    const result: FlatNavMenuItem[] = [];

    for (const item of items) {
        const currentBreadcrumb = [...breadcrumb, item.label];

        // Only include items with URLs (these are navigable)
        if (item.url && item.id) {
            result.push({
                id: item.id,
                label: item.label,
                url: item.url,
                breadcrumb: currentBreadcrumb.join(" > "),
            });
        }

        // Recursively process submenus
        if (item.submenu?.length) {
            result.push(...flattenNavMenu(item.submenu, currentBreadcrumb));
        }
    }

    return result;
};

// Mock nav menu data for development
const mockNavMenuData: NavMenuItem[] = [
    {
        type: "TAB",
        id: "-62",
        label: "Activities",
        url: "/app/center/card.nl?sc=-62",
        submenu: [
            {
                type: "TASK",
                id: "LIST_EVENT",
                label: "Events",
                url: "/app/crm/calendar/eventlist.nl",
                submenu: [],
            },
            {
                type: "TASK",
                id: "LIST_TASK",
                label: "Tasks",
                url: "/app/crm/calendar/tasklist.nl",
                submenu: [],
            },
        ],
    },
    {
        type: "TAB",
        id: "111",
        label: "Setup",
        url: "/app/center/card.nl?sc=111",
        submenu: [
            {
                type: "TASK",
                id: "LIST_EMPLOYEE",
                label: "Employees",
                url: "/app/common/entity/employeelist.nl",
                submenu: [],
            },
        ],
    },
];

export const fetchNavMenuData = async (): Promise<{
    error: string | null;
    data: FlatNavMenuItem[] | null;
}> => {
    try {
        if (!isNetSuite()) {
            // Return mock data for development
            await new Promise((resolve) => setTimeout(resolve, 300));
            const flatData = flattenNavMenu(mockNavMenuData);
            return { error: null, data: flatData };
        }

        const timestamp = Date.now();
        const response = await fetch(
            `/app/center/NLNavMenuData.nl?_=${timestamp}`,
            {
                headers: {
                    accept: "application/json; q=1.0, text/*; q=0.8, */*; q=0.1",
                    "cache-control": "no-cache",
                    pragma: "no-cache",
                    "x-requested-with": "XMLHttpRequest",
                },
                method: "GET",
                mode: "cors",
                credentials: "include",
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch nav menu: ${response.status}`);
        }

        const data: NavMenuItem[] = await response.json();
        const flatData = flattenNavMenu(data);

        // Deduplicate by URL (same page can appear in multiple menu locations)
        const seen = new Set<string>();
        const uniqueData = flatData.filter((item) => {
            if (seen.has(item.url)) return false;
            seen.add(item.url);
            return true;
        });

        return { error: null, data: uniqueData };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};
