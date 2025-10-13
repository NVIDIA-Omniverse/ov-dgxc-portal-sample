import { Config } from "../providers/ConfigProvider";
import { HttpError } from "../util/Errors";

export interface GetPagesParams {
  config: Config;
}

export interface PublishingPage {
  name: string;
  order?: number;
}

export async function getPages({
  config,
}: GetPagesParams): Promise<Map<PublishingPage["name"], PublishingPage>> {
  const response = await fetch(`${config.endpoints.backend}/pages/`);
  if (response.ok) {
    const body = (await response.json()) as PublishingPage[];
    const result = new Map<PublishingPage["name"], PublishingPage>();
    for (const page of body) {
      result.set(page.name, page);
    }
    return result;
  }

  throw new HttpError(
    `Failed to load published pages -- HTTP${response.status}.\n${response.statusText}`,
    response.status,
  );
}

export function comparePageOrder(pageA?: PublishingPage, pageB?: PublishingPage): number {
  return (pageA?.order ?? Number.MAX_VALUE) - (pageB?.order ?? Number.MAX_VALUE);
}