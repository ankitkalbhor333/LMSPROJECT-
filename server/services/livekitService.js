import { AccessToken } from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL || "ws://localhost:7880";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "devsecret";

export const buildRoomName = ({ courseId, title, id }) => {
  const coursePart = String(courseId || "course").slice(-12) || "course";
  const titlePart = String(title || "class")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 24);
  const idPart = String(id || Date.now()).slice(-6);

  return `lms-${coursePart}-${titlePart || "class"}-${idPart}`;
};

export const createLiveKitToken = async ({
  identity,
  roomName,
  canPublish = false,
  canSubscribe = true,
  canPublishData = true,
  ttlSeconds = 60 * 60,
}) => {
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw new Error("LiveKit API credentials are not configured");
  }

  if (LIVEKIT_API_KEY === "your_api_key_here" || LIVEKIT_API_SECRET === "your_api_secret_here") {
    throw new Error("LiveKit API credentials are not set correctly. Please update .env with real credentials from https://console.livekit.io");
  }

  if (!roomName) {
    throw new Error("Room name is required");
  }

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: String(identity || "guest"),
    ttl: ttlSeconds,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: Boolean(canPublish),
    canSubscribe: Boolean(canSubscribe),
    canPublishData: Boolean(canPublishData),
    canUpdateOwnMetadata: true,
  });

  // IMPORTANT: toJwt() is async in livekit-server-sdk v2
  const jwtToken = await token.toJwt();
  
  if (!jwtToken || typeof jwtToken !== "string" || jwtToken.length === 0) {
    throw new Error("Failed to generate LiveKit token. Check API credentials are valid.");
  }

  return {
    token: jwtToken,
    url: LIVEKIT_URL,
    roomName,
  };
};

export const getLiveKitConfig = () => ({
  url: LIVEKIT_URL,
  apiKey: LIVEKIT_API_KEY,
  hasCredentials: Boolean(LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
});
