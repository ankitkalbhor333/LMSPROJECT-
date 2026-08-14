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

export const createLiveKitToken = ({
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

  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: String(identity || "guest"),
    ttl: ttlSeconds,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe,
    canPublishData,
    canUpdateOwnMetadata: true,
  });

  return {
    token: token.toJwt(),
    url: LIVEKIT_URL,
    roomName,
  };
};

export const getLiveKitConfig = () => ({
  url: LIVEKIT_URL,
  apiKey: LIVEKIT_API_KEY,
  hasCredentials: Boolean(LIVEKIT_API_KEY && LIVEKIT_API_SECRET),
});
