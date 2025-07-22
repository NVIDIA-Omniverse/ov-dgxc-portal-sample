import semver from "semver";
import { Config } from "../providers/ConfigProvider.tsx";
import { HttpError } from "../util/Errors";

/**
 * Represents an application available for streaming.
 * One application may have multiple versions with different metadata.
 */
export interface StreamingApp {
  id: string;
  title: string;
  productArea: string;
  category: string;
  icon: string;
  latestVersion: StreamingAppVersion;

  authType?: AuthenticationType;

  /**
   * Specifies a hostname for the private endpoint for streaming.
   */
  mediaServer?: string;

  /**
   * Specifies a port for the private endpoint for streaming.
   */
  mediaPort?: number;

  /**
   * A list of application versions and their information.
   */
  versions: StreamingAppVersion[];
}

/**
 * Represents a version of an application available for streaming.
 * One application may have multiple different versions.
 */
export interface StreamingAppVersion {
  id: string;
  name: string;
  functionId: string;
  functionVersionId: string;
}

/**
 * Represents a status of an NVCF function.
 */
enum AppStatus {
  /**
   * The function is active and can be invoked.
   */
  Active = "ACTIVE",

  /**
   * The function is deployed but currently inactive.
   * Must be activated before invoked.
   */
  Inactive = "INACTIVE",

  /**
   * An error has occurred during the function deployment.
   */
  Error = "ERROR",

  /**
   * The application status cannot be retrieved from NVCF -
   * application does not exist, or status could not be retrieved from NVCF.
   */
  Unknown = "UNKNOWN",
}

/**
 * Defines what authentication type is required by a published app.
 */
export enum AuthenticationType {
  /**
   * The application does not require passing user authentication.
   */
  none = "NONE",

  /**
   * The application requires passing the access token received from the IdP.
   */
  openid = "OPENID",

  /**
   * The application requires passing a Nucleus access token.
   */
  nucleus = "NUCLEUS",
}

/**
 * Represents an application saved to the backend.
 */
interface StreamingAppResponseItem {
  /**
   * A unique identifier of the record in the backend service.
   */
  id: string;
  /**
   * A unique system name of this application.
   * Must only contain [A-Za-z0-9\-_] characters.
   */
  slug: string;
  /**
   * A unique identifier of the NVCF function registered for this application.
   */
  function_id: string;
  /**
   * A unique identifier of the NVCF function version registered for this application.
   */
  function_version_id: string;
  /**
   * A title of the application.
   */
  title: string;
  /**
   * A description of the application.
   * Can be in Markdown format.
   */
  description: string;
  /**
   * A version of the application.
   * @example 2024.1.0
   */
  version: string;
  /**
   * A URL for the main application image.
   */
  image: string;
  /**
   * A URL for the application icon.
   */
  icon: string;
  /**
   * A date when this application was published to the backend.
   */
  published_at: string;
  /**
   * A category used for grouping the applications.
   * @example Template Applications
   */
  category: string;
  /**
   * The current status of this application on NVCF.
   */
  status: AppStatus;
  /**
   * A subtitle for the full name of the application.
   * @example Omniverse
   */
  product_area: string;
  /**
   * Authentication type required by this application.
   */
  authentication_type: AuthenticationType;
  /**
   * Specifies a hostname for the private endpoint for streaming.
   */
  media_server?: string;
  /**
   * Specifies a port for the private endpoint for streaming.
   */
  media_port?: number;
}

export interface GetStreamingAppsParams {
  config: Config;
}

/**
 * Returns all streaming applications available for the current user.
 * @param {Config} config The configuration object obtained from ContextProvider.
 */
export async function getStreamingApps({
  config,
}: GetStreamingAppsParams): Promise<
  Map<StreamingApp["category"], Map<StreamingApp["title"], StreamingApp>>
> {
  const response = await fetch(
    `${config.endpoints.backend}/apps/?status=${AppStatus.Active}`,
  );
  if (response.ok) {
    const body = (await response.json()) as StreamingAppResponseItem[];

    const categories = new Map<
      StreamingApp["category"],
      Map<StreamingApp["title"], StreamingApp>
    >();

    for (const item of body) {
      const category =
        categories.get(item.category) ??
        new Map<StreamingApp["title"], StreamingApp>();

      const version: StreamingAppVersion = {
        id: item.id,
        name: item.version,
        functionId: item.function_id,
        functionVersionId: item.function_version_id,
      };
      const app: StreamingApp = category.get(item.title) ?? {
        id: item.id,
        title: item.title,
        productArea: item.product_area,
        icon: item.icon,
        category: item.category,
        latestVersion: version,
        versions: [],
        mediaServer: item.media_server,
        mediaPort: item.media_port,
      };
      if (semver.compare(item.version, app.latestVersion.name) === 1) {
        app.latestVersion = version;
      }

      app.versions.push(version);
      category.set(app.title, app);
      categories.set(app.category, category);
    }

    for (const category of categories.values()) {
      for (const app of category.values()) {
        app.versions.sort((a, b) => -semver.compare(a.name, b.name));
      }
    }

    return categories;
  } else {
    throw new HttpError(
      `Failed to load streaming applications -- HTTP${response.status}.\n${response.statusText}`,
      response.status
    );
  }
}

export interface GetStreamingAppParams {
  appId: string;
  config: Config;
}

/**
 * Returns an application with the specified ID.
 * If such application does not exist, returns null.
 * @param appId
 * @param config
 */
export async function getStreamingApp({
  appId,
  config,
}: GetStreamingAppParams): Promise<StreamingApp | null> {
  const response = await fetch(
    `${config.endpoints.backend}/apps/${appId}`,
  );
  if (response.ok) {
    const body = (await response.json()) as StreamingAppResponseItem;
    if (body) {
      return {
        id: body.id,
        title: body.title,
        productArea: body.product_area,
        category: body.category,
        icon: body.icon,
        latestVersion: {
          id: body.id,
          name: body.version,
          functionId: body.function_id,
          functionVersionId: body.function_version_id,
        },
        authType: body.authentication_type,
        versions: [],
        mediaServer: body.media_server,
        mediaPort: body.media_port,
      };
    } else {
      return null;
    }
  }

  if (response.status === 404) {
    return null;
  }

  throw new HttpError(
    `Failed to load the streaming application -- HTTP${response.status}.\n${response.statusText}`,
    response.status
  );
}
