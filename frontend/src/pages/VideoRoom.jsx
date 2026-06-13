import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const JITSI_DOMAIN = 'meet.jit.si';

const VideoRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const jitsiContainerRef = useRef(null);
  const apiRef = useRef(null);
  const scriptRef = useRef(null);

  const [status, setStatus] = useState('connecting'); // connecting | connected | error
  const [videoError, setVideoError] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  // ── Get user name from localStorage ──────────────────────
  const getUserName = () => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) return JSON.parse(raw)?.name || 'User';
    } catch {
      // ignore
    }
    return 'User';
  };

  // ── Initialize Jitsi Meet ─────────────────────────────────
  const initJitsi = useCallback(() => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      setVideoError('Jitsi Meet failed to load. Please check your internet connection.');
      setStatus('error');
      return;
    }

    try {
      // Room name: use meetingId directly (already prefixed with healthsync_ from backend)
      const roomName = meetingId.replace(/[^a-zA-Z0-9_-]/g, '_');

      const options = {
        roomName,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
          enableNoisyMicDetection: false,
          startAudioOnly: false,
          toolbarButtons: [
            'microphone',
            'camera',
            'desktop',
            'chat',
            'raisehand',
            'tileview',
            'hangup',
          ],
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          DEFAULT_BACKGROUND: '#111827',
          TOOLBAR_ALWAYS_VISIBLE: false,
          MOBILE_APP_PROMO: false,
          DISPLAY_WELCOME_PAGE_CONTENT: false,
          APP_NAME: 'HealthSync',
          NATIVE_APP_NAME: 'HealthSync',
          PROVIDER_NAME: 'HealthSync',
        },
        userInfo: {
          displayName: getUserName(),
        },
      };

      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
      apiRef.current = api;

      // ── Event Listeners ───────────────────────────────────
      api.on('videoConferenceJoined', () => {
        setStatus('connected');
      });

      api.on('videoConferenceLeft', () => {
        navigate(-1);
      });

      api.on('participantJoined', () => {
        setParticipantCount((c) => c + 1);
      });

      api.on('participantLeft', () => {
        setParticipantCount((c) => Math.max(0, c - 1));
      });

      api.on('readyToClose', () => {
        navigate(-1);
      });

      api.on('errorOccurred', (err) => {
        console.error('Jitsi error:', err);
        setVideoError(err?.error?.message || 'An error occurred during the call.');
        setStatus('error');
      });

    } catch (err) {
      console.error('Jitsi init error:', err);
      setVideoError(err?.message || 'Failed to start video call.');
      setStatus('error');
    }
  }, [meetingId, navigate]);

  // ── Load Jitsi External API script ───────────────────────
  useEffect(() => {
    if (!meetingId) {
      setVideoError('Invalid meeting link.');
      setStatus('error');
      return;
    }

    // Check login
    const token = localStorage.getItem('token');
    if (!token) {
      setVideoError('Please login to join the video call.');
      setStatus('error');
      return;
    }

    // If already loaded (e.g. HMR), init immediately
    if (window.JitsiMeetExternalAPI) {
      initJitsi();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://${JITSI_DOMAIN}/external_api.js`;
    script.async = true;
    script.onload = () => initJitsi();
    script.onerror = () => {
      setVideoError('Could not load Jitsi Meet. Please check your internet connection.');
      setStatus('error');
    };
    scriptRef.current = script;
    document.head.appendChild(script);

    return () => {
      // Cleanup Jitsi instance
      if (apiRef.current) {
        try { apiRef.current.dispose(); } catch (e) { /* safe ignore */ }
        apiRef.current = null;
      }
      // Remove script tag
      if (scriptRef.current && document.head.contains(scriptRef.current)) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [meetingId, initJitsi]);

  // ── End Call manually ─────────────────────────────────────
  const handleEndCall = useCallback(() => {
    if (apiRef.current) {
      try { apiRef.current.executeCommand('hangup'); } catch (e) { /* ignore */ }
    }
    navigate(-1);
  }, [navigate]);

  // ── UI ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-800 z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              status === 'connected'
                ? 'bg-emerald-400 animate-pulse'
                : status === 'connecting'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-red-500'
            }`}
          />
          <div>
            <p className="text-sm font-semibold leading-none">
              {status === 'connected'
                ? 'Connected'
                : status === 'connecting'
                ? 'Connecting...'
                : 'Disconnected'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">
              Room: {meetingId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Participant count */}
          {status === 'connected' && participantCount > 0 && (
            <span className="text-xs bg-gray-800 px-3 py-1 rounded-full text-gray-300 border border-gray-700">
              👥 {participantCount + 1} in call
            </span>
          )}

          {/* HealthSync badge */}
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="text-lg">🏥</span>
            <span className="font-bold text-sm hidden sm:block">HealthSync</span>
          </div>

          {/* End call button */}
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 transition-all px-4 py-2 rounded-lg text-sm font-semibold"
          >
            <span>📵</span>
            <span className="hidden sm:block">End Call</span>
          </button>
        </div>
      </div>

      {/* ── Main Area ── */}
      <div className="flex-1 relative overflow-hidden">

        {/* Connecting overlay */}
        {status === 'connecting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gray-950 z-10">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center">
                <span className="text-4xl">🎥</span>
              </div>
              <div className="absolute -inset-2 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">Joining Video Call...</p>
              <p className="text-gray-400 text-sm mt-1">Setting up secure connection</p>
            </div>
            <div className="flex gap-2 mt-2">
              {['Camera', 'Microphone', 'Network'].map((item, i) => (
                <span
                  key={item}
                  className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full border border-gray-700"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {item === 'Camera' ? '📹' : item === 'Microphone' ? '🎙️' : '🌐'} {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gray-950 z-10 px-6 text-center">
            <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center">
              <span className="text-5xl">📵</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">Video Call Failed</h2>
              <p className="text-gray-400 text-sm mt-2 max-w-md">{videoError}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-lg font-medium text-sm"
              >
                🔄 Retry
              </button>
              <button
                onClick={() => navigate(-1)}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 active:scale-95 transition-all rounded-lg font-medium text-sm border border-gray-700"
              >
                ← Go Back
              </button>
            </div>
          </div>
        )}

        {/* Jitsi iframe container */}
        <div
          ref={jitsiContainerRef}
          className="w-full h-full"
          style={{ minHeight: 'calc(100vh - 57px)' }}
        />
      </div>

      {/* ── Footer ── */}
      <div className="bg-gray-900 border-t border-gray-800 px-5 py-2 flex items-center justify-center gap-2 flex-shrink-0">
        <span className="text-xs text-gray-500">Powered by</span>
        <span className="text-xs text-blue-400 font-semibold">Jitsi Meet</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-500">End-to-end encrypted</span>
        <span className="text-gray-700">·</span>
        <span className="text-xs text-gray-500">🔒 Secure</span>
      </div>
    </div>
  );
};

export default VideoRoom;
