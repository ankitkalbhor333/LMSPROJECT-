import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Room, RoomEvent } from "livekit-client";
import {
  getLiveClassById,
  getLiveClassToken,
  joinLiveClass,
  leaveLiveClass,
} from "../utils/liveClassApi";

const decodeDataMessage = (payload) => {
  if (!payload) return null;

  try {
    if (typeof payload === "string") {
      return JSON.parse(payload);
    }

    const decoded = new TextDecoder().decode(payload);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

function StudentLiveClass() {
  const { id } = useParams();
  const roomRef = useRef(null);
  const teacherVideoRef = useRef(null);
  const [classData, setClassData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "System", text: "You have joined the live class. Please stay muted until your teacher enables your mic.", time: "Now" },
  ]);
  const [messageText, setMessageText] = useState("");
  const [raisingHand, setRaisingHand] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);

  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);
  const classStatus = classData?.status || "scheduled";
  const classIsJoinable = ["scheduled", "live"].includes(classStatus);

  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoading(true);
        const response = await getLiveClassById(id);
        setClassData(response.data.data || response.data || null);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this live class.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadClass();
    }

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, [id]);

  const syncParticipants = (room) => {
    const list = Array.from(room.remoteParticipants.values()).map((participant) => ({
      identity: participant.identity,
      name: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      videoEnabled: participant.videoTrackPublications.size > 0,
      audioEnabled: participant.audioTrackPublications.size > 0,
    }));

    setParticipants(list);
  };

  const publishRoomMessage = (message) => {
    if (!roomRef.current) return;

    roomRef.current.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(message)),
      { reliable: true }
    );
  };

  const handleIncomingRoomData = (payload, participant) => {
    const message = decodeDataMessage(payload);
    if (!message) return;

    if (message.type === "chat") {
      const senderName = participant?.name || participant?.identity || message.sender || "Teacher";
      setChatMessages((prev) => [
        ...prev,
        {
          sender: senderName,
          text: message.text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      return;
    }

    if (message.type === "raise_hand") {
      const participantName = participant?.name || participant?.identity || message.sender || "Student";
      setRaisedHands((prev) => {
        const next = new Set(prev);
        if (message.raised) {
          next.add(participantName);
        } else {
          next.delete(participantName);
        }
        return [...next];
      });
    }
  };

  const joinRoom = async () => {
    if (!id) return;

    if (!classIsJoinable) {
      setError("This live class is not currently accepting new students.");
      return;
    }

    try {
      setJoining(true);
      setError("");

      await joinLiveClass(id);
      const tokenResponse = await getLiveClassToken(id);
      const tokenData = tokenResponse.data.data || tokenResponse.data;

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          simulcast: false,
        },
      });

      room.on(RoomEvent.ParticipantConnected, () => syncParticipants(room));
      room.on(RoomEvent.ParticipantDisconnected, () => syncParticipants(room));
      room.on(RoomEvent.ConnectionStateChanged, () => {
        setConnected(room.state === "connected");
      });
      room.on(RoomEvent.DataReceived, handleIncomingRoomData);

      await room.connect(tokenData.url, tokenData.token);

      roomRef.current = room;
      setConnected(true);
      syncParticipants(room);

      room.remoteParticipants.forEach((participant) => {
        if (participant.videoTrackPublications?.size) {
          participant.videoTrackPublications.forEach((publication) => {
            if (publication.track) {
              publication.track.attach(teacherVideoRef.current);
            }
          });
        }
      });
    } catch (err) {
      console.error("Student room join failed:", err);
      setError(err.response?.data?.message || "Unable to join the class room.");
    } finally {
      setJoining(false);
    }
  };

  const leaveRoom = async () => {
    try {
      if (id) {
        await leaveLiveClass(id);
      }
    } catch (err) {
      console.error("Error leaving class:", err);
    } finally {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      setConnected(false);
      setParticipants([]);
    }
  };

  const handleRaiseHand = () => {
    const nextValue = !raisingHand;
    setRaisingHand(nextValue);

    publishRoomMessage({
      type: "raise_hand",
      sender: "You",
      raised: nextValue,
    });

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: nextValue ? "You raised your hand to ask a question." : "You lowered your hand.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const text = messageText.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    publishRoomMessage({
      type: "chat",
      sender: "You",
      text,
    });

    setChatMessages((prev) => [...prev, { sender: "You", text, time: timestamp }]);
    setMessageText("");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>
          <p>Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb" }}>
        <div style={{ maxWidth: 520, background: "#fff", borderRadius: 18, padding: 30, boxShadow: "0 16px 40px rgba(15,23,42,.08)" }}>
          <h2 style={{ marginBottom: 12 }}>Live class unavailable</h2>
          <p style={{ color: "#475569" }}>{error}</p>
          <button onClick={() => window.history.back()} style={primaryButtonStyle}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f7fb", minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, color: "#f43f5e", fontWeight: 800 }}>
              Student Classroom
            </div>
            <h1 style={{ marginTop: 8, fontSize: "clamp(28px, 3vw, 38px)", marginBottom: 0, color: "#0f172a" }}>
              {classData?.title || "Live Class"}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={secondaryButtonStyle}>{connected ? "Connected" : classStatus === "ended" ? "Ended" : classStatus === "cancelled" ? "Cancelled" : "Offline"}</button>
            <button
              style={{
                ...primaryButtonStyle,
                opacity: !classIsJoinable && !connected ? 0.5 : 1,
                cursor: !classIsJoinable && !connected ? "not-allowed" : "pointer",
              }}
              onClick={connected ? leaveRoom : joinRoom}
              disabled={!classIsJoinable && !connected}
            >
              {joining ? "Joining..." : connected ? "Leave Class" : classStatus === "ended" ? "Class Ended" : classStatus === "cancelled" ? "Class Cancelled" : "Join Class"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(260px, 0.8fr)", gap: 20 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15, 23, 42, .08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>{classData?.title || "Class Session"}</div>
                <div style={{ color: "#64748b", fontSize: 14 }}>
                  {new Date(classData?.scheduledAt || Date.now()).toLocaleString()} · {classData?.duration || 60} min
                </div>
                <div style={{ marginTop: 8, color: classStatus === "live" ? "#16a34a" : classStatus === "ended" ? "#dc2626" : "#64748b", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 1.1 }}>
                  Status: {classStatus}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#0f172a", fontWeight: 700 }}>
                <span style={{ width: 8, height: 8, background: connected ? "#22c55e" : "#94a3b8", borderRadius: "50%", display: "inline-block" }} />
                {participantCount} watching
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 18, padding: 18, minHeight: 380, position: "relative" }}>
              {connected ? (
                <video
                  ref={teacherVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", minHeight: 330, objectFit: "cover", borderRadius: 14, background: "#020817" }}
                />
              ) : (
                <div style={{ minHeight: 330, display: "grid", placeItems: "center", color: "#e2e8f0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 42, marginBottom: 10 }}>🎥</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Waiting for the teacher to start</div>
                    <div style={{ color: "#cbd5e1", marginTop: 6 }}>Join the class when it begins.</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18, alignItems: "center" }}>
              <button style={{ ...actionButtonStyle, background: raisingHand ? "#f59e0b" : "#e2e8f0", color: raisingHand ? "#fff" : "#0f172a" }} onClick={handleRaiseHand}>
                {raisingHand ? "✋ Hand Raised" : "✋ Raise Hand"}
              </button>
              <button style={{ ...actionButtonStyle, background: "#e2e8f0", color: "#0f172a" }}>
                🔊 Audio On
              </button>
              <button style={{ ...actionButtonStyle, background: "#0f172a", color: "#fff" }}>
                💬 Chat
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) minmax(220px, 0.8fr)", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15,23,42,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>Participants</h3>
                <span style={{ color: "#475569", fontWeight: 700 }}>{participantCount}</span>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {participants.length === 0 ? (
                  <div style={{ color: "#64748b" }}>No other students connected yet.</div>
                ) : (
                  participants.map((participant, index) => (
                    <div key={`${participant.identity}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", borderRadius: 12, padding: "10px 12px" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{participant.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{participant.isSpeaking ? "Speaking" : "Watching"}</div>
                      </div>
                      <div>{participant.audioEnabled ? "🎤" : "🔇"}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15,23,42,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>Chat</h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>{chatMessages.length}</span>
              </div>

              <div style={{ height: 180, overflowY: "auto", background: "#f8fafc", borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
                {chatMessages.map((message, index) => (
                  <div key={`${message.sender}-${index}`}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>{message.sender} · {message.time}</div>
                    <div style={{ color: "#0f172a", fontSize: 14 }}>{message.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Send a message"
                  style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", outline: "none" }}
                />
                <button onClick={handleSendMessage} style={primaryButtonStyle}>Send</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 12,
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
};

const actionButtonStyle = {
  border: "none",
  borderRadius: 12,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

export default StudentLiveClass;
