import { isNetSuite } from "@/lib/is-netsuite";

// Autosuggest API types
export interface AutosuggestResult {
    sname: string; // Display name
    key: string; // URL path
    descr: string; // Record type description (e.g., "Customer", "Employee")
    bedit?: string; // Whether editable
    dashurl?: string; // Dashboard URL
}

interface AutosuggestResponse {
    autofill: AutosuggestResult[];
    asheep?: string;
    asuuk?: string;
}

// Mock autosuggest data for development
const mockAutosuggestResults: AutosuggestResult[] = [
    { sname: "Test Customer", key: "/app/common/entity/custjob.nl?id=1491", descr: "Customer", bedit: "T", dashurl: "/app/center/card.nl?sc=-69&entityid=1491" },
    { sname: "Test Vendor", key: "/app/common/entity/vendor.nl?id=1234", descr: "Vendor", bedit: "T", dashurl: "" },
    { sname: "Test Employee", key: "/app/common/entity/entity.nl?id=1511", descr: "Employee", bedit: "T", dashurl: "" },
    { sname: "Test Transaction", key: "/app/accounting/transactions/salesord.nl?id=5678", descr: "Sales Order", bedit: "T", dashurl: "" },
    { sname: "Test Project", key: "/app/common/custom/custrecordentry.nl?rectype=889&id=1", descr: "Project Tracker", bedit: "T", dashurl: "" },
];

export const fetchAutosuggest = async (
    searchText: string
): Promise<{ error: string | null; data: AutosuggestResult[] | null }> => {
    if (!searchText || searchText.length < 2) {
        return { error: null, data: [] };
    }

    try {
        if (!isNetSuite()) {
            // Return filtered mock data for development
            await new Promise((resolve) => setTimeout(resolve, 200));
            const filtered = mockAutosuggestResults.filter((item) =>
                item.sname.toLowerCase().includes(searchText.toLowerCase())
            );
            return { error: null, data: filtered };
        }

        const encodedSearch = encodeURIComponent(searchText);
        // circid appears to be a simple circuit/request identifier, not a timestamp
        const response = await fetch(
            `/app/common/autosuggest.nl?cur_val=${encodedSearch}&mapkey=uberautosuggest&circid=1`,
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
            throw new Error(`Failed to fetch autosuggest: ${response.status}`);
        }

        const data: AutosuggestResponse = await response.json();

        return { error: null, data: data.autofill || [] };
    } catch (error: any) {
        return { error: error.message, data: null };
    }
};

// Build the URL for "See all results" in NetSuite's native search
export const buildUberSearchUrl = (searchText: string): string => {
    const encodedSearch = encodeURIComponent(searchText);
    return `/app/common/search/ubersearchresults.nl?quicksearch=T&searchtype=Uber&frame=be&Uber_NAMEtype=KEYWORDSTARTSWITH&Uber_NAME=${encodedSearch}`;
};
