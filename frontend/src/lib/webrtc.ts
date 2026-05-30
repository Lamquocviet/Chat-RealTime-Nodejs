/**
 * WebRTC Utilities
 * Handle peer connection, stream management, etc.
 */

export const STUN_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export const peerConfig = {
  iceServers: STUN_SERVERS,
};

/**
 * Get user media (camera + microphone)
 */
export const getUserMedia = async (
  constraints = { audio: true, video: { width: 1280, height: 720 } }
) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return stream;
  } catch (error) {
    console.error("Lỗi khi lấy media:", error);
    throw new Error("Không thể truy cập camera/microphone. Vui lòng kiểm tra quyền.");
  }
};

/**
 * Stop all tracks in stream
 */
export const stopMediaStream = (stream: MediaStream | null) => {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};

/**
 * Toggle audio track
 */
export const toggleAudio = (stream: MediaStream | null, enabled: boolean) => {
  if (!stream) return;
  stream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
};

/**
 * Toggle video track
 */
export const toggleVideo = (stream: MediaStream | null, enabled: boolean) => {
  if (!stream) return;
  stream.getVideoTracks().forEach((track) => {
    track.enabled = enabled;
  });
};

/**
 * Create RTCPeerConnection
 */
export const createPeerConnection = (
  onICECandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const peerConnection = new RTCPeerConnection(peerConfig);

  // Xử lý ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onICECandidate(event.candidate);
    }
  };

  // Xử lý remote track
  peerConnection.ontrack = onTrack;

  // Log connection state
  peerConnection.onconnectionstatechange = () => {
    console.log("Peer Connection state:", peerConnection.connectionState);
  };

  return peerConnection;
};

/**
 * Add local stream tracks to peer connection
 */
export const addStreamToPeerConnection = (
  peerConnection: RTCPeerConnection,
  stream: MediaStream
) => {
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
};

/**
 * Create and send offer
 */
export const createOffer = async (
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const offer = await peerConnection.createOffer({
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
  });

  await peerConnection.setLocalDescription(offer);
  return offer;
};

/**
 * Create and send answer
 */
export const createAnswer = async (
  peerConnection: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> => {
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

/**
 * Set remote description (offer hoặc answer)
 */
export const setRemoteDescription = async (
  peerConnection: RTCPeerConnection,
  description: RTCSessionDescriptionInit
) => {
  try {
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  } catch (error) {
    console.error("Lỗi khi set remote description:", error);
    throw error;
  }
};

/**
 * Add ICE candidate
 */
export const addICECandidate = async (
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit
) => {
  try {
    if (candidate) {
      await peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );
    }
  } catch (error) {
    console.error("Lỗi khi add ICE candidate:", error);
  }
};

/**
 * Close peer connection
 */
export const closePeerConnection = (peerConnection: RTCPeerConnection | null) => {
  if (!peerConnection) return;
  
  peerConnection.close();
};
