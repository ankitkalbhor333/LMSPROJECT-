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
import "./TeacherLiveClass.css";

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
  const chatEndRef = useRef(null);
  const [classData, setClassData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [deviceError, setDeviceError] = useState("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState("user");
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

  // Mobile layout state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 960);

  // Active speakers & Local quality states
  const [activeSpeakers, setActiveSpeakers] = useState([]);
  const [localQuality, setLocalQuality] = useState("unknown");

  // Whiteboard drawing states
  const canvasRef = useRef(null);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawWidth, setDrawWidth] = useState(3);
  const lastDrawingCoords = useRef({ x: 0, y: 0 });

  // Poll states
  const [pollActive, setPollActive] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", "", "", ""]);
  const [pollVotes, setPollVotes] = useState([0, 0, 0, 0]);
  const [pollVoteLog, setPollVoteLog] = useState({});

  // Emoji reactions state
  const [reactions, setReactions] = useState([]);
  const [layoutMode, setLayoutMode] = useState("horizontal");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const stageRef = useRef(null);

  const participantCount = useMemo(() => participants.length + (connected ? 1 : 0), [participants, connected]);
  const classStatus = classData?.status || "scheduled";
  const classIsActive = ["scheduled", "live"].includes(classStatus);

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
      console.warn("Fullscreen toggle failed:", error);
    }
  };

  const persistSession = (sessionId) => {
    sessionStorage.setItem("lms-live-class-teacher-session", JSON.stringify({ id: sessionId, role: "teacher", timestamp: Date.now() }));
  };

  const clearSession = () => {
    sessionStorage.removeItem("lms-live-class-teacher-session");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  // Mobile resize hook
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  // Update canvas dimension when whiteboard opens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && whiteboardActive) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }
  }, [whiteboardActive]);

  const syncParticipants = (room) => {
    const list = Array.from(room.remoteParticipants.values()).map((participant) => ({
      identity: participant.identity,
      name: participant.name || participant.identity,
      isSpeaking: participant.isSpeaking,
      videoEnabled: participant.videoTrackPublications.size > 0,
      audioEnabled: participant.audioTrackPublications.size > 0,
      connectionQuality: participant.connectionQuality,
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

    if (message.type === "poll_vote") {
      const studentId = participant?.identity || "unknown";
      const optionIndex = message.optionIndex;
      
      setPollVoteLog((prevLog) => {
        const prevVote = prevLog[studentId];
        if (prevVote === optionIndex) return prevLog;

        setPollVotes((prevVotes) => {
          const nextVotes = [...prevVotes];
          if (prevVote !== undefined) {
            nextVotes[prevVote] = Math.max(0, nextVotes[prevVote] - 1);
          }
          nextVotes[optionIndex] += 1;
          
          publishRoomMessage({
            type: "poll_update",
            votes: nextVotes,
          });
          
          return nextVotes;
        });

        return { ...prevLog, [studentId]: optionIndex };
      });
      return;
    }

    if (message.type === "reaction") {
      const emoji = message.emoji;
      const id = Date.now() + Math.random();
      setReactions((prev) => [...prev, { id, emoji, left: Math.floor(Math.random() * 80) + 10 }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
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

  const enableDevices = async () => {
    if (!roomRef.current) return;
    try {
      setDeviceError("");
      await publishCameraTrack(roomRef.current, cameraFacingMode);
      await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      setMicEnabled(true);
    } catch (err) {
      console.error("Failed to enable devices:", err);
      setDeviceError("Camera or microphone permission was denied. Please check your browser settings and try again.");
    }
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
      setDeviceError("");

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
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setActiveSpeakers(speakers.map((s) => s.identity));
        syncParticipants(room);
      });
      room.on(RoomEvent.ConnectionQualityChanged, () => {
        syncParticipants(room);
        if (room.localParticipant) {
          setLocalQuality(room.localParticipant.connectionQuality);
        }
      });

      await room.connect(tokenData.url, tokenData.token);

      // Publish local tracks using selected face direction for teacher camera
      try {
        await publishCameraTrack(room, cameraFacingMode);
        await room.localParticipant.setMicrophoneEnabled(true);
        setMicEnabled(true);
      } catch (mediaError) {
        console.error("Teacher media permission error:", mediaError);
        setDeviceError("Camera or microphone permission was denied. You are joined but your camera/mic are muted. Please grant permissions and click 'Retry Devices'.");
        setMicEnabled(false);
        setCameraEnabled(false);
      }

      roomRef.current = room;
      setConnected(true);
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
      setActiveSpeakers([]);
      setLocalQuality("unknown");
      setReactions([]);
      setWhiteboardActive(false);
      setPollActive(false);
      setParticipants([]);
      clearSession();
      setClassData((prev) => ({ ...(prev || {}), status: "ended" }));
    }
  };

  const stopTrackPublication = async (source) => {
    const room = roomRef.current;
    if (!room) return null;

    const publication = room.localParticipant.getTrackPublication(source);
    if (!publication?.track) return null;

    try {
      await room.localParticipant.unpublishTrack(publication.track);
    } catch (error) {
      console.warn(`Unable to unpublish ${source} track`, error);
    }

    try {
      publication.track.stop();
    } catch (error) {
      console.warn(`Unable to stop ${source} track`, error);
    }

    return publication.track;
  };

  const publishCameraTrack = async (room, facingMode = cameraFacingMode) => {
    if (!room) return null;

    await stopTrackPublication("camera");

    try {
      const nextTrack = await createLocalVideoTrack({ facingMode });
      await room.localParticipant.publishTrack(nextTrack);
      setLocalVideoTrack(nextTrack);
      setCameraEnabled(true);
      return nextTrack;
    } catch (error) {
      console.error("Failed to publish camera track:", error);
      setCameraEnabled(false);
      setLocalVideoTrack(null);
      throw error;
    }
  };

  const toggleCamera = async () => {
    if (!roomRef.current) return;
    try {
      const nextValue = !cameraEnabled;

      if (nextValue) {
        await publishCameraTrack(roomRef.current, cameraFacingMode);
        return;
      }

      await stopTrackPublication("camera");
      await roomRef.current.localParticipant.setCameraEnabled(false);
      setCameraEnabled(false);
      setLocalVideoTrack(null);
    } catch (error) {
      console.error("Camera toggle failed:", error);
      setError("Unable to toggle your camera. Please check browser permissions and try again.");
    }
  };

  const flipCamera = async () => {
    if (!roomRef.current || !cameraEnabled) return;

    try {
      const nextFacingMode = cameraFacingMode === "user" ? "environment" : "user";
      setCameraFacingMode(nextFacingMode);
      await publishCameraTrack(roomRef.current, nextFacingMode);
    } catch (error) {
      console.error("Camera flip failed:", error);
      setError("Unable to switch camera direction. Please try again.");
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

      if (nextValue) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        const screenTrack = new MediaStreamTrackAudioSourceNode ? null : null;
        const screenVideoTrack = displayStream.getVideoTracks()[0];
        const screenAudioTrack = displayStream.getAudioTracks()[0] || null;

        if (!screenVideoTrack) {
          throw new Error("No screen capture track available");
        }

        const localScreenTrack = await roomRef.current.localParticipant.createTrack({
          kind: "video",
          source: "screen_share",
          captureStream: () => displayStream,
        });

        if (screenAudioTrack) {
          const localAudioTrack = await roomRef.current.localParticipant.createTrack({
            kind: "audio",
            source: "microphone",
            captureStream: () => new MediaStream([screenAudioTrack]),
          });
          await roomRef.current.localParticipant.publishTrack(localAudioTrack);
        }

        await roomRef.current.localParticipant.publishTrack(localScreenTrack);
        setLocalScreenShareTrack(localScreenTrack);
        setScreenSharing(true);

        displayStream.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            setScreenSharing(false);
            setLocalScreenShareTrack(null);
          });
        });

        return;
      }

      await stopTrackPublication("screen_share");
      setLocalScreenShareTrack(null);
      setScreenSharing(false);
    } catch (error) {
      console.error("Screen share toggle failed:", error);
      setError("Unable to share your screen. Please check browser permissions and try again.");
      setScreenSharing(false);
      setLocalScreenShareTrack(null);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (!whiteboardActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    lastDrawingCoords.current = { x, y };
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !whiteboardActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineCap = "round";
    ctx.moveTo(lastDrawingCoords.current.x, lastDrawingCoords.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();

    publishRoomMessage({
      type: "draw",
      x1: lastDrawingCoords.current.x / rect.width,
      y1: lastDrawingCoords.current.y / rect.height,
      x2: x / rect.width,
      y2: y / rect.height,
      color: drawColor,
      lineWidth: drawWidth,
    });

    lastDrawingCoords.current = { x, y };
  };

  const handleCanvasMouseUpOrLeave = () => {
    setIsDrawing(false);
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    publishRoomMessage({ type: "clear_board" });
  };

  const handleLaunchPoll = () => {
    if (!pollQuestion.trim()) {
      alert("Please enter a poll question.");
      return;
    }
    const filteredOptions = pollOptions.filter(o => o.trim() !== "");
    if (filteredOptions.length < 2) {
      alert("Please provide at least 2 options.");
      return;
    }

    setPollActive(true);
    setPollVotes(new Array(filteredOptions.length).fill(0));
    setPollVoteLog({});

    publishRoomMessage({
      type: "poll_launch",
      question: pollQuestion.trim(),
      options: filteredOptions,
    });
  };

  const handleEndPoll = () => {
    setPollActive(false);
    publishRoomMessage({
      type: "poll_end"
    });
  };

  const renderConnectionQuality = (quality) => {
    let color = "#10b981"; // excellent
    if (quality === "good") color = "#f59e0b";
    else if (quality === "poor") color = "#ef4444";
    else if (quality === "unknown" || !quality) color = "#94a3b8";

    return (
      <span style={{ color, fontSize: 11, fontWeight: 700 }} title={`Connection: ${quality || "checking"}`}>
        📶
      </span>
    );
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
  };  if (loading) {
    return (
      <div className="error-screen-container">
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 34, marginBottom: 12 }}>⏳</div>
          <p style={{ color: "#475569", fontWeight: 600 }}>Loading live class details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen-container">
        <div className="error-screen-card">
          <div className="error-screen-icon">⚠️</div>
          <h2 className="error-screen-title">Class Room Unavailable</h2>
          <p className="error-screen-message">{error}</p>
          <div className="troubleshoot-list">
            <strong>Troubleshooting tips:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>Verify that the class has been scheduled correctly.</li>
              <li>Check your internet connection and try reloading the page.</li>
              <li>Contact support if you believe this is an authorization issue.</li>
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
          <div className="warning-banner">
            <div>
              ⚠️ Your connection quality is poor. Students might experience audio/video lagging.
            </div>
            <button onClick={() => { leaveRoom(); setTimeout(() => joinRoom(), 1000); }}>
              Reconnect
            </button>
          </div>
        )}

        {/* Device Permission Error Banner */}
        {deviceError && (
          <div className="warning-banner" style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderLeftColor: "#ef4444" }}>
            <div>
              🎥 {deviceError}
            </div>
            <button onClick={enableDevices} className="btn-primary" style={{ background: "#ef4444" }}>
              Retry Devices
            </button>
          </div>
        )}

        <div className="live-class-header">
          <div className="live-class-title-section">
            <span className="live-class-role-badge">Live Classroom (Teacher)</span>
            <h1 className="live-class-title">
              {classData?.title || "Teacher Live Class"}
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
              {connected ? "🟢 Connected" : classStatus === "ended" ? "🔴 Ended" : classStatus === "cancelled" ? "⚫ Cancelled" : "⏳ Ready"}
            </button>
            <button
              className="btn-primary"
              style={{
                opacity: classStatus === "ended" || classStatus === "cancelled" ? 0.5 : 1,
                cursor: classStatus === "ended" || classStatus === "cancelled" ? "not-allowed" : "pointer"
              }}
              onClick={connected ? leaveRoom : joinRoom}
              disabled={classStatus === "ended" || classStatus === "cancelled"}
            >
              {joining ? "Connecting..." : connected ? "End Class" : classStatus === "ended" ? "Class Ended" : classStatus === "cancelled" ? "Class Cancelled" : "Start Class"}
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
                {connected && (
                  <span className="connection-quality-tag">
                    Your Connection: {localQuality === "excellent" ? "💚 Excellent" : localQuality === "good" ? "💛 Good" : localQuality === "poor" ? "❤️ Poor" : "📶 Checking"}
                  </span>
                )}
                <div className="watch-count-indicator">
                  <span className={`pulse-dot ${connected ? "connected" : "disconnected"}`} />
                  {participantCount} students
                </div>
              </div>
            </div>

            <div
              ref={stageRef}
              className={`video-stage ${
                activeSpeakers.includes(roomRef.current?.localParticipant?.identity) ? "speaker-active" : ""
              } ${isFullScreen ? "fullscreen-active" : ""} ${
                layoutMode === "horizontal" && screenSharing ? "split-layout" : "single-layout"
              }`}
            >
              {connected ? (
                <>
                  <div className="primary-video-wrapper">
                    {/* Recording pulse overlay */}
                    {recordingInfo.enabled && (
                      <div className="recording-badge-overlay">
                        <span className="recording-dot" />
                        REC
                      </div>
                    )}
                    
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="video-feed"
                    />

                    {whiteboardActive && (
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUpOrLeave}
                        onMouseLeave={handleCanvasMouseUpOrLeave}
                        className="whiteboard-canvas"
                      />
                    )}

                    {reactions.map((r) => (
                      <span key={r.id} className="floating-emoji" style={{ left: `${r.left}%` }}>
                        {r.emoji}
                      </span>
                    ))}
                  </div>

                  {screenSharing && (
                    <div className="screenshare-video-wrapper">
                      <div className="screenshare-header">
                        🖥️ Screen Share
                      </div>
                      <video
                        ref={screenShareRef}
                        autoPlay
                        playsInline
                        muted
                        className="screenshare-video"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ minHeight: isMobile ? 240 : 330, display: "grid", placeItems: "center", color: "#e2e8f0" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 44, marginBottom: 10 }}>📹</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Teacher preview is offline</div>
                    <div style={{ color: "#cbd5e1", marginTop: 6 }}>Start the class room to begin teaching.</div>
                  </div>
                </div>
              )}
            </div>

            <div className="controls-bar">
              <button
                onClick={toggleCamera}
                className={`btn-action ${cameraEnabled ? "active" : "inactive"}`}
                disabled={!connected}
              >
                {cameraEnabled ? "📹 Camera On" : "📷 Camera Off"}
              </button>
              <button
                onClick={flipCamera}
                disabled={!cameraEnabled || !connected}
                className="btn-action"
                style={{
                  background: cameraEnabled ? "#2563eb" : "#cbd5e1",
                  color: cameraEnabled ? "#fff" : "#64748b",
                  opacity: cameraEnabled ? 1 : 0.6
                }}
              >
                {cameraFacingMode === "user" ? "🔄 Front Camera" : "🔄 Back Camera"}
              </button>
              <button
                onClick={toggleMic}
                className={`btn-action ${micEnabled ? "active" : "inactive"}`}
                disabled={!connected}
              >
                {micEnabled ? "🎤 Mic On" : "🔇 Mic Off"}
              </button>
              <button
                onClick={toggleScreenShare}
                className="btn-action"
                style={{
                  background: screenSharing ? "#f43f5e" : "#e2e8f0",
                  color: screenSharing ? "#fff" : "#0f172a"
                }}
                disabled={!connected}
              >
                🖥️ {screenSharing ? "Stop Sharing" : "Share Screen"}
              </button>
              <button
                onClick={() => setWhiteboardActive(!whiteboardActive)}
                className="btn-action"
                style={{
                  background: whiteboardActive ? "#764ba2" : "#e2e8f0",
                  color: whiteboardActive ? "#fff" : "#0f172a"
                }}
                disabled={!connected}
              >
                🎨 {whiteboardActive ? "Whiteboard On" : "Whiteboard Off"}
              </button>
              {whiteboardActive && connected && (
                <>
                  <input
                    type="color"
                    value={drawColor}
                    onChange={(e) => setDrawColor(e.target.value)}
                    style={{ border: "none", width: 40, height: 40, borderRadius: 8, cursor: "pointer", padding: 0 }}
                    title="Brush Color"
                  />
                  <button onClick={clearWhiteboard} className="btn-action" style={{ background: "#fee2e2", color: "#ef4444" }}>
                    🧹 Clear
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="right-panels-grid">
            {/* Polls Card */}
            <div className="glass-card">
              <div className="poll-header">
                <h3 style={{ margin: 0, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>📊 Interactive Poll</h3>
                {pollActive && <span className="poll-active-badge">Active</span>}
              </div>

              {!pollActive ? (
                <div className="poll-creation-form">
                  <input
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="poll-input"
                  />
                  {pollOptions.map((opt, i) => (
                    <input
                      key={i}
                      value={opt}
                      onChange={(e) => {
                        const copy = [...pollOptions];
                        copy[i] = e.target.value;
                        setPollOptions(copy);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="poll-input"
                      style={{ padding: 8, fontSize: 13 }}
                    />
                  ))}
                  <button onClick={handleLaunchPoll} className="btn-primary" disabled={!connected}>
                    Launch Poll
                  </button>
                </div>
              ) : (
                <div className="poll-results-view">
                  <div style={{ fontWeight: 700, color: "#0f172a" }}>{pollQuestion}</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {pollOptions.filter(o => o.trim() !== "").map((opt, i) => {
                      const totalVotes = pollVotes.reduce((a, b) => a + b, 0);
                      const percentage = totalVotes > 0 ? Math.round((pollVotes[i] / totalVotes) * 100) : 0;
                      return (
                        <div key={i} className="poll-result-bar-wrapper">
                          <div className="poll-result-fill" style={{ width: `${percentage}%` }} />
                          <div className="poll-result-content">
                            <span>{opt}</span>
                            <strong>{pollVotes[i]} votes ({percentage}%)</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={handleEndPoll} className="btn-primary" style={{ background: "#ef4444" }}>
                    End Poll
                  </button>
                </div>
              )}
            </div>

            {/* Participants Card */}
            <div className="glass-card">
              <div className="panel-header">
                <h3>Participants</h3>
                <span className="panel-count">{participantCount}</span>
              </div>

              <div className="participants-list">
                {participants.length === 0 ? (
                  <div style={{ color: "#64748b", padding: "10px 0" }}>No student participants yet.</div>
                ) : (
                  participants.map((participant, index) => {
                    const isSpeaking = activeSpeakers.includes(participant.identity);
                    return (
                      <div
                        key={`${participant.identity}-${index}`}
                        className={`participant-row ${isSpeaking ? "speaking" : ""}`}
                      >
                        <div>
                          <div className="participant-info-name">{participant.name}</div>
                          <div className="participant-info-status">{isSpeaking ? "🎤 Speaking" : "👀 Listening"}</div>
                        </div>
                        <div className="participant-actions">
                          {renderConnectionQuality(participant.connectionQuality)}
                          <span>{participant.audioEnabled ? "🎤" : "🔇"}</span>
                          <span>{participant.videoEnabled ? "📹" : "📷"}</span>
                          <button onClick={() => sendPermissionUpdate(participant.identity, "mic", false)} className="btn-mini-action" style={{ background: "#fee2e2", color: "#991b1b" }}>Mute</button>
                          <button onClick={() => sendPermissionUpdate(participant.identity, "mic", true)} className="btn-mini-action" style={{ background: "#dcfce7", color: "#166534" }}>Allow Mic</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Attendance summary */}
            <div className="glass-card">
              <div className="panel-header">
                <h3>Attendance</h3>
                <span className="panel-count">{attendanceSummary.totalStudents}</span>
              </div>

              <div className="attendance-grid">
                <div className="attendance-row"><span>Present</span><strong>{attendanceSummary.present}</strong></div>
                <div className="attendance-row"><span>Late</span><strong>{attendanceSummary.late}</strong></div>
                <div className="attendance-row"><span>Absent</span><strong>{attendanceSummary.absent}</strong></div>
                <div className="attendance-row"><span>Excused</span><strong>{attendanceSummary.excused}</strong></div>
                <div className="attendance-row"><span>Avg duration</span><strong>{attendanceSummary.averageDurationMinutes} min</strong></div>
              </div>
            </div>

            {/* Chat Card */}
            <div className="glass-card">
              <div className="panel-header">
                <h3>Class Chat</h3>
                <span className="panel-count">{chatMessages.length} messages</span>
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
                  placeholder={connected ? "Type a message to students..." : "Join class to start chatting..."}
                  disabled={!connected}
                  className="chat-input"
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
                />
                <button onClick={handleSendMessage} className="btn-primary" disabled={!connected}>
                  Send
                </button>
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, color: "#0f172a" }}>Live Recording</div>
                <button onClick={toggleRecording} className="btn-action" style={{ background: recordingInfo.enabled ? "#dc2626" : "#e2e8f0", color: recordingInfo.enabled ? "#fff" : "#0f172a" }} disabled={!connected}>
                  {recordingInfo.enabled ? "🛑 Stop Rec" : "🔴 Start Rec"}
                </button>
              </div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {raisedHands.length > 0 && <div style={{ fontWeight: 700, fontSize: 13, color: "#9a5b00" }}>Students waiting to speak:</div>}
                {raisedHands.map((name, index) => (
                  <div key={`${name}-${index}`} style={{ background: "#fff7ed", padding: "8px 10px", borderRadius: 10, color: "#9a5b00", fontWeight: 700, fontSize: 13 }}>
                    ✋ {name} is waiting for permission to unmute
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherLiveClass;
