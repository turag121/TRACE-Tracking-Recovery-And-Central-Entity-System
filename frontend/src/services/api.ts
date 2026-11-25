import axios from "axios";

export const api = axios.create({
  baseURL: "/backend-api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : undefined;
  }

  const responseMessage = error.response?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.join(" ");
  }
  if (typeof responseMessage === "string") {
    return responseMessage;
  }
  return undefined;
}
