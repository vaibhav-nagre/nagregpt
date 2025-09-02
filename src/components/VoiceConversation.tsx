import { useState, useEffect, useRef } from 'react';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  MicrophoneIcon as MicrophoneSolidIcon,
  SpeakerWaveIcon as SpeakerWaveSolidIcon
} from '@heroicons/react/24/solid';
import { voiceSystem } from '../services/voiceSystem';

interface VoiceConversationProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

export default function VoiceConversation({ 
  onSendMessage, 
  isLoading = false,
  className = '' 
}: VoiceConversationProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(0.8);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize voice system and check capabilities
    const capabilities = voiceSystem.getCapabilities();
    setVoiceEnabled(capabilities.speechRecognition && capabilities.speechSynthesis);
    
    if (capabilities.speechSynthesis) {
      const availableVoices = voiceSystem.getAvailableVoices();
      setVoices(availableVoices);
      
      // Set default voice
      const defaultVoice = availableVoices.find(v => v.default) || availableVoices[0];
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.name);
      }
    }

    // Test voice system
    voiceSystem.testVoice().catch(err => {
      console.warn('Voice test failed:', err);
    });
  }, []);

  const startListening = async () => {
    if (!voiceEnabled || isLoading) return;

    setError(null);
    setTranscript('');
    setConfidence(0);

    const success = voiceSystem.startListening(
      (text, conf) => {
        setTranscript(text);
        setConfidence(conf);
      },
      () => {
        setIsListening(false);
        // Auto-send if we have good transcript
        if (transcript.trim() && confidence > 0.7) {
          handleSendVoiceMessage();
        }
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );

    if (success) {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    voiceSystem.stopListening();
    setIsListening(false);
  };

  const handleSendVoiceMessage = () => {
    if (transcript.trim()) {
      onSendMessage(transcript.trim());
      setTranscript('');
      setConfidence(0);
    }
  };

  const speakText = async (text: string) => {
    if (!voiceEnabled || !text.trim()) return;

    setIsSpeaking(true);
    setError(null);

    try {
      await voiceSystem.speak(text, {
        rate: speechRate,
        pitch: speechPitch,
        volume: speechVolume,
        voice: selectedVoice,
        onEnd: () => setIsSpeaking(false),
        onError: (err) => {
          setError(err);
          setIsSpeaking(false);
        }
      });
    } catch (err) {
      console.error('Speech failed:', err);
      setError('Failed to speak text');
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    voiceSystem.stopSpeaking();
    setIsSpeaking(false);
  };

  const updateVoiceConfig = () => {
    voiceSystem.setVoiceConfig({
      voice: voices.find(v => v.name === selectedVoice) || null,
      rate: speechRate,
      pitch: speechPitch,
      volume: speechVolume
    });
  };

  useEffect(() => {
    updateVoiceConfig();
  }, [selectedVoice, speechRate, speechPitch, speechVolume]);

  if (!voiceEnabled) {
    return (
      <div className={`voice-conversation-disabled ${className}`}>
        <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <MicrophoneIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Voice conversation not supported in this browser
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`voice-conversation ${className}`}>
      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
        {/* Listen Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading || isSpeaking}
          className={`relative p-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
          }`}
          title={isListening ? 'Stop listening' : 'Start voice conversation'}
        >
          {isListening ? (
            <MicrophoneSolidIcon className="w-6 h-6" />
          ) : (
            <MicrophoneIcon className="w-6 h-6" />
          )}
          
          {/* Listening indicator */}
          {isListening && (
            <div className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping"></div>
          )}
        </button>

        {/* Speak Button */}
        <button
          onClick={isSpeaking ? stopSpeaking : () => speakText('Hello! I am ready to have a voice conversation with you.')}
          disabled={isLoading || isListening}
          className={`p-4 rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
            isSpeaking 
              ? 'bg-green-500 hover:bg-green-600 text-white animate-pulse' 
              : 'bg-purple-500 hover:bg-purple-600 text-white shadow-lg'
          }`}
          title={isSpeaking ? 'Stop speaking' : 'Test voice'}
        >
          {isSpeaking ? (
            <SpeakerWaveSolidIcon className="w-6 h-6" />
          ) : (
            <SpeakerWaveIcon className="w-6 h-6" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-full bg-gray-500 hover:bg-gray-600 text-white transition-all duration-300 transform hover:scale-105"
          title="Voice settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Transcript Display */}
      {(transcript || isListening) && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isListening ? 'Listening...' : 'Voice Input'}
            </h4>
            {confidence > 0 && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                confidence > 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                confidence > 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {Math.round(confidence * 100)}% confidence
              </span>
            )}
          </div>
          
          <div 
            ref={transcriptRef}
            className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-700 rounded border text-gray-900 dark:text-gray-100"
          >
            {transcript || (isListening ? 'Speak now...' : 'No speech detected')}
          </div>

          {transcript && !isListening && (
            <div className="flex justify-end mt-2 space-x-2">
              <button
                onClick={() => {
                  setTranscript('');
                  setConfidence(0);
                }}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear
              </button>
              <button
                onClick={handleSendVoiceMessage}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Send Message
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voice Settings */}
      {showSettings && (
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Voice Settings</h4>
          
          {/* Voice Selection */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {voices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speed Control */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Speed: {speechRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Pitch Control */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Pitch: {speechPitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Volume: {Math.round(speechVolume * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={speechVolume}
                onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>

            {/* Test Button */}
            <button
              onClick={() => speakText('This is a test of the voice system with your current settings.')}
              disabled={isSpeaking}
              className="w-full px-3 py-2 text-xs bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white rounded transition-colors"
            >
              {isSpeaking ? 'Speaking...' : 'Test Voice'}
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">⚠️ {error}</p>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-4 flex justify-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
        <div className={`flex items-center space-x-1 ${isListening ? 'text-red-500' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span>Listening</span>
        </div>
        <div className={`flex items-center space-x-1 ${isSpeaking ? 'text-green-500' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span>Speaking</span>
        </div>
        <div className={`flex items-center space-x-1 ${isLoading ? 'text-blue-500' : ''}`}>
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span>Processing</span>
        </div>
      </div>
    </div>
  );
}
