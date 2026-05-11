# `RErrorCode` full map (appendix)

Complete `qr.map` table from `@nvidia/ov-web-rtc` **6.4.5**. For triage, start with [OV-WEB-RTC-ERROR-CODES.md](OV-WEB-RTC-ERROR-CODES.md).

## Streaming-relevant codes (filtered)

| Enum | Decimal | Hex | User message |
|------|---------|-----|--------------|
| NoNetwork | 3237089281 | 0xC0F21001 | No internet connection. |
| GetActiveSessionServerError | 3237089283 | 0xC0F21003 | Error occurred due to GetActiveSessionServerError. |
| SessionFinishedState | 3237093378 | 0xC0F22002 | Unexpected session state while polling. |
| ResponseParseFailure | 3237093379 | 0xC0F22003 | Failed to parse server response. |
| StreamerVideoPlayError | 3237093893 | 0xC0F22205 | Video play failure. |
| SessionLimitExceeded | 3237093643 | 0xC0F2210B | Session Limit Exceeded. |
| StreamErrorGeneric | 3237093889 | 0xC0F22201 | Some generic error happened in streamer. |
| StreamerSignInFailure | 3237093890 | 0xC0F22202 | Error occurred during sign-in request to signaling server. |
| StreamerHangingGetFailure | 3237093891 | 0xC0F22203 | Error occurred in hanging get request of peer connection. |
| StreamerIceConnectionFailed | 3237093894 | 0xC0F22206 | Could not find valid ice candidate pair. |
| StreamerGetRemotePeerTimedOut | 3237093895 | 0xC0F22207 | Streaming stopped due to no remote peer. |
| StreamInputChannelError | 3237093896 | 0xC0F22208 | Streaming stopped due to input channel error. |
| StreamCursorChannelError | 3237093897 | 0xC0F22209 | Streaming stopped due to cursor channel error. |
| StreamControlChannelError | 3237093898 | 0xC0F2220A | Streaming stopped due to control channel error. |
| StreamerIceReConnectionFailed | 3237093906 | 0xC0F22212 | Reconnect attempt failed after network problem, or remote peer not alive. |
| StreamerNoVideoPacketsReceivedEver | 3237093900 | 0xC0F2220C | Streaming stopped as NoVideoPacketsReceivedEver. |
| StreamerNoVideoFramesLossyNetwork | 3237093901 | 0xC0F2220D | Streaming stopped as NoVideoFramesLossyNetwork. |
| StreamDisconnectedFromServer | 15868672 | 0xF22300 | Stream disconnected from server, unknown reason. |
| ServerDisconnectedNoResponse | 3237094145 | 0xC0F22301 | Stream disconnected from server, NoResponse. |
| ServerDisconnectedRemoteInputError | 3237094146 | 0xC0F22302 | Stream disconnected from server, RemoteInputError. |
| ServerDisconnectedFrameGrabFailed | 3237094147 | 0xC0F22303 | Stream disconnected from server, FrameGrabFailed. |
| ServerDisconnectedConfigUnAvailable | 3237094148 | 0xC0F22304 | Stream disconnected from server, ConfigUnAvailable. |
| ServerDisconnectedInvalidCommand | 3237094149 | 0xC0F22305 | Stream disconnected from server, InvalidCommand. |
| ServerDisconnectedInvalidMouseState | 3237094150 | 0xC0F22306 | Stream disconnected from server, InvalidMouseState. |
| ServerDisconnectedNetworkError | 3237094151 | 0xC0F22307 | Stream disconnected from server, NetworkError. |
| ServerDisconnectedGameLaunchFailed | 3237094152 | 0xC0F22308 | Stream disconnected from server, GameLaunchFailed. |
| ServerDisconnectedVideoFirstFrameSendFailed | 3237094153 | 0xC0F22309 | Stream disconnected from server, VideoFirstFrameSendFailed. |
| ServerDisconnectedVideoNextFrameSendFailed | 3237094154 | 0xC0F2230A | Stream disconnected from server, VideoNextFrameSendFailed. |
| ServerDisconnectedFrameGrabTimedOut | 3237094155 | 0xC0F2230B | Stream disconnected from server, FrameGrabTimedOut. |
| ServerDisconnectedFrameEncodeTimedOut | 3237094156 | 0xC0F2230C | Stream disconnected from server, FrameEncodeTimedOut. |
| ServerDisconnectedFrameSendTimedOut | 3237094157 | 0xC0F2230D | Stream disconnected from server, FrameSendTimedOut. |
| ServerDisconnectedIntended | 15868704 | 0xF22320 | Stream disconnected from server as user quit the game. |
| ServerDisconnectedUserLoggedInDifferentAccount | 15868706 | 0xF22322 | Stream disconnected from server, userLoggedInDifferentAccount. |
| ServerDisconnectedWindowedMode | 15868707 | 0xF22323 | Stream disconnected from server, WindowedMode. |
| ServerDisconnectedUserIdle | 15868708 | 0xF22324 | Stream disconnected from server, UserIdle. |
| ServerDisconnectedUnAuthorizedProcessDetected | 15868709 | 0xF22325 | Stream disconnected from server, UnAuthorizedProcessDetected. |
| ServerDisconnectedMaliciousProcessDetected | 15868710 | 0xF22326 | Stream disconnected from server, MaliciousProcessDetected. |
| ServerDisconnectedUnKnownProcessDetected | 15868711 | 0xF22327 | Stream disconnected from server, UnKnownProcessDetected. |
| ServerDisconnectedMinerProcessDetected | 15868712 | 0xF22328 | Stream disconnected from server, MinerProcessDetected. |
| ServerDisconnectedStreamingUnsupported | 15868713 | 0xF22329 | Stream disconnected from server, StreamingUnsupported. |
| ServerDisconnectedAnotherClient | 15868714 | 0xF2232A | Stream disconnected from server, AnotherClient. |
| ServerDisconnectedUnknownFromPm | 15868736 | 0xF22340 | Stream disconnected from server, UnknownFromPm. |
| ServerDisconnectedUserEntitledMinutesExceeded | 15868737 | 0xF22341 | Stream disconnected from server, UserEntitledMinutesExceeded. |
| ServerDisconnectedClientReconnectTimeLimitExceeded | 15868738 | 0xF22342 | Stream disconnected from server, ClientReconnectTimeLimitExceeded. |
| ServerDisconnectedOperatorCommandedTermination | 15868739 | 0xF22343 | Stream disconnected from server, OperatorCommandedTermination. |
| ServerDisconnectedConcurrentSessionLimitExceeded | 15868740 | 0xF22344 | Stream disconnected from server, ConcurrentSessionLimitExceeded. |
| ServerDisconnectedMaxSessionTimeLimitExceeded | 15868741 | 0xF22345 | Stream disconnected from server, MaxSessionTimeLimitExceeded. |
| ServerDisconnectedBifrostInitiatedSessionPause | 15868742 | 0xF22346 | Stream disconnected from server, BifrostInitiatedSessionPause. |
| ServerDisconnectedSystemCommandTermination | 15868743 | 0xF22347 | Stream disconnected from server, SystemCommandTermination. |
| ServerDisconnectedMultipleLogin | 15868744 | 0xF22348 | Stream disconnected from server, MultipleLogin. |
| ServerInternalError | 3237093636 | 0xC0F22104 | Session setup failed on server. |
| ServerSessionQueueLengthExceeded | 3237093694 | 0xC0F2213E | We have reached our limit for the number of gamers who can wait for the next available rig. Please try again later. |
| SessionTerminatedByAnotherClient | 3237093678 | 0xC0F2212E | Session setup request was terminated by another client. |
| ServerDisconnectedGameNotOwnedByUser | 15868717 | 0xF2232D | Your session ended as you do not own the requested game. |
| SystemSleepDuringStreaming | 15867908 | 0xF22004 | Your session ended as device went to sleep during streaming. |
| SessionInQueueAbandoned | 3237093701 | 0xC0F22145 | Session abandoned during polling. |
| NoInternetDuringStreaming | 15868418 | 0xF22202 | Cannot connect to server. |
| SessionLimitPerDeviceReached | 3237093682 | 0xC0F22132 | There is an active session for this device belonging to another user. Please try again after sometime |
| SessionSetupCancelledDuringQueuing | 15867906 | 0xF22002 | Session setup was cancelled, please reconfigure your session. |
| StreamerSignInTimeout | 3237093907 | 0xC0F22213 | Sign in request timed out. |
| StreamerSignInWorkerFailure | 3237093908 | 0xC0F22214 | Sign in request failed due to worker failure. |
| InvalidServerResponse | 3237093381 | 0xC0F22005 | The server response is invalid. |
| GridServerNotInitialized | 3237093383 | 0xC0F22007 | The grid server is not initialized. |
| DOMExceptionInGridServer | 3237093384 | 0xC0F22008 | A DOM exception occurred in the grid server. |
| ServerInternalTimeout | 3237093635 | 0xC0F22103 | The server encountered an internal timeout. |
| ServerInvalidRequest | 3237093637 | 0xC0F22105 | The server received an invalid request. |
| ServerInvalidRequestVersion | 3237093638 | 0xC0F22106 | The request version is invalid. |
| SessionListLimitExceeded | 3237093639 | 0xC0F22107 | The session list limit has been exceeded. |
| SessionEntitledTimeExceeded | 3237093645 | 0xC0F2210D | The entitled session time has been exceeded. |
| ServiceUnAvailable | 3237093657 | 0xC0F22119 | The service is unavailable. |
| SessionNotPaused | 3237093666 | 0xC0F22122 | The session is not paused. |
| SessionNotPlaying | 3237093671 | 0xC0F22127 | The session is not in a playing state. |
| InvalidServiceResponse | 3237093672 | 0xC0F22128 | The service response is invalid. |
| DeviceIdAlreadyUsed | 3237093679 | 0xC0F2212F | The device ID is already in use. |
| ServiceNotExist | 3237093680 | 0xC0F22130 | The requested service does not exist. |
| SessionExpired | 3237093681 | 0xC0F22131 | The session has expired. |
| RegionNotSupportedForStreaming | 3237093695 | 0xC0F2213F | The region is not supported for streaming. |
| SessionForwardRequestAllocationTimeExpired | 3237093696 | 0xC0F22140 | The session forward request allocation time has expired. |
| SessionForwardGameBinariesNotAvailable | 3237093697 | 0xC0F22141 | The game binaries are not available for session forwarding. |
| SessionRemovedFromQueueMaintenance | 3237093703 | 0xC0F22147 | The session was removed from the queue due to maintenance. |
| InvalidZoneForQueuedSession | 3237093710 | 0xC0F2214E | The zone is invalid for the queued session. |
| SessionWaitingAdsTimeExpired | 3237093711 | 0xC0F2214F | The session waiting ads time has expired. |
| StreamingNotAllowedInLimitedMode | 3237093713 | 0xC0F22151 | Streaming is not allowed in limited mode. |
| MaxSessionNumberLimitExceeded | 3237093715 | 0xC0F22153 | The maximum session number limit has been exceeded. |
| SessionRejectedNoCapacity | 3237093717 | 0xC0F22155 | The session was rejected due to no capacity. |
| SessionInsufficientPlayabilityLevel | 3237093718 | 0xC0F22156 | The session has insufficient playability level. |
| StreamerDataChannelClosing | 15867907 | 0xF22003 | The streamer data channel is closing. |
| ClientDisconnectedUserIdle | 15867913 | 0xF22009 | The client was disconnected due to user inactivity. |
| StreamerNoPeerInfo | 3237093912 | 0xC0F22218 | No peer info found. |
| InvalidSessionIdMalformed | 3237093653 | 0xC0F22115 | The session ID is not formatted correctly. |
| InvalidSessionIdNotFound | 3237093654 | 0xC0F22116 | The requested session ID does not exist. |
| StreamerNetworkError | 3237093892 | 0xC0F22204 | Peer connection closed due to network error. |
| StreamerReConnectionFailed | 3237093899 | 0xC0F2220B | Streaming reconnection failed. |
| StreamerSetSDPFailure | 3237093902 | 0xC0F2220E | Peers could not be configured with SDP. |
| StreamerNoLocalCandidates | 3237093903 | 0xC0F2220F | No local ICE candidate for streaming. |
| StreamerNoRemoteCandidates | 3237093904 | 0xC0F22210 | No remote ICE candidate for streaming. |
| StreamerNoVideoTrack | 3237093905 | 0xC0F22211 | Video track is not received from remote. |
| StreamerNoTracksReceivedInSdp | 3237093909 | 0xC0F22215 | No track is received from the remote. |
| StreamerNvstSdpFailure | 3237093910 | 0xC0F22216 | Generic failure related to SDP. |
| StreamerNvstSdpParseFailure | 3237093911 | 0xC0F22217 | Offer SDP could not be parsed. |
| StreamerNoOffer | 3237093913 | 0xC0F22219 | No offer is received from remote. |
| StreamerNoAudioTrack | 3237093914 | 0xC0F2221A | No audio track is received from remote. |
| StreamerInvalidRemoteConfigOverride | 3237093915 | 0xC0F2221B | Invalid NVST config present in remote config provided overrides. |
| StreamerInvalidServerOverride | 3237093916 | 0xC0F2221C | Invalid NVST config present in server provided overrides. |
| StreamerInvalidClientOverride | 3237093917 | 0xC0F2221D | Invalid NVST config present in client provided overrides. |
| StreamerConfigUpdateFailure | 3237093918 | 0xC0F2221E | Remote offer SDP could not be updated to client local NVST config. |
| StreamerInputChannelNotOpen | 3237093919 | 0xC0F2221F | Input channel is not opened and suspended on connecting state. |
| StreamerCursorChannelNotOpen | 3237093920 | 0xC0F22220 | Cursor channel is not opened and suspended on connecting state. |
| StreamerControlChannelNotOpen | 3237093921 | 0xC0F22221 | Control channel is not opened and suspended on connecting state. |
| StreamerVideoAdapterInitTimeOut | 3237093922 | 0xC0F22222 | Client timed-out while waiting for server to initialize video adapter. |
| StreamerVideoFrameProviderInitTimeOut | 3237093923 | 0xC0F22223 | Client timed-out while waiting for server to initialize video frame provider. |
| StreamerVideoEncoderInitTimeOut | 3237093924 | 0xC0F22224 | Client timed-out while waiting for server to initialize video encoder. |
| StreamerVideoSetupTimeOut | 3237093925 | 0xC0F22225 | Client timed-out while waiting for server to setup video pipeline. |
| StreamerNoStunResponsesReceived | 3237093926 | 0xC0F22226 | Client sent STUN requests but did not receive any responses from the server. |
| StreamerNoNominatedCandidatePairs | 3237093927 | 0xC0F22227 | No ICE candidate pairs were nominated. |
| StreamerNoSucceededCandidatePairs | 3237093928 | 0xC0F22228 | No ICE candidate pairs passed all checks. |
| StreamPartiallyReliableInputChannelError | 3237093929 | 0xC0F22229 | Partially reliable input channel setup error. |
| StreamerPartiallyReliableInputChannelNotOpen | 3237093936 | 0xC0F22230 | Partially reliable input channel is not opened and suspended on connecting state. |
| StreamerNeedAudioElement | 3237093937 | 0xC0F22231 | An expected audio HTML element is missing. |
| StreamerInvalidVideoSettings | 3237093938 | 0xC0F22232 | An invalid combination of streaming settings was requested. |
| StreamerNeedVideoElement | 3237093939 | 0xC0F22233 | One or more of the expected video elements could not be found. |
| StreamerVideoDecoderUnrecoverableBitstream | 3237093940 | 0xC0F22234 | The video decoder encountered an unrecoverable bitstream error. |
| StreamerHighPLICount | 3237093941 | 0xC0F22235 | The video decoder encountered a high PLI count. |
| StreamerNoVideoFramePresented | 3237093942 | 0xC0F22236 | The video media player encountered no video frame presented. |
| StreamerNoVideoFrameRendered | 3237093943 | 0xC0F22237 | The video media player encountered no video frame rendered. |
| SystemSleepDuringSessionSetup | 15867909 | 0xF22005 | Session setup ended as device went to sleep. |
| PauseSession | 15867910 | 0xF22006 | Session was paused. |
| DelayedSessionError | 15867911 | 0xF22007 | Delayed session error (saved in database for next session). |
| ServerDisconnectedNetworkTimedOut | 3237094158 | 0xC0F2230E | Stream disconnected from server, NetworkTimedOut. |
| ServerDisconnectedPeerRemovedByServer | 3237094159 | 0xC0F2230F | Stream disconnected from server, PeerRemovedByServer. |
| ServerDisconnectedUnknownError | 3237094160 | 0xC0F22310 | Stream disconnected from server, UnknownError. |
| ServerDisconnectedPeerRemovedBeforeStream | 3237094161 | 0xC0F22311 | Stream disconnected from server, PeerRemovedBeforeStream. |
| ServerDisconnectedHotKey | 15868705 | 0xF22321 | Stream disconnected from server due to hot key / game focus change. |
| ServerDisconnectedCodeIntegrityViolation | 15868715 | 0xF2232B | Stream disconnected from server, CodeIntegrityViolation. |
| ServerDisconnectedUnauthorizedActivityDetected | 15868716 | 0xF2232C | Stream disconnected from server, UnauthorizedActivityDetected. |
| ServerDisconnectedProtectedContent | 15868718 | 0xF2232E | Stream disconnected from server, ProtectedContent. |
| ServerDisconnectedDisplayTopologyChanged | 15868719 | 0xF2232F | Stream disconnected from server, DisplayTopologyChanged. |
| ServerDisconnectedAbruptly | 15868688 | 0xF22310 | Streaming terminated due to server unintended termination. |
| ServerDisconnectedMaintenanceMode | 15868745 | 0xF22349 | This server is going offline for scheduled maintenance. |
| ServerDisconnectedMultipleTab | 15868752 | 0xF22350 | Stream disconnected due to second session launch in another browser tab. |
| InvalidVideoElement | 3237094400 | 0xC0F22400 | Invalid video element for streaming. |
| InvalidAudioElement | 3237094401 | 0xC0F22401 | Invalid audio element for streaming. |
| WebSocketNormalClosure | 3237101567 | 0xC0F23FFF | The connection successfully completed. |
| WebSocketProtocolError | 3237101565 | 0xC0F23FFD | The endpoint is terminating the connection due to a protocol error. |
| WebSocketUnsupportedData | 3237101564 | 0xC0F23FFC | The connection is being terminated due to unsupported data type. |
| WebSocketInvalidFramePayloadData | 3237101560 | 0xC0F23FF8 | The endpoint is terminating the connection due to inconsistent data. |
| WebSocketPolicyViolation | 3237101559 | 0xC0F23FF7 | The endpoint is terminating the connection due to policy violation. |
| WebSocketMessageTooBig | 3237101558 | 0xC0F23FF6 | The endpoint is terminating the connection because a data frame was too large. |
| WebSocketMandatoryExt | 3237101557 | 0xC0F23FF5 | The client is terminating the connection due to missing extension negotiation. |
| WebSocketInternalError | 3237101556 | 0xC0F23FF4 | The server is terminating the connection due to an unexpected condition. |
| WebSocketServiceRestart | 3237101555 | 0xC0F23FF3 | The server is terminating the connection because it is restarting. |
| WebSocketTryAgainLater | 3237101554 | 0xC0F23FF2 | The server is terminating the connection due to temporary overload. |
| WebSocketUnauthorized | 3237101551 | 0xC0F23FEF | WebSocket unauthorized connection. |
| WebSocketForbidden | 3237101550 | 0xC0F23FEE | WebSocket forbidden connection. |
| WebSocketTimeout | 3237101549 | 0xC0F23FED | WebSocket connection timeout. |
| InvalidTransportRequest | 3237093720 | 0xC0F22158 | The session was rejected due to invalid transport request. |
| UserStorageNotAvailable | 3237093721 | 0xC0F22159 | The session was terminated due to user's permanent storage being unavailable. |
| GfnStorageNotAvailable | 3237093722 | 0xC0F2215A | The session was terminated due to GFN ephemeral storage being unavailable. |
| SessionServerErrorBegin | 3237093632 | 0xC0F22100 | Start of PM error range. |
| SessionServerErrorEnd | 3237093887 | 0xC0F221FF | End of PM error range. |
| StreamerErrorCategory | 3237093888 | 0xC0F22200 | Streamer error category. |

## Full code table

| Enum | Decimal | Hex | User message |
|------|---------|-----|--------------|
| AuthProviderError | 3237085185 | 0xC0F20001 | Error happened during request to auth provider. |
| NoNetwork | 3237089281 | 0xC0F21001 | No internet connection. |
| NetworkError | 3237089282 | 0xC0F21002 | A network error occurred. |
| GetActiveSessionServerError | 3237089283 | 0xC0F21003 | Error occurred due to GetActiveSessionServerError. |
| ExceptionHappened | 3237089284 | 0xC0F21004 | Unexpected exception happened. |
| AuthTokenNotUpdated | 3237093377 | 0xC0F22001 | Error occurred due to AuthTokenNotUpdated. |
| SessionFinishedState | 3237093378 | 0xC0F22002 | Unexpected session state while polling. |
| ResponseParseFailure | 3237093379 | 0xC0F22003 | Failed to parse server response. |
| StreamerVideoPlayError | 3237093893 | 0xC0F22205 | Video play failure. |
| GridAppNotInitialized | 3237093380 | 0xC0F22004 | Grid app instance was not initialized. |
| SessionLimitExceeded | 3237093643 | 0xC0F2210B | Session Limit Exceeded. |
| StreamErrorGeneric | 3237093889 | 0xC0F22201 | Some generic error happened in streamer. |
| StreamerSignInFailure | 3237093890 | 0xC0F22202 | Error occurred during sign-in request to signaling server. |
| StreamerHangingGetFailure | 3237093891 | 0xC0F22203 | Error occurred in hanging get request of peer connection. |
| StreamerIceConnectionFailed | 3237093894 | 0xC0F22206 | Could not find valid ice candidate pair. |
| StreamerGetRemotePeerTimedOut | 3237093895 | 0xC0F22207 | Streaming stopped due to no remote peer. |
| StreamInputChannelError | 3237093896 | 0xC0F22208 | Streaming stopped due to input channel error. |
| StreamCursorChannelError | 3237093897 | 0xC0F22209 | Streaming stopped due to cursor channel error. |
| StreamControlChannelError | 3237093898 | 0xC0F2220A | Streaming stopped due to control channel error. |
| StreamerIceReConnectionFailed | 3237093906 | 0xC0F22212 | Reconnect attempt failed after network problem, or remote peer not alive. |
| StreamerNoVideoPacketsReceivedEver | 3237093900 | 0xC0F2220C | Streaming stopped as NoVideoPacketsReceivedEver. |
| StreamerNoVideoFramesLossyNetwork | 3237093901 | 0xC0F2220D | Streaming stopped as NoVideoFramesLossyNetwork. |
| StreamDisconnectedFromServer | 15868672 | 0xF22300 | Stream disconnected from server, unknown reason. |
| ServerDisconnectedNoResponse | 3237094145 | 0xC0F22301 | Stream disconnected from server, NoResponse. |
| ServerDisconnectedRemoteInputError | 3237094146 | 0xC0F22302 | Stream disconnected from server, RemoteInputError. |
| ServerDisconnectedFrameGrabFailed | 3237094147 | 0xC0F22303 | Stream disconnected from server, FrameGrabFailed. |
| ServerDisconnectedConfigUnAvailable | 3237094148 | 0xC0F22304 | Stream disconnected from server, ConfigUnAvailable. |
| ServerDisconnectedInvalidCommand | 3237094149 | 0xC0F22305 | Stream disconnected from server, InvalidCommand. |
| ServerDisconnectedInvalidMouseState | 3237094150 | 0xC0F22306 | Stream disconnected from server, InvalidMouseState. |
| ServerDisconnectedNetworkError | 3237094151 | 0xC0F22307 | Stream disconnected from server, NetworkError. |
| ServerDisconnectedGameLaunchFailed | 3237094152 | 0xC0F22308 | Stream disconnected from server, GameLaunchFailed. |
| ServerDisconnectedVideoFirstFrameSendFailed | 3237094153 | 0xC0F22309 | Stream disconnected from server, VideoFirstFrameSendFailed. |
| ServerDisconnectedVideoNextFrameSendFailed | 3237094154 | 0xC0F2230A | Stream disconnected from server, VideoNextFrameSendFailed. |
| ServerDisconnectedFrameGrabTimedOut | 3237094155 | 0xC0F2230B | Stream disconnected from server, FrameGrabTimedOut. |
| ServerDisconnectedFrameEncodeTimedOut | 3237094156 | 0xC0F2230C | Stream disconnected from server, FrameEncodeTimedOut. |
| ServerDisconnectedFrameSendTimedOut | 3237094157 | 0xC0F2230D | Stream disconnected from server, FrameSendTimedOut. |
| ServerDisconnectedIntended | 15868704 | 0xF22320 | Stream disconnected from server as user quit the game. |
| ServerDisconnectedUserLoggedInDifferentAccount | 15868706 | 0xF22322 | Stream disconnected from server, userLoggedInDifferentAccount. |
| ServerDisconnectedWindowedMode | 15868707 | 0xF22323 | Stream disconnected from server, WindowedMode. |
| ServerDisconnectedUserIdle | 15868708 | 0xF22324 | Stream disconnected from server, UserIdle. |
| ServerDisconnectedUnAuthorizedProcessDetected | 15868709 | 0xF22325 | Stream disconnected from server, UnAuthorizedProcessDetected. |
| ServerDisconnectedMaliciousProcessDetected | 15868710 | 0xF22326 | Stream disconnected from server, MaliciousProcessDetected. |
| ServerDisconnectedUnKnownProcessDetected | 15868711 | 0xF22327 | Stream disconnected from server, UnKnownProcessDetected. |
| ServerDisconnectedMinerProcessDetected | 15868712 | 0xF22328 | Stream disconnected from server, MinerProcessDetected. |
| ServerDisconnectedStreamingUnsupported | 15868713 | 0xF22329 | Stream disconnected from server, StreamingUnsupported. |
| ServerDisconnectedAnotherClient | 15868714 | 0xF2232A | Stream disconnected from server, AnotherClient. |
| ServerDisconnectedUnknownFromPm | 15868736 | 0xF22340 | Stream disconnected from server, UnknownFromPm. |
| ServerDisconnectedUserEntitledMinutesExceeded | 15868737 | 0xF22341 | Stream disconnected from server, UserEntitledMinutesExceeded. |
| ServerDisconnectedClientReconnectTimeLimitExceeded | 15868738 | 0xF22342 | Stream disconnected from server, ClientReconnectTimeLimitExceeded. |
| ServerDisconnectedOperatorCommandedTermination | 15868739 | 0xF22343 | Stream disconnected from server, OperatorCommandedTermination. |
| ServerDisconnectedConcurrentSessionLimitExceeded | 15868740 | 0xF22344 | Stream disconnected from server, ConcurrentSessionLimitExceeded. |
| ServerDisconnectedMaxSessionTimeLimitExceeded | 15868741 | 0xF22345 | Stream disconnected from server, MaxSessionTimeLimitExceeded. |
| ServerDisconnectedBifrostInitiatedSessionPause | 15868742 | 0xF22346 | Stream disconnected from server, BifrostInitiatedSessionPause. |
| ServerDisconnectedSystemCommandTermination | 15868743 | 0xF22347 | Stream disconnected from server, SystemCommandTermination. |
| ServerDisconnectedMultipleLogin | 15868744 | 0xF22348 | Stream disconnected from server, MultipleLogin. |
| ServerInternalError | 3237093636 | 0xC0F22104 | Session setup failed on server. |
| RequestLimitExceeded | 3237093642 | 0xC0F2210A | You have tried to play too many games in a short period of time. Please wait a few minutes and try again. |
| EntitlementFailure | 3237093650 | 0xC0F22112 | You are not entitled to play this game. Please check you entitlement. |
| AppPatching | 3237093673 | 0xC0F22129 | Game is currently in patching state, please try again later. |
| GameNotFound | 3237093674 | 0xC0F2212A | Requested game is not available in the zone. Please try another zone. |
| AppMaintenanceStatus | 3237093688 | 0xC0F22138 | Requested game is under maintenance. |
| RequiredSeatInstanceTypeNotSupported | 3237093693 | 0xC0F2213D | Required instance type for the game is not available in current zone. Please try different zone. |
| ServerSessionQueueLengthExceeded | 3237093694 | 0xC0F2213E | We have reached our limit for the number of gamers who can wait for the next available rig. Please try again later. |
| SessionTerminatedByAnotherClient | 3237093678 | 0xC0F2212E | Session setup request was terminated by another client. |
| ServerDisconnectedGameNotOwnedByUser | 15868717 | 0xF2232D | Your session ended as you do not own the requested game. |
| SystemSleepDuringStreaming | 15867908 | 0xF22004 | Your session ended as device went to sleep during streaming. |
| SessionInQueueAbandoned | 3237093701 | 0xC0F22145 | Session abandoned during polling. |
| NoInternetDuringStreaming | 15868418 | 0xF22202 | Cannot connect to server. |
| SessionLimitPerDeviceReached | 3237093682 | 0xC0F22132 | There is an active session for this device belonging to another user. Please try again after sometime |
| SessionSetupCancelledDuringQueuing | 15867906 | 0xF22002 | Session setup was cancelled, please reconfigure your session. |
| StreamerSignInTimeout | 3237093907 | 0xC0F22213 | Sign in request timed out. |
| StreamerSignInWorkerFailure | 3237093908 | 0xC0F22214 | Sign in request failed due to worker failure. |
| InvalidOperation | 3237085186 | 0xC0F20002 | The operation is invalid. |
| InvalidServerResponse | 3237093381 | 0xC0F22005 | The server response is invalid. |
| PutOrPostInProgress | 3237093382 | 0xC0F22006 | A PUT or POST operation is already in progress. |
| GridServerNotInitialized | 3237093383 | 0xC0F22007 | The grid server is not initialized. |
| DOMExceptionInGridServer | 3237093384 | 0xC0F22008 | A DOM exception occurred in the grid server. |
| InvalidAdStateTransition | 3237093386 | 0xC0F2200A | Invalid advertisement state transition. |
| RequestForbidden | 3237093634 | 0xC0F22102 | The request is forbidden. |
| ServerInternalTimeout | 3237093635 | 0xC0F22103 | The server encountered an internal timeout. |
| ServerInvalidRequest | 3237093637 | 0xC0F22105 | The server received an invalid request. |
| ServerInvalidRequestVersion | 3237093638 | 0xC0F22106 | The request version is invalid. |
| SessionListLimitExceeded | 3237093639 | 0xC0F22107 | The session list limit has been exceeded. |
| InvalidRequestDataMalformed | 3237093640 | 0xC0F22108 | The request data is malformed. |
| InvalidRequestDataMissing | 3237093641 | 0xC0F22109 | The request data is missing. |
| InvalidRequestVersionOutOfDate | 3237093644 | 0xC0F2210C | The request version is out of date. |
| SessionEntitledTimeExceeded | 3237093645 | 0xC0F2210D | The entitled session time has been exceeded. |
| AuthFailure | 3237093646 | 0xC0F2210E | Authentication failed. |
| InvalidAuthenticationMalformed | 3237093647 | 0xC0F2210F | The authentication token is malformed. |
| InvalidAuthenticationExpired | 3237093648 | 0xC0F22110 | The authentication token has expired. |
| InvalidAuthenticationNotFound | 3237093649 | 0xC0F22111 | The authentication token was not found. |
| EulaUnAccepted | 3237093655 | 0xC0F22117 | The EULA has not been accepted. |
| MaintenanceStatus | 3237093656 | 0xC0F22118 | The system is under maintenance. |
| ServiceUnAvailable | 3237093657 | 0xC0F22119 | The service is unavailable. |
| SteamGuardRequired | 3237093658 | 0xC0F2211A | Steam Guard is required. |
| SteamLoginRequired | 3237093659 | 0xC0F2211B | Steam login is required. |
| SteamGuardInvalid | 3237093660 | 0xC0F2211C | The Steam Guard token is invalid. |
| SteamProfilePrivate | 3237093661 | 0xC0F2211D | The Steam profile is private. |
| InvalidCountryCode | 3237093662 | 0xC0F2211E | The country code is invalid. |
| InvalidLanguageCode | 3237093663 | 0xC0F2211F | The language code is invalid. |
| MissingCountryCode | 3237093664 | 0xC0F22120 | The country code is missing. |
| MissingLanguageCode | 3237093665 | 0xC0F22121 | The language code is missing. |
| SessionNotPaused | 3237093666 | 0xC0F22122 | The session is not paused. |
| EmailNotVerified | 3237093667 | 0xC0F22123 | The email address is not verified. |
| InvalidAuthenticationUnsupportedProtocol | 3237093668 | 0xC0F22124 | The authentication protocol is unsupported. |
| InvalidAuthenticationUnknownToken | 3237093669 | 0xC0F22125 | The authentication token is unknown. |
| InvalidAuthenticationCredentials | 3237093670 | 0xC0F22126 | The authentication credentials are invalid. |
| SessionNotPlaying | 3237093671 | 0xC0F22127 | The session is not in a playing state. |
| InvalidServiceResponse | 3237093672 | 0xC0F22128 | The service response is invalid. |
| NotEnoughCredits | 3237093675 | 0xC0F2212B | There are not enough credits. |
| InvitationOnlyRegistration | 3237093676 | 0xC0F2212C | Registration is by invitation only. |
| RegionNotSupportedForRegistration | 3237093677 | 0xC0F2212D | The region is not supported for registration. |
| DeviceIdAlreadyUsed | 3237093679 | 0xC0F2212F | The device ID is already in use. |
| ServiceNotExist | 3237093680 | 0xC0F22130 | The requested service does not exist. |
| SessionExpired | 3237093681 | 0xC0F22131 | The session has expired. |
| ForwardingZoneOutOfCapacity | 3237093683 | 0xC0F22133 | The forwarding zone is out of capacity. |
| RegionNotSupportedIndefinitely | 3237093684 | 0xC0F22134 | The region is not supported indefinitely. |
| RegionBanned | 3237093685 | 0xC0F22135 | The region is banned. |
| RegionOnHoldForFree | 3237093686 | 0xC0F22136 | The region is on hold for free users. |
| RegionOnHoldForPaid | 3237093687 | 0xC0F22137 | The region is on hold for paid users. |
| ResourcePoolNotConfigured | 3237093689 | 0xC0F22139 | The resource pool is not configured. |
| InsufficientVmCapacity | 3237093690 | 0xC0F2213A | There is insufficient VM capacity. |
| InsufficientRouteCapacity | 3237093691 | 0xC0F2213B | There is insufficient route capacity. |
| InsufficientScratchSpaceCapacity | 3237093692 | 0xC0F2213C | There is insufficient scratch space capacity. |
| RegionNotSupportedForStreaming | 3237093695 | 0xC0F2213F | The region is not supported for streaming. |
| SessionForwardRequestAllocationTimeExpired | 3237093696 | 0xC0F22140 | The session forward request allocation time has expired. |
| SessionForwardGameBinariesNotAvailable | 3237093697 | 0xC0F22141 | The game binaries are not available for session forwarding. |
| GameBinariesNotAvailableInRegion | 3237093698 | 0xC0F22142 | The game binaries are not available in the region. |
| UekRetrievalFailed | 3237093699 | 0xC0F22143 | UEK retrieval failed. |
| EntitlementFailureForResource | 3237093700 | 0xC0F22144 | Entitlement failure for the requested resource. |
| SessionRemovedFromQueueMaintenance | 3237093703 | 0xC0F22147 | The session was removed from the queue due to maintenance. |
| ZoneMaintenanceStatus | 3237093704 | 0xC0F22148 | The zone is under maintenance. |
| GuestModeCampaignDisabled | 3237093705 | 0xC0F22149 | Guest mode campaign is disabled. |
| RegionNotSupportedAnonymousAccess | 3237093706 | 0xC0F2214A | The region does not support anonymous access. |
| InstanceTypeNotSupportedInSingleRegion | 3237093707 | 0xC0F2214B | The instance type is not supported in the single region. |
| InvalidZoneForQueuedSession | 3237093710 | 0xC0F2214E | The zone is invalid for the queued session. |
| SessionWaitingAdsTimeExpired | 3237093711 | 0xC0F2214F | The session waiting ads time has expired. |
| UserCancelledWatchingAds | 3237093712 | 0xC0F22150 | The user cancelled watching ads. |
| StreamingNotAllowedInLimitedMode | 3237093713 | 0xC0F22151 | Streaming is not allowed in limited mode. |
| ForwardRequestJPMFailed | 3237093714 | 0xC0F22152 | The forward request to JPM failed. |
| MaxSessionNumberLimitExceeded | 3237093715 | 0xC0F22153 | The maximum session number limit has been exceeded. |
| GuestModePartnerCapacityDisabled | 3237093716 | 0xC0F22154 | Guest mode partner capacity is disabled. |
| SessionRejectedNoCapacity | 3237093717 | 0xC0F22155 | The session was rejected due to no capacity. |
| SessionInsufficientPlayabilityLevel | 3237093718 | 0xC0F22156 | The session has insufficient playability level. |
| StreamerDataChannelClosing | 15867907 | 0xF22003 | The streamer data channel is closing. |
| WebPageClosed | 15867912 | 0xF22008 | The web page was closed. |
| ClientDisconnectedUserIdle | 15867913 | 0xF22009 | The client was disconnected due to user inactivity. |
| UnhandledException | 3237093392 | 0xC0F22010 | An unhandled exception occurred. |
| StreamerNoPeerInfo | 3237093912 | 0xC0F22218 | No peer info found. |
| InvalidAppIdNotAvailable | 3237093651 | 0xC0F22113 | Requested app is not available. |
| InvalidAppIdNotFound | 3237093652 | 0xC0F22114 | Requested app is not found. |
| InvalidSessionIdMalformed | 3237093653 | 0xC0F22115 | The session ID is not formatted correctly. |
| InvalidSessionIdNotFound | 3237093654 | 0xC0F22116 | The requested session ID does not exist. |
| MemberTerminated | 3237093702 | 0xC0F22146 | Member terminated. |
| StreamerNetworkError | 3237093892 | 0xC0F22204 | Peer connection closed due to network error. |
| StreamerReConnectionFailed | 3237093899 | 0xC0F2220B | Streaming reconnection failed. |
| StreamerSetSDPFailure | 3237093902 | 0xC0F2220E | Peers could not be configured with SDP. |
| StreamerNoLocalCandidates | 3237093903 | 0xC0F2220F | No local ICE candidate for streaming. |
| StreamerNoRemoteCandidates | 3237093904 | 0xC0F22210 | No remote ICE candidate for streaming. |
| StreamerNoVideoTrack | 3237093905 | 0xC0F22211 | Video track is not received from remote. |
| StreamerNoTracksReceivedInSdp | 3237093909 | 0xC0F22215 | No track is received from the remote. |
| StreamerNvstSdpFailure | 3237093910 | 0xC0F22216 | Generic failure related to SDP. |
| StreamerNvstSdpParseFailure | 3237093911 | 0xC0F22217 | Offer SDP could not be parsed. |
| StreamerNoOffer | 3237093913 | 0xC0F22219 | No offer is received from remote. |
| StreamerNoAudioTrack | 3237093914 | 0xC0F2221A | No audio track is received from remote. |
| StreamerInvalidRemoteConfigOverride | 3237093915 | 0xC0F2221B | Invalid NVST config present in remote config provided overrides. |
| StreamerInvalidServerOverride | 3237093916 | 0xC0F2221C | Invalid NVST config present in server provided overrides. |
| StreamerInvalidClientOverride | 3237093917 | 0xC0F2221D | Invalid NVST config present in client provided overrides. |
| StreamerConfigUpdateFailure | 3237093918 | 0xC0F2221E | Remote offer SDP could not be updated to client local NVST config. |
| StreamerInputChannelNotOpen | 3237093919 | 0xC0F2221F | Input channel is not opened and suspended on connecting state. |
| StreamerCursorChannelNotOpen | 3237093920 | 0xC0F22220 | Cursor channel is not opened and suspended on connecting state. |
| StreamerControlChannelNotOpen | 3237093921 | 0xC0F22221 | Control channel is not opened and suspended on connecting state. |
| StreamerVideoAdapterInitTimeOut | 3237093922 | 0xC0F22222 | Client timed-out while waiting for server to initialize video adapter. |
| StreamerVideoFrameProviderInitTimeOut | 3237093923 | 0xC0F22223 | Client timed-out while waiting for server to initialize video frame provider. |
| StreamerVideoEncoderInitTimeOut | 3237093924 | 0xC0F22224 | Client timed-out while waiting for server to initialize video encoder. |
| StreamerVideoSetupTimeOut | 3237093925 | 0xC0F22225 | Client timed-out while waiting for server to setup video pipeline. |
| StreamerNoStunResponsesReceived | 3237093926 | 0xC0F22226 | Client sent STUN requests but did not receive any responses from the server. |
| StreamerNoNominatedCandidatePairs | 3237093927 | 0xC0F22227 | No ICE candidate pairs were nominated. |
| StreamerNoSucceededCandidatePairs | 3237093928 | 0xC0F22228 | No ICE candidate pairs passed all checks. |
| StreamPartiallyReliableInputChannelError | 3237093929 | 0xC0F22229 | Partially reliable input channel setup error. |
| StreamerPartiallyReliableInputChannelNotOpen | 3237093936 | 0xC0F22230 | Partially reliable input channel is not opened and suspended on connecting state. |
| StreamerNeedAudioElement | 3237093937 | 0xC0F22231 | An expected audio HTML element is missing. |
| StreamerInvalidVideoSettings | 3237093938 | 0xC0F22232 | An invalid combination of streaming settings was requested. |
| StreamerNeedVideoElement | 3237093939 | 0xC0F22233 | One or more of the expected video elements could not be found. |
| StreamerVideoDecoderUnrecoverableBitstream | 3237093940 | 0xC0F22234 | The video decoder encountered an unrecoverable bitstream error. |
| StreamerHighPLICount | 3237093941 | 0xC0F22235 | The video decoder encountered a high PLI count. |
| StreamerNoVideoFramePresented | 3237093942 | 0xC0F22236 | The video media player encountered no video frame presented. |
| StreamerNoVideoFrameRendered | 3237093943 | 0xC0F22237 | The video media player encountered no video frame rendered. |
| SystemSleepDuringSessionSetup | 15867909 | 0xF22005 | Session setup ended as device went to sleep. |
| PauseSession | 15867910 | 0xF22006 | Session was paused. |
| DelayedSessionError | 15867911 | 0xF22007 | Delayed session error (saved in database for next session). |
| ServerDisconnectedNetworkTimedOut | 3237094158 | 0xC0F2230E | Stream disconnected from server, NetworkTimedOut. |
| ServerDisconnectedPeerRemovedByServer | 3237094159 | 0xC0F2230F | Stream disconnected from server, PeerRemovedByServer. |
| ServerDisconnectedUnknownError | 3237094160 | 0xC0F22310 | Stream disconnected from server, UnknownError. |
| ServerDisconnectedPeerRemovedBeforeStream | 3237094161 | 0xC0F22311 | Stream disconnected from server, PeerRemovedBeforeStream. |
| ServerDisconnectedHotKey | 15868705 | 0xF22321 | Stream disconnected from server due to hot key / game focus change. |
| ServerDisconnectedCodeIntegrityViolation | 15868715 | 0xF2232B | Stream disconnected from server, CodeIntegrityViolation. |
| ServerDisconnectedUnauthorizedActivityDetected | 15868716 | 0xF2232C | Stream disconnected from server, UnauthorizedActivityDetected. |
| ServerDisconnectedProtectedContent | 15868718 | 0xF2232E | Stream disconnected from server, ProtectedContent. |
| ServerDisconnectedDisplayTopologyChanged | 15868719 | 0xF2232F | Stream disconnected from server, DisplayTopologyChanged. |
| ServerDisconnectedAbruptly | 15868688 | 0xF22310 | Streaming terminated due to server unintended termination. |
| ServerDisconnectedMaintenanceMode | 15868745 | 0xF22349 | This server is going offline for scheduled maintenance. |
| ServerDisconnectedMultipleTab | 15868752 | 0xF22350 | Stream disconnected due to second session launch in another browser tab. |
| InvalidVideoElement | 3237094400 | 0xC0F22400 | Invalid video element for streaming. |
| InvalidAudioElement | 3237094401 | 0xC0F22401 | Invalid audio element for streaming. |
| WebSocketClosed | 3237097472 | 0xC0F23000 | The websocket is closed. |
| WebSocketNormalClosure | 3237101567 | 0xC0F23FFF | The connection successfully completed. |
| WebSocketGoingAway | 3237101566 | 0xC0F23FFE | The endpoint is going away. |
| WebSocketProtocolError | 3237101565 | 0xC0F23FFD | The endpoint is terminating the connection due to a protocol error. |
| WebSocketUnsupportedData | 3237101564 | 0xC0F23FFC | The connection is being terminated due to unsupported data type. |
| WebSocketNoStatusRcvd | 3237101562 | 0xC0F23FFA | No status code was provided even though one was expected. |
| WebSocketInvalidFramePayloadData | 3237101560 | 0xC0F23FF8 | The endpoint is terminating the connection due to inconsistent data. |
| WebSocketPolicyViolation | 3237101559 | 0xC0F23FF7 | The endpoint is terminating the connection due to policy violation. |
| WebSocketMessageTooBig | 3237101558 | 0xC0F23FF6 | The endpoint is terminating the connection because a data frame was too large. |
| WebSocketMandatoryExt | 3237101557 | 0xC0F23FF5 | The client is terminating the connection due to missing extension negotiation. |
| WebSocketInternalError | 3237101556 | 0xC0F23FF4 | The server is terminating the connection due to an unexpected condition. |
| WebSocketServiceRestart | 3237101555 | 0xC0F23FF3 | The server is terminating the connection because it is restarting. |
| WebSocketTryAgainLater | 3237101554 | 0xC0F23FF2 | The server is terminating the connection due to temporary overload. |
| WebSocketBadGateway | 3237101553 | 0xC0F23FF1 | WebSocket bad gateway error. |
| WebSocketTLSHandshakeFailure | 3237101552 | 0xC0F23FF0 | WebSocket TLS handshake failure. |
| WebSocketUnauthorized | 3237101551 | 0xC0F23FEF | WebSocket unauthorized connection. |
| WebSocketForbidden | 3237101550 | 0xC0F23FEE | WebSocket forbidden connection. |
| WebSocketTimeout | 3237101549 | 0xC0F23FED | WebSocket connection timeout. |
| ForwardRequestLOFNFailed | 3237093719 | 0xC0F22157 | Forward request to LOFN failed. |
| InvalidTransportRequest | 3237093720 | 0xC0F22158 | The session was rejected due to invalid transport request. |
| UserStorageNotAvailable | 3237093721 | 0xC0F22159 | The session was terminated due to user's permanent storage being unavailable. |
| GfnStorageNotAvailable | 3237093722 | 0xC0F2215A | The session was terminated due to GFN ephemeral storage being unavailable. |
| Success | 15859712 | 0xF20000 | Operation completed successfully. |
| SessionServerErrorBegin | 3237093632 | 0xC0F22100 | Start of PM error range. |
| SessionServerErrorEnd | 3237093887 | 0xC0F221FF | End of PM error range. |
| StreamerErrorCategory | 3237093888 | 0xC0F22200 | Streamer error category. |
