# Omniverse on DGX Cloud Portal Sample (Customer Web App)

This folder contains code for the Web Portal Sample that displays applications deployed on Omniverse on DGX Cloud and are registered in the 
backend service that can be found within the `backend` folder in this repo.

## Prerequisites

* [Node 20](https://nodejs.org/en/download/package-manager)

## Install

Run the `npm install` command to install project dependencies via NPM.

## Run

Create the `main.json` file in the `web/public/config` directory with the following content:
* Specify the Identity Provider URL in the `authority` value
* Specify the client ID of this application registered in the Identity Provider in the `clientId` value
* Replace the `nucleus` value with the fully qualified hostname of your Enterprise Nucleus Server (do not include `https://`)

```json
{
  "auth": {
    "authority": "...",
    "clientId": "...",
    "redirectUri": "http://127.0.0.1:3180/openid",
    "scope": "openid profile email authz"
  },
  "endpoints": {
    "backend": "http://127.0.0.1:3180/api",
    "nucleus": "..."
  },
  "sessions": {
    "maxTtl": 28800
  }
}
```

Run the `npm run dev` command to start the application in development mode. 
This will require running the backend application and disabling authentication. 
See [README.md](/backend/README.md) file in the `backend` directory for more information on how to start the backend application.

Running the portal in development mode does not allow connecting to Nucleus using streaming applications as the portal
cannot pass Nucleus cookies to the backend application. (Browsers do not permit passing cookies between different domains).
