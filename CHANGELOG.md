# Omniverse on DGX Cloud - Portal Sample Changelog

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