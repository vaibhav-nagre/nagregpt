// Song Identification Service using multiple providers
// This integrates with real-world song databases like ACRCloud, Shazam API, etc.

export interface SongIdentificationResult {
  success: boolean;
  confidence: number;
  song?: {
    title: string;
    artist: string;
    album?: string;
    releaseDate?: string;
    duration?: number;
    genre?: string[];
    label?: string;
    isrc?: string;
    externalIds?: {
      spotify?: string;
      apple?: string;
      youtube?: string;
      deezer?: string;
    };
    artwork?: {
      small?: string;
      medium?: string;
      large?: string;
    };
  };
  matches?: Array<{
    title: string;
    artist: string;
    confidence: number;
    timeOffset?: number;
  }>;
  error?: string;
}

export class SongIdentificationAPI {
  private static readonly PROVIDERS = {
    ACRCLOUD: 'acrcloud',
    SHAZAM: 'shazam',
    AUDD: 'audd',
    MUSICBRAINZ: 'musicbrainz'
  };

  // Main identification function that tries multiple providers
  static async identifySong(audioFile: File): Promise<SongIdentificationResult> {
    console.log('🎵 Starting song identification for:', audioFile.name);
    
    // Try providers in order of reliability
    const providers = [
      () => this.identifyWithACRCloud(audioFile),
      () => this.identifyWithShazamAPI(audioFile),
      () => this.identifyWithAuddAPI(audioFile),
      () => this.identifyWithMusicBrainz(audioFile)
    ];

    for (const provider of providers) {
      try {
        const result = await provider();
        if (result.success && result.confidence > 0.5) {
          console.log('✅ Song identified successfully:', result.song?.title);
          return result;
        }
      } catch (error) {
        console.warn('🔄 Provider failed, trying next...', error);
        continue;
      }
    }

    // If all providers fail, return a fallback result
    return this.createFallbackResult();
  }

  // ACRCloud API (most accurate, used by Shazam)
  private static async identifyWithACRCloud(audioFile: File): Promise<SongIdentificationResult> {
    try {
      // Convert audio to the format expected by ACRCloud
      const audioData = await this.processAudioForACRCloud(audioFile);
      
      // ACRCloud requires specific audio format and fingerprinting
      const formData = new FormData();
      formData.append('sample', audioFile);
      formData.append('sample_bytes', audioData.byteLength.toString());
      formData.append('access_key', import.meta.env.VITE_ACRCLOUD_ACCESS_KEY || '');
      
      const response = await fetch('https://identify-eu-west-1.acrcloud.com/v1/identify', {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'NagreGPT/1.0'
        }
      });

      const data = await response.json();
      
      if (data.status.code === 0 && data.metadata?.music?.length > 0) {
        const match = data.metadata.music[0];
        return {
          success: true,
          confidence: (match.score || 0) / 100,
          song: {
            title: match.title,
            artist: match.artists?.[0]?.name || 'Unknown Artist',
            album: match.album?.name,
            releaseDate: match.release_date,
            duration: match.duration_ms ? match.duration_ms / 1000 : undefined,
            genre: match.genres?.map((g: any) => g.name),
            label: match.label,
            isrc: match.external_ids?.isrc,
            externalIds: {
              spotify: match.external_ids?.spotify?.track,
              apple: match.external_ids?.itunes?.track,
              youtube: match.external_ids?.youtube?.vid,
              deezer: match.external_ids?.deezer?.track
            }
          }
        };
      }
    } catch (error) {
      console.error('ACRCloud identification failed:', error);
    }

    return { success: false, confidence: 0 };
  }

  // Shazam API (RapidAPI)
  private static async identifyWithShazamAPI(audioFile: File): Promise<SongIdentificationResult> {
    try {
      const formData = new FormData();
      formData.append('upload_file', audioFile);

      const response = await fetch('https://shazam.p.rapidapi.com/songs/v2/detect', {
        method: 'POST',
        body: formData,
        headers: {
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY || '',
          'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
        }
      });

      const data = await response.json();
      
      if (data.matches && data.matches.length > 0) {
        const match = data.matches[0];
        return {
          success: true,
          confidence: match.frequencyskew || 0.8,
          song: {
            title: match.track?.title,
            artist: match.track?.subtitle,
            album: match.track?.sections?.[0]?.metadata?.find((m: any) => m.title === 'Album')?.text,
            genre: [match.track?.genres?.primary],
            externalIds: {
              spotify: match.track?.hub?.providers?.find((p: any) => p.type === 'SPOTIFY')?.actions?.[0]?.uri,
              apple: match.track?.hub?.providers?.find((p: any) => p.type === 'APPLEMUSIC')?.actions?.[0]?.uri
            },
            artwork: {
              small: match.track?.images?.coverart,
              medium: match.track?.images?.coverarthq,
              large: match.track?.images?.joecolor
            }
          }
        };
      }
    } catch (error) {
      console.error('Shazam API identification failed:', error);
    }

    return { success: false, confidence: 0 };
  }

  // Audd.io API (free tier available)
  private static async identifyWithAuddAPI(audioFile: File): Promise<SongIdentificationResult> {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('return', 'apple_music,spotify,deezer,napster');
      formData.append('api_token', process.env.VITE_AUDD_API_TOKEN || '');

      const response = await fetch('https://api.audd.io/', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.result) {
        const result = data.result;
        return {
          success: true,
          confidence: 0.7, // Audd doesn't provide confidence scores
          song: {
            title: result.title,
            artist: result.artist,
            album: result.album,
            releaseDate: result.release_date,
            label: result.label,
            externalIds: {
              spotify: result.spotify?.external_urls?.spotify,
              apple: result.apple_music?.url,
              deezer: result.deezer?.link
            }
          }
        };
      }
    } catch (error) {
      console.error('Audd.io identification failed:', error);
    }

    return { success: false, confidence: 0 };
  }

  // MusicBrainz API (open source, lower accuracy)
  private static async identifyWithMusicBrainz(audioFile: File): Promise<SongIdentificationResult> {
    try {
      // MusicBrainz doesn't do audio fingerprinting directly
      // This would require AcoustID integration
      console.log('MusicBrainz identification requires AcoustID integration');
      
      // For now, return failure - this would need audio fingerprinting
      return { success: false, confidence: 0 };
    } catch (error) {
      console.error('MusicBrainz identification failed:', error);
    }

    return { success: false, confidence: 0 };
  }

  // Process audio for ACRCloud (requires specific format)
  private static async processAudioForACRCloud(audioFile: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(audioFile);
    });
  }

  // Enhanced fingerprinting for better accuracy
  static async generateAudioFingerprint(audioBuffer: AudioBuffer): Promise<string> {
    // This is a simplified fingerprinting algorithm
    // In production, you'd use more sophisticated algorithms like Chromaprint
    
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    
    // Extract features at different time windows
    const features = [];
    const windowSize = Math.floor(sampleRate * 0.1); // 100ms windows
    
    for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
      const window = channelData.slice(i, i + windowSize);
      
      // Calculate spectral features
      const energy = window.reduce((sum, val) => sum + val * val, 0) / window.length;
      const zeroCrossings = this.countZeroCrossings(window);
      const spectralCentroid = this.calculateSpectralCentroid(window);
      
      features.push({
        energy: Math.round(energy * 1000),
        zc: zeroCrossings,
        sc: Math.round(spectralCentroid * 100)
      });
    }
    
    // Convert features to a hash-like fingerprint
    return features.map(f => `${f.energy}:${f.zc}:${f.sc}`).join('|');
  }

  private static countZeroCrossings(signal: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < signal.length; i++) {
      if (signal[i] * signal[i-1] < 0) {
        crossings++;
      }
    }
    return crossings;
  }

  private static calculateSpectralCentroid(signal: Float32Array): number {
    // Simplified spectral centroid calculation
    let weightedSum = 0;
    let magnitudeSum = 0;
    
    for (let i = 0; i < signal.length; i++) {
      const magnitude = Math.abs(signal[i]);
      weightedSum += i * magnitude;
      magnitudeSum += magnitude;
    }
    
    return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
  }

  // Fallback when no providers work
  private static createFallbackResult(): SongIdentificationResult {
    return {
      success: false,
      confidence: 0,
      error: 'Unable to identify song. This could be due to:\n' +
             '• Song not in database\n' +
             '• Audio quality too low\n' +
             '• Background noise interference\n' +
             '• Recording too short (try 15-30 seconds)\n' +
             '• Original song vs cover/remix differences'
    };
  }

  // Get song lyrics from Genius API
  static async getLyrics(songTitle: string, artist: string): Promise<string | null> {
    try {
      const query = encodeURIComponent(`${songTitle} ${artist}`);
      const response = await fetch(`https://api.genius.com/search?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_GENIUS_ACCESS_TOKEN || ''}`,
        }
      });

      const data = await response.json();
      
      if (data.response?.hits?.length > 0) {
        const songUrl = data.response.hits[0].result.url;
        // Note: Genius doesn't provide lyrics directly via API
        // You'd need to scrape or use a lyrics API service
        return `Lyrics available at: ${songUrl}`;
      }
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
    }
    
    return null;
  }

  // Enhanced search with similarity matching
  static async searchSimilarSongs(songTitle: string, artist: string): Promise<any[]> {
    try {
      // Use Spotify API for similar song recommendations
      const response = await fetch(`https://api.spotify.com/v1/search?q=track:${encodeURIComponent(songTitle)}%20artist:${encodeURIComponent(artist)}&type=track&limit=1`, {
        headers: {
          'Authorization': `Bearer ${process.env.VITE_SPOTIFY_ACCESS_TOKEN || ''}`,
        }
      });

      const data = await response.json();
      
      if (data.tracks?.items?.length > 0) {
        const trackId = data.tracks.items[0].id;
        
        // Get recommendations based on this track
        const recResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_tracks=${trackId}&limit=10`, {
          headers: {
            'Authorization': `Bearer ${process.env.VITE_SPOTIFY_ACCESS_TOKEN || ''}`,
          }
        });

        const recData = await recResponse.json();
        return recData.tracks || [];
      }
    } catch (error) {
      console.error('Failed to find similar songs:', error);
    }
    
    return [];
  }
}
