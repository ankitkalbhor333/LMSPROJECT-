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
  const screenShareRef = useRef(null);
  const [classData, setClassData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "System", text: "You have joined the live class. Please stay muted until your teacher enables your mic.", time: "Now" },
  ]);
  const [messageText, setMessageText] = useState("");
  const [raisingHand, setRaisingHand] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]);
  const [studentPermissions, setStudentPermissions] = useState({ mic: false, camera: false });
  const [teacherVideoTrack, setTeacherVideoTrack] = useState(null);
  const [teacherScreenShareTrack, setTeacherScreenShareTrack] = useState(null);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);

  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);
  const classStatus = classData?.status || "scheduled";
  const classIsJoinable = ["scheduled", "live"].includes(classStatus);

  const persistSession = (sessionId) => {
    sessionStorage.setItem("lms-live-class-student-session", JSON.stringify({ id: sessionId, role: "student", timestamp: Date.now() }));
  };

  const clearSession = () => {
    sessionStorage.removeItem("lms-live-class-student-session");
  };

  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoading(true);
        const response = await getLiveClassById(id);
        const loadedClass = response.data.data || response.data || null;
        setClassData(loadedClass);

        const session = sessionStorage.getItem("lms-live-class-student-session");
        if (session && loadedClass?.status === "live") {
          try {
            const parsed = JSON.parse(session);
            if (parsed.id === id && Date.now() - parsed.timestamp < 1000 * 60 * 30) {
              joinRoom(true);
            }
          } catch (error) {
            console.warn("Failed to restore student session", error);
          }
        }
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const el = teacherVideoRef.current;
    if (el && teacherVideoTrack) {
      teacherVideoTrack.attach(el);
      return () => {
        teacherVideoTrack.detach(el);
      };
    }
  }, [teacherVideoTrack, connected]);

  useEffect(() => {
    const el = screenShareRef.current;
    if (el && teacherScreenShareTrack) {
      teacherScreenShareTrack.attach(el);
      return () => {
        teacherScreenShareTrack.detach(el);
      };
    }
  }, [teacherScreenShareTrack, screenShareActive]);

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

  const attachTrackToElement = (track, element) => {
    if (!track || !element) return;
    try {
      track.attach(element);
    } catch (error) {
      console.warn("Unable to attach remote track to element", error);
    }
  };

  const publishRoomMessage = (message) => {
    if (!roomRef.current) return;

    roomRef.current.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(message)),
      { reliable: true }
    );
  };

  const handleTrackSubscribed = (track, publication, participant) => {
    if (!track || !participant) return;

    if (track.kind === "video" && publication.source === "camera") {
      setTeacherVideoTrack(track);
      return;
    }

    if (track.kind === "video" && publication.source === "screen_share") {
      setScreenShareActive(true);
      setTeacherScreenShareTrack(track);
      return;
    }

    if (track.kind === "audio") {
      const el = track.attach();
      document.body.appendChild(el);
    }
  };

  const handleTrackUnsubscribed = (track, publication) => {
    if (publication?.source === "camera") {
      setTeacherVideoTrack(null);
    }

    if (publication?.source === "screen_share") {
      setScreenShareActive(false);
      setTeacherScreenShareTrack(null);
    }

    if (track.kind === "audio") {
      track.detach().forEach((el) => el.remove());
    }
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
      return;
    }

    if (message.type === "teacher_permission") {
      const isTargeted = message.targetIdentity === roomRef.current?.localParticipant?.identity || message.targetIdentity === "all";
      if (!isTargeted) return;

      const action = message.action;
      const enabled = message.enabled;

      setStudentPermissions((prev) => ({
        ...prev,
        [action]: enabled,
      }));

      const isMuted = (action === "mic" && !enabled) || (action === "mute" && !enabled);

      setChatMessages((prev) => [
        ...prev,
        {
          sender: "System",
          text: isMuted ? "Your microphone has been muted by the teacher." : "Your microphone has been re-enabled by the teacher.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      if (isMuted && roomRef.current) {
        roomRef.current.localParticipant.setMicrophoneEnabled(false);
        setMicEnabled(false);
      }
    }
  };

  const joinRoom = async (isResume = false) => {
    if (!id) return;

    if (!classIsJoinable) {
      setError("This live class is not currently accepting new students.");
      return;
    }

    try {
      setJoining(true);
      setError("");

      if (!isResume) {
        persistSession(id);
      }

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
      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      room.on(RoomEvent.ConnectionStateChanged, () => {
        setConnected(room.state === "connected");
      });
      room.on(RoomEvent.DataReceived, handleIncomingRoomData);

      await room.connect(tokenData.url, tokenData.token);

      roomRef.current = room;
      setConnected(true);
      syncParticipants(room);

      // Scan pre-existing tracks that are already subscribed
      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          if (publication.track) {
            handleTrackSubscribed(publication.track, publication, participant);
          }
        });
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
      setTeacherVideoTrack(null);
      setTeacherScreenShareTrack(null);
      setMicEnabled(false);
      setScreenShareActive(false);
      clearSession();
    }
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    if (!studentPermissions.mic) {
      alert("Your microphone is disabled by the teacher.");
      return;
    }

    try {
      const nextValue = !micEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextValue);
      setMicEnabled(nextValue);
    } catch (error) {
      console.error("Student mic toggle failed:", error);
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

  const toggleLayoutMode = () => {
    setLayoutMode((current) => (current === "horizontal" ? "vertical" : "horizontal"));
  };

  const toggleFullScreen = async () => {
    if (!stageRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await stageRef.current.requestFullscreen();
        setIsFullScreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullScreen(false);
      }
    } catch (error) {
      console.warn("Student fullscreen toggle failed:", error);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

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
    <div style={{ background: "#f4f7fb", minHeight: "100vh", padding: isMobile ? "16px 12px 60px" : "24px 16px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row", alignSelf: isMobile ? "stretch" : "auto" }}>
          <div>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1.2, color: "#f43f5e", fontWeight: 800 }}>
              Student Classroom
            </div>
            <h1 style={{ marginTop: 8, fontSize: "clamp(28px, 3vw, 38px)", marginBottom: 0, color: "#0f172a" }}>
              {classData?.title || "Live Class"}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
            <button
              type="button"
              onClick={toggleLayoutMode}
              style={{ ...secondaryButtonStyle, flex: isMobile ? "1 1 100%" : "initial" }}
            >
              {layoutMode === "horizontal" ? "Vertical View" : "Horizontal View"}
            </button>
            <button
              type="button"
              onClick={toggleFullScreen}
              style={{ ...secondaryButtonStyle, flex: isMobile ? "1 1 100%" : "initial" }}
            >
              {isFullScreen ? "Exit Full View" : "Full View"}
            </button>
            <button style={{ ...secondaryButtonStyle, flex: isMobile ? "1 1 100%" : "initial" }}>{connected ? "Connected" : classStatus === "ended" ? "Ended" : classStatus === "cancelled" ? "Cancelled" : "Offline"}</button>
            <button
              style={{
                ...primaryButtonStyle,
                opacity: !classIsJoinable && !connected ? 0.5 : 1,
                cursor: !classIsJoinable && !connected ? "not-allowed" : "pointer",
                flex: isMobile ? "1 1 100%" : "initial",
              }}
              onClick={connected ? leaveRoom : joinRoom}
              disabled={!classIsJoinable && !connected}
            >
              {joining ? "Joining..." : connected ? "Leave Class" : classStatus === "ended" ? "Class Ended" : classStatus === "cancelled" ? "Class Cancelled" : "Join Class"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.8fr) minmax(260px, 0.8fr)", gap: 20 }}>
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

            <div
              ref={stageRef}
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: 18,
                padding: 18,
                minHeight: 380,
                position: "relative",
                display: "grid",
                gridTemplateColumns: layoutMode === "horizontal" && screenShareActive ? "minmax(0, 1.8fr) minmax(180px, 0.9fr)" : "1fr",
                gap: 12,
                border: isFullScreen ? "2px solid rgba(99,102,241,0.7)" : "1px solid transparent",
              }}
            >
              {connected ? (
                <>
                  <div style={{ position: "relative", minHeight: 330, borderRadius: 14, overflow: "hidden" }}>
                    <video
                      ref={teacherVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: "100%", height: "100%", minHeight: 330, objectFit: "cover", borderRadius: 14, background: "#020817" }}
                    />
                  </div>

                  {screenShareActive && (
                    <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)", minHeight: 180 }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 10px", color: "#e2e8f0", fontWeight: 700 }}>
                        Teacher Screen Share
                      </div>
                      <video
                        ref={screenShareRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", height: "100%", minHeight: 180, objectFit: "contain", background: "#020817" }}
                      />
                    </div>
                  )}
                </>
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
              <button style={{ ...actionButtonStyle, background: raisingHand ? "#f59e0b" : "#e2e8f0", color: raisingHand ? "#fff" : "#0f172a", flex: isMobile ? "1 1 100%" : "initial" }} onClick={handleRaiseHand}>
                {raisingHand ? "✋ Hand Raised" : "✋ Raise Hand"}
              </button>
              <button
                onClick={toggleMic}
                style={{
                  ...actionButtonStyle,
                  background: micEnabled ? "#0f172a" : "#e2e8f0",
                  color: micEnabled ? "#fff" : "#0f172a",
                  flex: isMobile ? "1 1 100%" : "initial",
                }}
              >
                {micEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>
              <button style={{ ...actionButtonStyle, background: "#0f172a", color: "#fff", flex: isMobile ? "1 1 100%" : "initial" }}>
                💬 Chat
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateRows: isMobile ? "auto auto" : "minmax(0, 1fr) minmax(220px, 0.8fr)", gap: 20 }}>
            {!studentPermissions.mic && (
              <div style={{ background: "#fff7ed", color: "#9a5b00", borderRadius: 12, padding: "10px 12px", fontWeight: 700 }}>
                Your microphone is muted by the teacher.
              </div>
            )}

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
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {raisedHands.includes(participant.name) ? <span title="Raised hand">✋</span> : null}
                        <span>{participant.audioEnabled ? "🎤" : "🔇"}</span>
                      </div>
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

              <div style={{ display: "flex", gap: 8, marginTop: 12, flexDirection: isMobile ? "column" : "row" }}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Send a message"
                  style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", outline: "none", width: isMobile ? "100%" : "auto" }}
                />
                <button onClick={handleSendMessage} style={{ ...primaryButtonStyle, width: isMobile ? "100%" : "auto" }}>Send</button>
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
