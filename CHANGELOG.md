# Omniverse on DGX Cloud - Portal Sample Changelog

## Version 1.4.2 - March 2026

- Display degraded applications on the main page with disabled state, warning indicator, and per-version status tracking
- Added `GET /users/me` endpoint that returns information about the currently authenticated user
- Allow system administrators to copy the NVCF Request ID of a session from the sessions page
- Reset the end date if a user reconnects to a streaming session
- Added OpenAPI tags for all backend endpoints

## Version 1.4.1 - January 2026

- Hide latency indicator if latency data is not available
- Update `GET /api/pages/` endpoint to return pages submitted only to `PUT /api/apps/`
- Display applications with degrading status in addition to active applications
- Fixed an issue where session timeout checks could be calculated incorrectly if the host/system runs using a non-UTC timezone
- Report OpenTelemetry metrics for the following:
	- Number of GPUs assigned (quota) to the NGC organization
	- Number of GPUs currently assigned to active NVCF functions
- Set application name as the browser tab title when stream starts
- Force the focus of the viewport when stream starts
- Update `@nvidia/omniverse-webrtc-streaming-library` to 5.17.0

## Version 1.4.0 - November 2025

- Added 'Deep Link' functionality for sharing a scene and other attributes (e.g., camera position) with other streaming users
- Added configuration for changing the home page title
- Update ``fastapi`` and ``starlette`` dependencies for Python backend
- Added ``DEGRADING`` status for NVCF streaming functions
- Remove `session.id` and `session.duration.seconds` attributes to reduce metric cardinality
- Invalidate NVCF function status cache when applications are added or removed from the portal
- Fixed an error that could occur on the home page if displayed applications used non-semantic versioning
- Changed the default aggregation temporality for OpenTelemetry metrics
- Added latency indicator for streaming sessions\*

**\*Note:** There may be a slight delay on the latency indicator reporting proper status while users are joining sessions. *(This will be enhanced in a future update.)*


## Version 1.3.1 - October 2025

- Fixed an issue where multiple tabs could try to refresh the authentication session simultaneously
- Added retries for establishing a new session and connecting to a running session
- Minor UI changes and added context to status and error messages for clarity
- Add "DEGRADED" status for NVCF streaming functions
- Update `@nvidia/omniverse-webrtc-streaming-library` to 5.15.5


## Version 1.3.0 - October 2025

- Fixed an issue where WebSocket endpoints couldn't be used with large headers
- Check Nucleus authentication before starting a streaming session
- Added the `page` field for grouping applications on different pages with a sidebar
- Added `/api/pages/` endpoint that returns the page order for the sidebar
- Removed unused `image` field for applications
- Update Python container to 3.13


## Version 1.2.0 - August 2025

 - Use OpenID Connect Discovery for authentication*
 - Adds the following OTel session metrics:
	 - Total Number of Active Sessions
	 - Start Session
	 - End Session
	 - Session Duration
- Adds the following attributes to session metrics:
	 - Session ID
	 - Session User Name
	 - Session Application Name
	 - NVCF Function ID
	 - NVCF Function Version
- Fixed an issue where the portal could display an error on all pages if it failed to refresh the session
- Support for configuring the header size limit
- Add a User column to the session list modal in the admin view of the session manager
- Hide the reconnect button for sessions of other users in the admin view of the session manager
- Add **media_server** and **media_port** for streaming functions
- Stop abandoned sessions (e.g., user created a session but chose not to connect or failed to connect)
- Disable Sessions link when users are on the Sessions page


**NOTE:**  This update to the Portal Sample introduces a change when integrating with an IDP. The Portal administrator needs to configure the `config.auth.metadataUri` with the IdP URI that points to OpenID Connect Discovery. This URL returns all necessary information for the Portal, including the jwks URI and userinfo URI.

This update adds greater support for IDPs, including Microsoft EntraID, and further simplifies the implementation.



## Version 1.1.0 - July 2025

- Fixed incorrect output for internal termination errors
- Specify path for cookies deleted on session termination
- Update python dependencies
- Check if a session still exists before attempting to reconnect
- Add a comment how to enable Azure PE/PLS streaming
- Allow users to view and terminate their own sessions within the Portal session manager
- Allow an app to be launched multiple times from the Portal with resume
- Increase timeouts for popup notifications
- Added a page for displaying application detailed information
- Display minutes for session duration
- Pass OpenID Connect access tokens to the stream with Nucleus-Token header
- Add a script to create an NVCF function with DDCS and Content Cache enabled
- Display a warning before the session ends
- Increase line-height for application title
- Implement API keys to allow calling the API from other services or CI
- Fixed an issue where cookies were not cleared correctly after session termination


## Version 1.0.0 - June 2025

- Intitial release
