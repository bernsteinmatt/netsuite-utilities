import { isNetSuite } from "@/lib/is-netsuite";

export const resolveRecordUrl = async (options: {
    recordType: string;
    recordId: number | string;
    isEditMode?: boolean;
}): Promise<{ error: string | null; url: string | null }> => {
    const { recordType, recordId, isEditMode = false } = options;

    if (!isNetSuite()) {
        // Mock response for development
        const mockUrl = `/app/common/entity/${recordType}.nl?id=${recordId}`;
        return { error: null, url: mockUrl };
    }

    try {
        const params = JSON.stringify(["RECORD", recordType, recordId, isEditMode ? "EDIT" : null]);

        const body = new URLSearchParams({
            jrid: "1",
            jrmethod: "remoteObject.nlapiResolveURL",
            jrparams: params,
        });

        const nsResponse = await fetch(
            "/app/common/scripting/ClientScriptHandler.nl?script=&deploy=",
            {
                headers: {
                    accept: "*/*",
                    "content-type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
                method: "POST",
            }
        );

        if (!nsResponse.ok) {
            const errorResponse = await nsResponse.text();
            throw new Error(`Error response: ${errorResponse}`);
        }

        const data = await nsResponse.json();

        if (data.errorCode !== 0) {
            throw new Error(`NetSuite error: ${data.errorCode}`);
        }

        return { error: null, url: data.result };
    } catch (error: any) {
        return { error: error.message, url: null };
    }
};
