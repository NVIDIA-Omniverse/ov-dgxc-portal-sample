import { z } from "zod";
import { Config } from "../providers/ConfigProvider.tsx";
import { HttpError } from "../util/Errors";
import { fromSnakeCaseSchema } from "../util/Schemas";
import { createPaginatedSchema } from "./Pagination.ts";

/**
 * Schema for validating API responses for streaming sessions.
 */
const StreamingSession = fromSnakeCaseSchema(
  z.object({
    id: z.string(),
    functionId: z.string(),
    functionVersionId: z.string(),
    userId: z.string(),
    userName: z.string(),
    status: z.enum(["CONNECTING", "ACTIVE", "IDLE", "STOPPED"]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable(),
    app: fromSnakeCaseSchema(
      z.object({
        id: z.string(),
        title: z.string(),
        productArea: z.string(),
        version: z.string(),
      }),
    ).nullable(),
  }),
);

export type StreamingSession = z.infer<typeof StreamingSession>;

const StreamingSessionPage = createPaginatedSchema(StreamingSession);

export type StreamingSessionPage = z.infer<typeof StreamingSessionPage>;

export interface GetSessionsParams {
  config: Config;
  page?: number;
  status?: string;
  appId?: string;
}

/**
 * Returns streaming sessions filtered by the specified status.
 * If status is not provided, returns all streaming sessions.
 * The API uses offset pagination, the page parameter can specify the offset.
 *
 * @param config The application configuration retrieved from /config.json path.
 * @param page
 * @param status
 * @param app
 */
export async function getSessions({
  config,
  page,
  status,
  appId,
}: GetSessionsParams): Promise<StreamingSessionPage> {
  const params = new URLSearchParams();
  if (page) {
    params.set("page", page.toString());
  }
  if (status) {
    params.set("status", status.toUpperCase());
  }
  if (appId) {
    params.set("app_id", appId.toString());
  }

  const response = await fetch(
    `${config.endpoints.backend}/sessions/?${params.toString()}`,
  );
  if (response.ok) {
    const body: unknown = await response.json();
    return await StreamingSessionPage.parseAsync(body);
  }

  const text = await response.text();
  throw new HttpError(
    `Failed to load streaming sessions -- HTTP${response.status}.\n${text}`,
    response.status,
  );
}

export interface GetSessionParams {
  config: Config;
  sessionId: string;
}

export async function getSession({
  config,
  sessionId,
}: GetSessionParams): Promise<StreamingSession> {
  const response = await fetch(
    `${config.endpoints.backend}/sessions/${sessionId}`,
  );
  if (response.ok) {
    const body: unknown = await response.json();
    return await StreamingSession.parseAsync(body);
  }

  const text = await response.text();
  throw new HttpError(
    `Failed to load the session -- HTTP${response.status}.\n${text}`,
    response.status,
  );
}

export interface StartSessionParams {
  config: Config;
  appId: string;
}

export async function startSession({
  config,
  appId,
}: StartSessionParams): Promise<StreamingSession> {
  const params = new URLSearchParams();
  params.set("app_id", appId.toString());

  const response = await fetch(
    `${config.endpoints.backend}/sessions/?${params.toString()}`,
    {
      method: "POST",
    },
  );
  if (response.ok) {
    const body: unknown = await response.json();
    return await StreamingSession.parseAsync(body);
  }

  const text = await response.text();
  throw new HttpError(
    `Failed to start the session -- HTTP${response.status}.\n${text}`,
    response.status,
  );
}

export interface TerminateSessionParams {
  config: Config;
  sessionId: string;
}

/**
 * Terminates the session with the specified ID.
 * The user will get disconnected from the stream and will have to establish a new streaming session.
 *
 * @param config
 * @param sessionId
 */
export async function terminateSession({
  config,
  sessionId,
}: TerminateSessionParams): Promise<void> {
  const response = await fetch(
    `${config.endpoints.backend}/sessions/${sessionId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new HttpError(
      `Failed to terminate the session -- HTTP${response.status}.\n${text}`,
      response.status,
    );
  }
}
