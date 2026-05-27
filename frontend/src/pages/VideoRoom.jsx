import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const VideoRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const engineRef = useRef(null);

  const [status, setStatus] = useState('connecting'); // connecting | connected | error
  const [videoError, setVideoError] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [remoteUserName, setRemoteUserName] = useState('Waiting for other participant...');

  // ---------- Token fetch from backend ----------
  const fetchZegoToken = async (roomId) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('You are not logged in. Please login first.');

    const res = await fetch(`${API_URL}/api/zego/token?roomId=${encodeURIComponent(roomId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Server error' }));
      throw new Error(err.error || 'Failed to get video token from server.');
    }

    return res.json(); // { token, appId, userId, roomId }
  };

  // ---------- ZegoCloud Setup ----------
  useEffect(() => {
    let zegoInstance = null;
    let localStream = null;

    const setup = async () => {
      try {
        setStatus('connecting');
        setVideoError('');

        // 1. Get token from backend
        const { token, appId, userId } = await fetchZegoToken(meetingId);

        // 2. Create ZegoExpressEngine instance
        zegoInstance = new ZegoExpressEngine(appId, 'wss://webliveroom-test.zego.im/ws');
        engineRef.current = zegoInstance;

        // 3. Set up event listeners BEFORE login
        zegoInstance.on('roomStreamUpdate', async (roomID, updateType, streamList) => {
          if (updateType === 'ADD') {
            for (const stream of streamList) {
              setRemoteUserName(stream.user?.userName || 'Other participant');
              await zegoInstance.startPlayingStream(stream.streamID, {
                video: true,
                audio: true,
              }).then((remoteStream) => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              });
            }
          } else if (updateType === 'DELETE') {
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
            setRemoteUserName('Participant left the call');
          }
        });

        zegoInstance.on('roomStateUpdate', (roomID, state) => {
          if (state === 'CONNECTED') setStatus('connected');
          else if (state === 'DISCONNECTED') setStatus('error');
        });

        // 4. Login to room
        await zegoInstance.loginRoom(
          meetingId,
          token,
          { userID: userId, userName: getUserName() },
          { userUpdate: true }
        );

        // 5. Get local camera/mic stream
        localStream = await zegoInstance.createStream({
          camera: { audio: true, video: true },
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // 6. Publish local stream
        const streamID = `stream_${userId}_${meetingId}`;
        await zegoInstance.startPublishingStream(streamID, localStream);

        setStatus('connected');
      } catch (err) {
        console.error('VideoRoom setup failed:', err);
        setVideoError(err?.message || 'Failed to start video call.');
        setStatus('error');
      }
    };

    setup();

    return () => {
      // Cleanup on unmount
      try {
        if (engineRef.current) {
          if (localStream) {
            engineRef.current.destroyStream(localStream);
          }
          engineRef.current.logoutRoom(meetingId);
          engineRef.current.destroyEngine();
          engineRef.current = null;
        }
      } catch (e) {
        console.warn('VideoRoom cleanup error (safe to ignore):', e);
      }
    };
  }, [meetingId]);

  // ---------- Helpers ----------
  const getUserName = () => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) return JSON.parse(raw)?.name || 'User';
    } catch {
      // ignore
    }
    return 'User';
  };

  const handleToggleMute = useCallback(() => {
    if (!engineRef.current) return;
    const newMuted = !isMuted;
    engineRef.current.muteMicrophone(newMuted);
    setIsMuted(newMuted);
  }, [isMuted]);

  const handleToggleCamera = useCallback(() => {
    if (!engineRef.current) return;
    const newOff = !isCameraOff;
    engineRef.current.mutePublishStreamVideo(newOff);
    setIsCameraOff(newOff);
  }, [isCameraOff]);

  const handleEndCall = useCallback(() => {
    try {
      if (engineRef.current) {
        engineRef.current.logoutRoom(meetingId);
        engineRef.current.destroyEngine();
        engineRef.current = null;
      }
    } catch (e) {
      // safe ignore
    }
    navigate(-1);
  }, [meetingId, navigate]);

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row text-white">
      {/* Remote Video — Main area */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 z-10">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-300">Connecting to video call...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-950 z-10 px-6 text-center">
            <div className="text-5xl">📵</div>
            <h2 className="text-xl font-bold text-red-400">Video call failed</h2>
            <p className="text-gray-400 text-sm max-w-md">{videoError}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
            >
              Go Back
            </button>
          </div>
        )}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Remote name tag */}
        {status === 'connected' && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-sm">
            {remoteUserName}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="md:w-80 bg-gray-900 p-5 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
          <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}`} />
          <div>
            <p className="font-semibold text-sm">
              {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </p>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">Room: {meetingId}</p>
          </div>
        </div>

        {/* Local Video Preview */}
        <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
          <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <span className="text-4xl">📷</span>
            </div>
          )}
          <span className="absolute bottom-2 right-2 text-xs bg-black/60 px-2 py-0.5 rounded-full">
            You ({getUserName()})
          </span>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`p-3 rounded-full text-xl transition ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isMuted ? '🔇' : '🎙️'}
          </button>
          <button
            onClick={handleToggleCamera}
            title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            className={`p-3 rounded-full text-xl transition ${isCameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {isCameraOff ? '🚫' : '📹'}
          </button>
          <button
            onClick={handleEndCall}
            title="End Call"
            className="p-3 rounded-full text-xl bg-red-600 hover:bg-red-700 transition"
          >
            📵
          </button>
        </div>

        {/* Info */}
        <div className="mt-auto text-xs text-gray-500 text-center">
          Powered by ZegoCloud · End-to-end encrypted
        </div>
      </div>
    </div>
  );
};

export default VideoRoom;
