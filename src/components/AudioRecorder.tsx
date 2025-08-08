import React, { useState, useRef, useEffect } from 'react';
import { 
  MicrophoneIcon,
  StopIcon,
  MusicalNoteIcon,
  SpeakerWaveIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

interface AudioRecorderProps {
  onRecordingComplete: (audioFile: File) => void;
  disabled?: boolean;
  className?: string;
}

interface AudioVisualizerProps {
  isRecording: boolean;
  audioStream?: MediaStream;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isRecording, audioStream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (isRecording && audioStream && canvasRef.current) {
      // Set up audio analysis
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(audioStream);
      source.connect(analyzerRef.current);
      
      startVisualization();
    } else {
      stopVisualization();
    }

    return () => {
      stopVisualization();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, audioStream]);

  const startVisualization = () => {
    if (!analyzerRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyzerRef.current || !ctx) return;

      analyzerRef.current.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8;

        const hue = (i / bufferLength) * 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const stopVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  if (!isRecording) {
    return (
      <div className="w-32 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <SignalIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={128}
      height={64}
      className="rounded-lg bg-gray-900"
    />
  );
};

export default function AudioRecorder({ onRecordingComplete, disabled, className = '' }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'song' | 'speech' | 'general'>('general');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const levelUpdateRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (levelUpdateRef.current) {
        cancelAnimationFrame(levelUpdateRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      audioStreamRef.current = stream;
      
      // Set up audio level monitoring
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        const fileName = `${recordingMode}-recording-${Date.now()}.${MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'mp4'}`;
        const audioFile = new File([audioBlob], fileName, { type: audioBlob.type });
        onRecordingComplete(audioFile);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start audio level monitoring
      updateAudioLevel();
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      setAudioLevel(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (levelUpdateRef.current) {
        cancelAnimationFrame(levelUpdateRef.current);
      }
    }
  };

  const updateAudioLevel = () => {
    if (!analyzerRef.current) return;

    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    setAudioLevel(average / 255);
    
    levelUpdateRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = () => {
    switch (recordingMode) {
      case 'song': return <MusicalNoteIcon className="w-4 h-4" />;
      case 'speech': return <SpeakerWaveIcon className="w-4 h-4" />;
      default: return <MicrophoneIcon className="w-4 h-4" />;
    }
  };

  const getModeColor = () => {
    switch (recordingMode) {
      case 'song': return 'from-purple-500 to-pink-500';
      case 'speech': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`flex flex-col items-center space-y-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
      
      {/* Recording Mode Selector */}
      <div className="flex space-x-2">
        {[
          { mode: 'song' as const, label: 'Song', icon: MusicalNoteIcon },
          { mode: 'speech' as const, label: 'Speech', icon: SpeakerWaveIcon },
          { mode: 'general' as const, label: 'General', icon: MicrophoneIcon }
        ].map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => setRecordingMode(mode)}
            disabled={isRecording || disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              recordingMode === mode
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <Icon className="w-3 h-3 inline mr-1" />
            {label}
          </button>
        ))}
      </div>

      {/* Audio Visualizer */}
      <AudioVisualizer isRecording={isRecording} audioStream={audioStreamRef.current || undefined} />

      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className={`p-4 bg-gradient-to-r ${getModeColor()} hover:shadow-lg text-white rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            title={`Record ${recordingMode}`}
          >
            {getModeIcon()}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="p-4 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg text-white rounded-full transition-all transform hover:scale-105 recording-pulse"
            title="Stop recording"
          >
            <StopIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* Recording Info */}
        {isRecording && (
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-red-500">
              {formatTime(recordingTime)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Recording {recordingMode}
            </div>
          </div>
        )}
      </div>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="w-full max-w-xs">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-100 ease-out"
              style={{ width: `${Math.min(audioLevel * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-center mt-1 text-gray-500 dark:text-gray-400">
            Audio Level: {Math.round(audioLevel * 100)}%
          </div>
        </div>
      )}

      {/* Recording Tips */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-sm">
        {recordingMode === 'song' && 'For best song identification, sing clearly for at least 15-30 seconds'}
        {recordingMode === 'speech' && 'Speak clearly and at a normal pace for best analysis'}
        {recordingMode === 'general' && 'Record any audio for analysis and feedback'}
      </div>
    </div>
  );
}
