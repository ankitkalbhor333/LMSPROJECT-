import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Room,
  RoomEvent,
  createLocalAudioTrack,
  createLocalVideoTrack,
} from "livekit-client";
import {
  getLiveClassById,
  getLiveClassToken,
  startLiveClass,
  endLiveClass,
  getLiveClassAttendanceSummary,
  getLiveClassRecording,
  toggleLiveClassRecording,
} from "../utils/liveClassApi";

const formatDisplayTime = (value) => {
  if (!value) return "00:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

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

function TeacherLiveClass() {
  const { id } = useParams();
  const roomRef = useRef(null);
  const localVideoRef = useRef(null);
  const screenShareRef = useRef(null);
  const [classData, setClassData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "System", text: "Class room ready. Students can join once connected.", time: "Now" },
  ]);
  const [messageText, setMessageText] = useState("");
  const [attendanceSummary, setAttendanceSummary] = useState({
    totalStudents: 0,
    present: 0,
    late: 0,
    absent: 0,
    excused: 0,
    inProgress: 0,
    averageDurationMinutes: 0,
  });
  const [recordingInfo, setRecordingInfo] = useState({
    enabled: false,
    status: "not_started",
    url: "",
    duration: 0,
  });
  const [raisedHands, setRaisedHands] = useState([]);
  const [studentPermissions, setStudentPermissions] = useState({});
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localScreenShareTrack, setLocalScreenShareTrack] = useState(null);

  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);
  const classStatus = classData?.status || "scheduled";
  const classIsActive = ["scheduled", "live"].includes(classStatus);

  const persistSession = (sessionId) => {
    sessionStorage.setItem("lms-live-class-teacher-session", JSON.stringify({ id: sessionId, role: "teacher", timestamp: Date.now() }));
  };

  const clearSession = () => {
    sessionStorage.removeItem("lms-live-class-teacher-session");
  };

  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoading(true);
        const response = await getLiveClassById(id);
        const loadedClass = response.data.data || response.data || null;
        setClassData(loadedClass);
        await loadClassMetadata();

        const session = sessionStorage.getItem("lms-live-class-teacher-session");
        if (session && loadedClass?.status === "live") {
          try {
            const parsed = JSON.parse(session);
            if (parsed.id === id && Date.now() - parsed.timestamp < 1000 * 60 * 30) {
              joinRoom(true);
            }
          } catch (error) {
            console.warn("Failed to restore teacher session", error);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load class details.");
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
    const el = localVideoRef.current;
    if (el && localVideoTrack) {
      localVideoTrack.attach(el);
      return () => {
        localVideoTrack.detach(el);
      };
    }
  }, [localVideoTrack, connected]);

  useEffect(() => {
    const el = screenShareRef.current;
    if (el && localScreenShareTrack) {
      localScreenShareTrack.attach(el);
      return () => {
        localScreenShareTrack.detach(el);
      };
    }
  }, [localScreenShareTrack, screenSharing]);

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

  const loadClassMetadata = async () => {
    if (!id) return;

    try {
      const [attendanceResponse, recordingResponse] = await Promise.all([
        getLiveClassAttendanceSummary(id),
        getLiveClassRecording(id),
      ]);

      setAttendanceSummary(attendanceResponse.data?.data || {
        totalStudents: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        inProgress: 0,
        averageDurationMinutes: 0,
      });
      setRecordingInfo(recordingResponse.data?.data || {
        enabled: false,
        status: "not_started",
        url: "",
        duration: 0,
      });
    } catch (error) {
      console.warn("Unable to fetch classroom metadata", error);
    }
  };

  const attachTrackToElement = (track, element) => {
    if (!track || !element) return;
    try {
      track.attach(element);
    } catch (error) {
      console.warn("Unable to attach track to element", error);
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

    if (track.kind === "video" && publication.source === "screen_share") {
      attachTrackToElement(track, screenShareRef.current);
    }
    if (track.kind === "audio") {
      const el = track.attach();
      document.body.appendChild(el);
    }
  };

  const handleTrackUnsubscribed = (track, publication) => {
    if (track && publication?.source === "screen_share" && screenShareRef.current) {
      try {
        track.detach(screenShareRef.current);
      } catch (error) {
        console.warn("Unable to detach screen share track", error);
      }
    }
    if (track.kind === "audio") {
      track.detach().forEach((el) => el.remove());
    }
  };

  const handleIncomingRoomData = (payload, participant) => {
    const message = decodeDataMessage(payload);
    if (!message) return;

    if (message.type === "chat") {
      const senderName = participant?.name || participant?.identity || message.sender || "Student";
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
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "System",
          text: `${message.action === "mute" ? "Your microphone was muted" : "Your microphone was enabled"} by the teacher.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const sendPermissionUpdate = (targetIdentity, action, enabled) => {
    if (!roomRef.current) return;

    roomRef.current.localParticipant.publishData(
      new TextEncoder().encode(
        JSON.stringify({
          type: "teacher_permission",
          targetIdentity,
          action,
          enabled,
        })
      ),
      { reliable: true }
    );

    setStudentPermissions((prev) => ({
      ...prev,
      [targetIdentity]: { action, enabled },
    }));
  };

  const joinRoom = async (isResume = false) => {
    try {
      if (!id) return;
      if (!classIsActive && classStatus !== "scheduled") {
        setError("This class is no longer active.");
        return;
      }

      setJoining(true);
      setError("");

      if (!isResume) {
        persistSession(id);
      }

      try {
        const startResponse = await startLiveClass(id);
        const startedData = startResponse.data?.data || startResponse.data || null;
        if (startedData) {
          setClassData((prev) => ({ ...(prev || {}), ...startedData, status: startedData.status || "live" }));
        }
      } catch (err) {
        const statusCode = err.response?.status;
        if (statusCode !== 409 && statusCode !== 403 && statusCode !== 400) {
          throw err;
        }
      }

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

      // Publish local tracks using setCameraEnabled / setMicrophoneEnabled
      try {
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
      } catch (mediaError) {
        console.error("Teacher media permission error:", mediaError);
        setError("Camera or microphone permission was denied. Please allow access and try again.");
        room.disconnect();
        return;
      }

      const cameraPub = room.localParticipant.getTrackPublication("camera");
      if (cameraPub?.track) {
        setLocalVideoTrack(cameraPub.track);
      }

      roomRef.current = room;
      setConnected(true);
      setCameraEnabled(true);
      setMicEnabled(true);
      setClassData((prev) => ({ ...(prev || {}), status: "live" }));
      syncParticipants(room);
      loadClassMetadata();
    } catch (err) {
      console.error("Teacher room join failed:", err);
      setError(err.response?.data?.message || "Unable to join class room.");
    } finally {
      setJoining(false);
    }
  };

  const leaveRoom = async () => {
    try {
      if (id) {
        try {
          await endLiveClass(id);
        } catch (err) {
          console.warn("Unable to mark class as ended:", err);
        }
      }
    } catch (err) {
      console.error("Error ending the class:", err);
    } finally {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      setConnected(false);
      setCameraEnabled(false);
      setMicEnabled(false);
      setScreenSharing(false);
      setLocalVideoTrack(null);
      setLocalScreenShareTrack(null);
      setParticipants([]);
      clearSession();
      setClassData((prev) => ({ ...(prev || {}), status: "ended" }));
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current) return;
    try {
      const nextValue = !cameraEnabled;
      await roomRef.current.localParticipant.setCameraEnabled(nextValue);
      setCameraEnabled(nextValue);
      if (nextValue) {
        const cameraPub = roomRef.current.localParticipant.getTrackPublication("camera");
        if (cameraPub?.track) {
          setLocalVideoTrack(cameraPub.track);
        }
      } else {
        setLocalVideoTrack(null);
      }
    } catch (error) {
      console.error("Camera toggle failed:", error);
    }
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    try {
      const nextValue = !micEnabled;
      await roomRef.current.localParticipant.setMicrophoneEnabled(nextValue);
      setMicEnabled(nextValue);
    } catch (error) {
      console.error("Microphone toggle failed:", error);
    }
  };

  const toggleScreenShare = async () => {
    if (!roomRef.current) return;

    try {
      const nextValue = !screenSharing;
      await roomRef.current.localParticipant.setScreenShareEnabled(nextValue);
      setScreenSharing(nextValue);

      if (nextValue) {
        const screenPublication = roomRef.current.localParticipant.getTrackPublication("screen_share");
        if (screenPublication?.track) {
          setLocalScreenShareTrack(screenPublication.track);
        }
      } else {
        setLocalScreenShareTrack(null);
      }
    } catch (error) {
      console.error("Screen share toggle failed:", error);
      setError("Unable to share your screen. Please check browser permissions and try again.");
      setScreenSharing(false);
      setLocalScreenShareTrack(null);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    const text = messageText.trim();
    const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    publishRoomMessage({
      type: "chat",
      sender: "Teacher",
      text,
    });

    setChatMessages((prev) => [
      ...prev,
      { sender: "Teacher", text, time: timestamp },
    ]);
    setMessageText("");
  };

  const toggleRecording = async () => {
    try {
      const nextEnabled = !recordingInfo.enabled;
      const nextStatus = nextEnabled ? "recording" : "disabled";
      const response = await toggleLiveClassRecording(id, {
        enabled: nextEnabled,
        status: nextStatus,
        duration: nextEnabled ? (recordingInfo.duration || 0) : recordingInfo.duration,
      });

      const data = response.data?.data || response.data || {
        enabled: nextEnabled,
        status: nextStatus,
        url: "",
        duration: 0,
      };

      setRecordingInfo(data);
    } catch (error) {
      console.error("Unable to toggle recording", error);
      setError(error.response?.data?.message || "Unable to toggle recording state.");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>
          <p>Loading live class...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7fb" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 520, boxShadow: "0 12px 32px rgba(15,23,42,.08)" }}>
          <h2 style={{ marginBottom: 10 }}>Class room unavailable</h2>
          <p style={{ color: "#475569", marginBottom: 18 }}>{error}</p>
          <button onClick={() => window.history.back()} style={primaryButtonStyle}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f4f7fb", minHeight: "100vh", padding: "24px 16px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, color: "#f43f5e", fontWeight: 700, letterSpacing: 1.3, textTransform: "uppercase" }}>
              Live Classroom
            </div>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(28px, 3vw, 40px)", color: "#0f172a" }}>
              {classData?.title || "Teacher Live Class"}
            </h1>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button style={secondaryButtonStyle}>{connected ? "Connected" : classStatus === "ended" ? "Ended" : classStatus === "cancelled" ? "Cancelled" : "Waiting"}</button>
            <button
              style={{
                ...primaryButtonStyle,
                opacity: classStatus === "ended" || classStatus === "cancelled" ? 0.5 : 1,
                cursor: classStatus === "ended" || classStatus === "cancelled" ? "not-allowed" : "pointer",
              }}
              onClick={connected ? leaveRoom : joinRoom}
              disabled={classStatus === "ended" || classStatus === "cancelled"}
            >
              {joining ? "Connecting..." : connected ? "End Class" : classStatus === "ended" ? "Class Ended" : classStatus === "cancelled" ? "Class Cancelled" : "Start Class"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.8fr) minmax(260px, 0.9fr)", gap: 20 }}>
          <div style={{ background: "#ffffff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                {participantCount} students
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", borderRadius: 18, padding: 18, minHeight: 380, position: "relative" }}>
              {connected ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", minHeight: 330, objectFit: "cover", borderRadius: 14, background: "#020817" }}
                  />
                  {screenSharing && (
                    <div style={{ marginTop: 12, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "8px 10px", color: "#e2e8f0", fontWeight: 700 }}>
                        Screen Share
                      </div>
                      <video
                        ref={screenShareRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: "100%", maxHeight: 220, objectFit: "contain", background: "#020817" }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ minHeight: 330, display: "grid", placeItems: "center", color: "#e2e8f0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📹</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Teacher preview is offline</div>
                    <div style={{ color: "#cbd5e1", marginTop: 6 }}>Start the room to begin teaching.</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
              <button onClick={toggleCamera} style={{ ...actionButtonStyle, background: cameraEnabled ? "#0f172a" : "#e2e8f0", color: cameraEnabled ? "#fff" : "#0f172a" }}>
                {cameraEnabled ? "📹 Camera On" : "📷 Camera Off"}
              </button>
              <button onClick={toggleMic} style={{ ...actionButtonStyle, background: micEnabled ? "#0f172a" : "#e2e8f0", color: micEnabled ? "#fff" : "#0f172a" }}>
                {micEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>
              <button onClick={toggleScreenShare} style={{ ...actionButtonStyle, background: screenSharing ? "#f43f5e" : "#e2e8f0", color: screenSharing ? "#fff" : "#0f172a" }}>
                🖥️ {screenSharing ? "Stop Sharing" : "Share Screen"}
              </button>
              <button style={{ ...actionButtonStyle, background: "#ef4444", color: "#fff" }} onClick={leaveRoom}>
                End Class
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateRows: "minmax(0, 1fr) minmax(220px, 0.9fr)", gap: 20 }}>
            <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>Participants</h3>
                <span style={{ fontWeight: 700, color: "#475569" }}>{participantCount}</span>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {participants.length === 0 ? (
                  <div style={{ color: "#64748b", padding: "10px 0" }}>No student participants yet.</div>
                ) : (
                  participants.map((participant, index) => (
                    <div key={`${participant.identity}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#f8fafc", borderRadius: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{participant.name}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{participant.isSpeaking ? "Speaking" : "Listening"}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span>{participant.audioEnabled ? "🎤" : "🔇"}</span>
                        <span>{participant.videoEnabled ? "📹" : "📷"}</span>
                        <button onClick={() => sendPermissionUpdate(participant.identity, "mic", false)} style={{ ...miniActionButton, background: "#fee2e2", color: "#991b1b" }}>Mute</button>
                        <button onClick={() => sendPermissionUpdate(participant.identity, "mic", true)} style={{ ...miniActionButton, background: "#dcfce7", color: "#166534" }}>Unmute</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>Attendance</h3>
                <span style={{ fontWeight: 700, color: "#475569" }}>{attendanceSummary.totalStudents}</span>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}><span>Present</span><strong>{attendanceSummary.present}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}><span>Late</span><strong>{attendanceSummary.late}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}><span>Absent</span><strong>{attendanceSummary.absent}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}><span>Excused</span><strong>{attendanceSummary.excused}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "#334155" }}><span>Avg duration</span><strong>{attendanceSummary.averageDurationMinutes} min</strong></div>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 18, padding: 18, boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: "#0f172a" }}>Class Chat</h3>
                <span style={{ fontSize: 12, color: "#64748b" }}>{chatMessages.length} messages</span>
              </div>

              <div style={{ height: 180, overflowY: "auto", display: "grid", gap: 8, background: "#f8fafc", borderRadius: 12, padding: 10 }}>
                {chatMessages.map((message, index) => (
                  <div key={`${message.sender}-${index}`}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                      {message.sender} · {message.time}
                    </div>
                    <div style={{ color: "#0f172a", fontSize: 14 }}>{message.text}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type a message to students"
                  style={{
                    flex: 1,
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                    padding: "10px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                <button onClick={handleSendMessage} style={primaryButtonStyle}>Send</button>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>Raised hands</div>
                <button onClick={toggleRecording} style={{ ...actionButtonStyle, background: recordingInfo.enabled ? "#16a34a" : "#e2e8f0", color: recordingInfo.enabled ? "#fff" : "#0f172a" }}>
                  {recordingInfo.enabled ? "Recording On" : "Start Recording"}
                </button>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {raisedHands.length === 0 ? (
                  <div style={{ color: "#64748b", fontSize: 13 }}>No students are currently waiting to speak.</div>
                ) : (
                  raisedHands.map((name, index) => (
                    <div key={`${name}-${index}`} style={{ background: "#fff7ed", padding: "8px 10px", borderRadius: 10, color: "#9a5b00", fontWeight: 700 }}>
                      ✋ {name}
                    </div>
                  ))
                )}
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

const miniActionButton = {
  border: "none",
  borderRadius: 8,
  padding: "5px 8px",
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

export default TeacherLiveClass;
