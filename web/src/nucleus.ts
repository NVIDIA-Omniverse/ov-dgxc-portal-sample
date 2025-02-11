import WebSocketClient from "@omniverse/idl/connection/transport/websocket";

// Registers WebSocket transport for communicating with Nucleus services.
// Needs to be imported in the application before any code that connects to Nucleus.
WebSocketClient.register();