import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Room, RoomEvent } from "livekit-client";
import {
  getLiveClassById,
  getLiveClassToken,
  joinLiveClass,
  leaveLiveClass,
} from "../utils/liveClassApi";
import "./StudentLiveClass.css";

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
  const navigate = useNavigate();

  // ============ ALL HOOKS AT TOP LEVEL ============
  
  // Refs
  const roomRef = useRef(null);
  const teacherVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const stageRef = useRef(null);
  const chatEndRef = useRef(null);

  // State
  const [classData, setClassData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  const [localQuality, setLocalQuality] = useState("unknown");
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
  const [layoutMode, setLayoutMode] = useState("horizontal");
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Memos
  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);

  // Derived values
  const classStatus = classData?.status || "scheduled";
  const classIsJoinable = ["scheduled", "live"].includes(classStatus);

  const persistSession = (sessionId) => {
    sessionStorage.setItem("lms-live-class-student-session", JSON.stringify({ id: sessionId, role: "student", timestamp: Date.now() }));
  };

  const clearSession = () => {
    sessionStorage.removeItem("lms-live-class-student-session");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    let isMounted = true;

    const loadClass = async () => {
      try {
        setLoading(true);
        const response = await getLiveClassById(id);
        const loadedClass = response.data.data || response.data || null;
        
        if (!isMounted) return;
        setClassData(loadedClass);

        const session = sessionStorage.getItem("lms-live-class-student-session");
        if (session && loadedClass?.status === "live") {
          try {
            const parsed = JSON.parse(session);
            if (parsed.id === id && Date.now() - parsed.timestamp < 1000 * 60 * 30) {
              if (isMounted) {
                joinRoom(true);
              }
            }
          } catch (error) {
            console.warn("Failed to restore student session", error);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.data?.message || "Unable to load this live class.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      loadClass();
    }

    return () => {
      isMounted = false;
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
        try {
          teacherVideoTrack.detach(el);
        } catch (error) {
          console.warn("Failed to detach teacher video", error);
        }
      };
    }
  }, [teacherVideoTrack]);

  useEffect(() => {
    const el = screenShareRef.current;
    if (el && teacherScreenShareTrack) {
      teacherScreenShareTrack.attach(el);
      return () => {
        try {
          teacherScreenShareTrack.detach(el);
        } catch (error) {
          console.warn("Failed to detach screen share", error);
        }
      };
    }
  }, [teacherScreenShareTrack]);

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
      room.on(RoomEvent.ConnectionQualityChanged, () => {
        if (room.localParticipant) {
          setLocalQuality(room.localParticipant.connectionQuality);
        }
      });
      room.on(RoomEvent.DataReceived, handleIncomingRoomData);

      await room.connect(tokenData.url, tokenData.token);

      roomRef.current = room;
      setConnected(true);
      if (room.localParticipant) {
        setLocalQuality(room.localParticipant.connectionQuality);
      }
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
      
      // Batch all state updates to prevent hook order issues
      setConnected(false);
      setLocalQuality("unknown");
      setParticipants([]);
      setTeacherVideoTrack(null);
      setTeacherScreenShareTrack(null);
      setMicEnabled(false);
      setScreenShareActive(false);
      clearSession();
      navigate("/", { replace: true });
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
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.warn("Student fullscreen toggle failed:", error);
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        try {
          roomRef.current.disconnect();
        } catch (error) {
          console.warn("Error disconnecting room on unmount:", error);
        }
        roomRef.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="error-screen-container">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>
          <p style={{ color: "#475569", fontWeight: 600 }}>Loading class details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen-container">
        <div className="error-screen-card">
          <div className="error-screen-icon">⚠️</div>
          <h2 className="error-screen-title">Live Class Unavailable</h2>
          <p className="error-screen-message">{error}</p>
          <div className="troubleshoot-list">
            <strong>Troubleshooting tips:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>Confirm if the class has started or is currently active.</li>
              <li>Check your internet access and refresh the webpage.</li>
              <li>Ensure you are logged into the correct student account.</li>
            </ul>
          </div>
          <button onClick={() => window.history.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-class-container">
      <div className="live-class-wrapper">

        {/* Connection Quality Warning Banner */}
        {connected && (localQuality === "poor" || localQuality === "unknown") && (
          <div className="warning-banner" style={{ background: "#fff7ed", color: "#c2410c", borderLeft: "4px solid #f97316", padding: "12px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div>
              ⚠️ Your connection quality is poor. You might experience video lag or audio stuttering.
            </div>
            <button onClick={() => { leaveRoom(); setTimeout(() => joinRoom(), 1000); }} className="btn-primary" style={{ padding: "6px 10px", fontSize: 12, background: "#f97316" }}>
              Reconnect
            </button>
          </div>
        )}

        <div className="live-class-header">
          <div className="live-class-title-section">
            <span className="live-class-role-badge">Student Classroom</span>
            <h1 className="live-class-title">
              {classData?.title || "Live Class"}
            </h1>
          </div>

          <div className="live-class-control-group">
            <button
              type="button"
              onClick={toggleLayoutMode}
              className="btn-secondary"
            >
              {layoutMode === "horizontal" ? "Vertical View" : "Horizontal View"}
            </button>
            <button
              type="button"
              onClick={toggleFullScreen}
              className="btn-secondary"
            >
              {isFullScreen ? "Exit Full View" : "Full View"}
            </button>
            <button className="btn-secondary" disabled>
              {connected ? "🟢 Connected" : classStatus === "ended" ? "🔴 Ended" : classStatus === "cancelled" ? "⚫ Cancelled" : "⏳ Offline"}
            </button>
            <button
              className="btn-primary"
              style={{
                opacity: !classIsJoinable && !connected ? 0.5 : 1,
                cursor: !classIsJoinable && !connected ? "not-allowed" : "pointer"
              }}
              onClick={connected ? leaveRoom : joinRoom}
              disabled={!classIsJoinable && !connected}
            >
              {joining ? "Joining..." : connected ? "Leave Class" : classStatus === "ended" ? "Class Ended" : classStatus === "cancelled" ? "Class Cancelled" : "Join Class"}
            </button>
          </div>
        </div>

        <div className="live-class-grid">
          <div className="glass-card">
            <div className="stage-card-header">
              <div className="stage-card-info">
                <div className="stage-card-title">{classData?.title || "Class Session"}</div>
                <div className="stage-card-meta">
                  {new Date(classData?.scheduledAt || Date.now()).toLocaleString()} · {classData?.duration || 60} min
                </div>
                <span className={`stage-status-badge status-${classStatus}`}>
                  Status: {classStatus}
                </span>
              </div>
              <div className="stage-stats">
                <span className={`pulse-dot ${connected ? "connected" : "disconnected"}`} />
                {participantCount} watching
              </div>
            </div>

            <div
              ref={stageRef}
              className={`video-stage ${isFullScreen ? "fullscreen-active" : ""} ${
                layoutMode === "horizontal" && screenShareActive ? "split-layout" : "single-layout"
              }`}
            >
              {connected ? (
                <>
                  <div className="primary-video-wrapper">
                    {teacherVideoTrack ? (
                      <video
                        ref={teacherVideoRef}
                        autoPlay
                        playsInline
                        className="video-feed"
                      />
                    ) : (
                      <div className="video-off-placeholder">
                        <div className="video-off-avatar">🧑‍🏫</div>
                        <div style={{ fontWeight: 700 }}>Teacher camera is off</div>
                        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>Listening to audio broadcast...</div>
                      </div>
                    )}
                  </div>

                  {screenShareActive && (
                    <div className="screenshare-video-wrapper">
                      <div className="screenshare-header">
                        🖥️ Teacher Screen Share
                      </div>
                      {teacherScreenShareTrack ? (
                        <video
                          ref={screenShareRef}
                          autoPlay
                          playsInline
                          className="screenshare-video"
                        />
                      ) : (
                        <div style={{ minHeight: 180, display: "grid", placeItems: "center", background: "#020817", color: "#64748b" }}>
                          Loading screen share...
                        </div>
                      )}
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

            <div className="controls-bar">
              <button
                className="btn-action"
                style={{
                  background: raisingHand ? "#f59e0b" : "#e2e8f0",
                  color: raisingHand ? "#fff" : "#0f172a"
                }}
                onClick={handleRaiseHand}
                disabled={!connected}
              >
                {raisingHand ? "✋ Hand Raised" : "✋ Raise Hand"}
              </button>
              <button
                onClick={toggleMic}
                className="btn-action"
                style={{
                  background: micEnabled ? "#0f172a" : "#e2e8f0",
                  color: micEnabled ? "#fff" : "#0f172a"
                }}
                disabled={!connected}
              >
                {micEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>
            </div>
          </div>

          <div className="right-panels-grid">
            {!studentPermissions.mic && connected && (
              <div className="warning-alert-banner">
                🔇 Your microphone is muted by the teacher.
              </div>
            )}

            {/* Participants Card */}
            <div className="glass-card">
              <div className="panel-header">
                <h3>Participants</h3>
                <span className="panel-count">{participantCount}</span>
              </div>

              <div className="participants-list">
                {participants.length === 0 ? (
                  <div style={{ color: "#64748b" }}>No other students connected yet.</div>
                ) : (
                  participants.map((participant, index) => (
                    <div key={`${participant.identity}-${index}`} className="participant-row">
                      <div>
                        <div className="participant-info-name">{participant.name}</div>
                        <div className="participant-info-status">{participant.isSpeaking ? "🎤 Speaking" : "👀 Watching"}</div>
                      </div>
                      <div className="participant-icons">
                        {raisedHands.includes(participant.name) ? <span title="Raised hand" style={{ fontSize: 14 }}>✋</span> : null}
                        <span>{participant.audioEnabled ? "🎤" : "🔇"}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Card */}
            <div className="glass-card">
              <div className="panel-header">
                <h3>Chat</h3>
                <span className="panel-count">{chatMessages.length}</span>
              </div>

              <div className="chat-container">
                {chatMessages.map((message, index) => {
                  let bubbleClass = "student";
                  if (message.sender === "Teacher" || message.sender === "You") {
                    bubbleClass = "teacher";
                  } else if (message.sender === "System") {
                    bubbleClass = "system";
                  }
                  return (
                    <div key={`${message.sender}-${index}`} className={`chat-bubble ${bubbleClass}`}>
                      <div className="chat-bubble-header">
                        {message.sender} · {message.time}
                      </div>
                      <div className="chat-bubble-text">{message.text}</div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-row">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder={connected ? "Send a message..." : "Join class to chat..."}
                  disabled={!connected}
                  className="chat-input"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button onClick={handleSendMessage} className="btn-primary" disabled={!connected}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentLiveClass;
