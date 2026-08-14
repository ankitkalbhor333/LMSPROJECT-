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

  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);
  const classStatus = classData?.status || "scheduled";
  const classIsActive = ["scheduled", "live"].includes(classStatus);

  useEffect(() => {
    const loadClass = async () => {
      try {
        setLoading(true);
        const response = await getLiveClassById(id);
        setClassData(response.data.data || response.data || null);
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
    }
  };

  const joinRoom = async () => {
    try {
      if (!id) return;
      if (!classIsActive && classStatus !== "scheduled") {
        setError("This class is no longer active.");
        return;
      }

      setJoining(true);
      setError("");

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
      room.on(RoomEvent.ConnectionStateChanged, () => {
        setConnected(room.state === "connected");
      });
      room.on(RoomEvent.DataReceived, handleIncomingRoomData);

      await room.connect(tokenData.url, tokenData.token);

      const localVideoTrack = await createLocalVideoTrack({
        facingMode: "user",
      });
      const localAudioTrack = await createLocalAudioTrack();

      room.localParticipant.publishTrack(localVideoTrack, { source: "camera" });
      room.localParticipant.publishTrack(localAudioTrack, { source: "microphone" });

      if (localVideoRef.current) {
        localVideoTrack.attach(localVideoRef.current);
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
      setParticipants([]);
      setClassData((prev) => ({ ...(prev || {}), status: "ended" }));
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current) return;
    const nextValue = !cameraEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(nextValue);
    setCameraEnabled(nextValue);
  };

  const toggleMic = async () => {
    if (!roomRef.current) return;
    const nextValue = !micEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(nextValue);
    setMicEnabled(nextValue);
  };

  const toggleScreenShare = async () => {
    if (!roomRef.current) return;
    const nextValue = !screenSharing;
    await roomRef.current.localParticipant.setScreenShareEnabled(nextValue);
    setScreenSharing(nextValue);
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
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  style={{ width: "100%", height: "100%", minHeight: 330, objectFit: "cover", borderRadius: 14, background: "#020817" }}
                />
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
                      <div style={{ display: "flex", gap: 6 }}>
                        <span>{participant.audioEnabled ? "🎤" : "🔇"}</span>
                        <span>{participant.videoEnabled ? "📹" : "📷"}</span>
                      </div>
                    </div>
                  ))
                )}
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

export default TeacherLiveClass;
