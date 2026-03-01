
export const getErrorMessage = (err: any, fallback: string = "Ha ocurrido un error"): string => {
    console.error("API Error:", err);
    if (err?.response?.data?.message) {
        const msg = err.response.data.message;
        return Array.isArray(msg) ? msg[0] : msg;
    }
    return err?.message ?? fallback;
};
