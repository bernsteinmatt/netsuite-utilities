// NetSuite Schema Fetcher
// Fetches record types and their fields from the Records Catalog API

const REQUEST_BASE = "/app/recordscatalog/rcendpoint.nl";

interface RecordType {
    id: string;
    label?: string;
}

interface RecordTypeResponse {
    data: RecordType[];
}

interface Field {
    id: string;
    label?: string;
    dataType?: string;
    isColumn?: boolean;
    removed?: boolean;
}

interface RecordDetail {
    data: {
        id: string;
        label: string;
        dataType?: string;
        fields?: Field[];
        subrecords?: { id: string; recordClass: string }[];
    };
}

export type Schema = Record<string, string[]>;

const fetchJson = async <T>(url: string): Promise<T> => {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
};

const getRecordTypes = async (): Promise<RecordType[]> => {
    const data = JSON.stringify({ structureType: "FLAT" });
    const url = `${REQUEST_BASE}?action=getRecordTypes&data=${encodeURIComponent(data)}`;
    const response = await fetchJson<RecordTypeResponse>(url);
    return response.data;
};

const getRecordDetail = async (scriptId: string): Promise<RecordDetail> => {
    const data = JSON.stringify({ scriptId, detailType: "SS_ANAL" });
    const url = `${REQUEST_BASE}?action=getRecordTypeDetail&data=${encodeURIComponent(data)}`;
    return fetchJson<RecordDetail>(url);
};

// Process a batch of record types concurrently
const processBatch = async (
    recordTypes: RecordType[],
    schema: Schema,
    processedTables: Set<string>
): Promise<{ id: string; recordClass: string }[]> => {
    const subrecordsToFetch: { id: string; recordClass: string }[] = [];

    const results = await Promise.allSettled(
        recordTypes
            .filter((rt) => !processedTables.has(rt.id))
            .map(async (recordType) => {
                const detail = await getRecordDetail(recordType.id);
                return { recordType, detail };
            })
    );

    for (const result of results) {
        if (result.status === "rejected") {
            console.warn("[Schema] Failed to fetch record:", result.reason);
            continue;
        }

        const { recordType, detail } = result.value;
        processedTables.add(recordType.id);

        // Extract column names from fields
        const columns =
            detail.data.fields?.filter((f) => f.removed !== true).map((f) => f.id) ?? [];

        if (columns.length > 0) {
            schema[recordType.id] = columns;
        }

        // Collect subrecords to fetch
        if (detail.data.subrecords?.length) {
            for (const sub of detail.data.subrecords) {
                if (sub.recordClass === "SUBRECORD" && !processedTables.has(sub.id)) {
                    subrecordsToFetch.push(sub);
                }
            }
        }
    }

    return subrecordsToFetch;
};

// Concurrency settings
const BATCH_SIZE = 250;

export const fetchNetSuiteSchema = async (
    onProgress?: (current: number, total: number) => void
): Promise<Schema> => {
    const schema: Schema = {};
    const processedTables = new Set<string>();

    // Step 1: Get all record types
    console.log("[Schema] Fetching record types...");
    const recordTypes = await getRecordTypes();
    console.log(`[Schema] Found ${recordTypes.length} record types`);

    const total = recordTypes.length;
    let completed = 0;

    // Step 2: Fetch details in batches
    const allSubrecords: { id: string; recordClass: string }[] = [];

    for (let i = 0; i < recordTypes.length; i += BATCH_SIZE) {
        const batch = recordTypes.slice(i, i + BATCH_SIZE);
        const subrecords = await processBatch(batch, schema, processedTables);
        allSubrecords.push(...subrecords);

        completed += batch.length;
        onProgress?.(completed, total);
    }

    // Step 3: Fetch subrecords in batches
    if (allSubrecords.length > 0) {
        console.log(`[Schema] Fetching ${allSubrecords.length} subrecords...`);

        const uniqueSubrecords = allSubrecords.filter(
            (sub, idx, arr) =>
                !processedTables.has(sub.id) && arr.findIndex((s) => s.id === sub.id) === idx
        );

        for (let i = 0; i < uniqueSubrecords.length; i += BATCH_SIZE) {
            const batch = uniqueSubrecords.slice(i, i + BATCH_SIZE);

            const results = await Promise.allSettled(
                batch.map(async (sub) => {
                    const detail = await getRecordDetail(sub.id);
                    return { sub, detail };
                })
            );

            for (const result of results) {
                if (result.status === "rejected") {
                    console.warn("[Schema] Failed to fetch subrecord:", result.reason);
                    continue;
                }

                const { sub, detail } = result.value;
                processedTables.add(sub.id);

                const columns =
                    detail.data.fields?.filter((f) => f.removed !== true).map((f) => f.id) ?? [];

                if (columns.length > 0) {
                    schema[sub.id] = columns;
                }
            }
        }
    }

    console.log(`[Schema] Completed. Fetched ${Object.keys(schema).length} tables`);
    return schema;
};

// Storage key for cached schema
const SCHEMA_STORAGE_KEY = "suiteql-schema";

export const saveSchema = (schema: Schema): void => {
    localStorage.setItem(SCHEMA_STORAGE_KEY, JSON.stringify(schema));
    console.log("[Schema] Saved to localStorage");
};

export const loadSchema = (): Schema | null => {
    const stored = localStorage.getItem(SCHEMA_STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
};

export const clearSchema = (): void => {
    localStorage.removeItem(SCHEMA_STORAGE_KEY);
    console.log("[Schema] Cleared from localStorage");
};
