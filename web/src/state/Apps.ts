import semver from "semver";
import { Config } from "../providers/ConfigProvider.tsx";

/**
 * Represents an application available for streaming.
 * One application may have multiple versions with different metadata.
 */
export interface StreamingApp {
  title: string;
  productArea: string;
  category: string;
  icon: string;
  latestVersion: StreamingAppVersion;

  authType?: AuthenticationType;

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
   * The application requires passing the ID token received from the IdP.
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
        title: item.title,
        productArea: item.product_area,
        icon: item.icon,
        category: item.category,
        latestVersion: version,
        versions: [],
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
    throw new Error(
      `Failed to load streaming applications -- HTTP${response.status}.\n${response.statusText}`,
    );
  }
}

export interface GetStreamingAppParams {
  functionId: string;
  functionVersionId: string;
  config: Config;
}

/**
 * Returns an application with the specified function ID and function version ID.
 * If such application does not exist, returns null.
 * @param functionId
 * @param functionVersionId
 * @param config
 */
export async function getStreamingApp({
  functionId,
  functionVersionId,
  config,
}: GetStreamingAppParams): Promise<StreamingApp | null> {
  const response = await fetch(
    `${config.endpoints.backend}/apps/?function_id=${functionId}&function_version_id=${functionVersionId}`,
  );
  if (response.ok) {
    const body = (await response.json()) as StreamingAppResponseItem[];
    const item = body[0];
    if (item) {
      return {
        title: item.title,
        productArea: item.product_area,
        category: item.category,
        icon: item.icon,
        latestVersion: {
          id: item.id,
          name: item.version,
          functionId: item.function_id,
          functionVersionId: item.function_version_id,
        },
        authType: item.authentication_type,
        versions: [],
      };
    } else {
      return null;
    }
  }
  throw new Error(
    `Failed to load the streaming application -- HTTP${response.status}.\n${response.statusText}`,
  );
}
