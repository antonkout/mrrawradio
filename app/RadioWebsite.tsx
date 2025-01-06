'use client'
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import { Play, Pause, Volume2, Radio, Clock, Users, Share2, Instagram, Facebook } from 'lucide-react';

const RadioWebsite = () => {
  // State management
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [currentSong, setCurrentSong] = useState({
    title: 'Live Stream',
    artist: 'MR RAW RADIO',
    coverArt: '/logo.jpg'  // Using logo as default cover art
  });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>();

  // Audio Context setup for visualizer
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Scroll handler for parallax effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Audio visualizer setup
  useEffect(() => {
    if (isPlaying && audioRef.current && !audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = context.createMediaElementSource(audioRef.current);
      const analyserNode = context.createAnalyser();
      
      source.connect(analyserNode);
      analyserNode.connect(context.destination);
      
      setAudioContext(context);
      setAnalyser(analyserNode);
    }
  }, [isPlaying, audioContext]);

  // Visualizer animation
  const animate = useCallback(() => {
    if (canvasRef.current && analyser) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgba(30, 27, 75, 0.2)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = canvas.width / bufferLength * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, '#ec4899');  // pink-500
          gradient.addColorStop(1, '#a855f7');  // purple-500
          
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };
      
      draw();
    }
  }, [analyser]);

  useEffect(() => {
    if (isPlaying) {
      animate();
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Play/Pause handler
  const togglePlay = async () => {
    if (audioRef.current) {
      try {
        setIsLoading(true);
        setStreamError(null);
        
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          const playPromise = audioRef.current.play();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
          });

          await Promise.race([playPromise, timeoutPromise]);
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling audio:', error);
        setStreamError('Unable to connect to radio stream. Please try again.');
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Volume handler
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Smooth scroll handler
  const scrollToSection = useCallback((sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      e.preventDefault();
      const link = e.currentTarget as HTMLAnchorElement;
      scrollToSection(link.getAttribute('href')!.substring(1));
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => link.addEventListener('click', handleScroll));

    return () => {
      links.forEach(link => link.removeEventListener('click', handleScroll));
    };
  }, [scrollToSection]);

  // Initialize Chatango
  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'cid0020000397167357047';
    script.dataset.cfasync = 'false';
    script.async = true;
    script.src = '//st.chatango.com/js/gz/emb.js';
    script.style.width = '307px';
    script.style.height = '376px';
    script.innerHTML = '{"handle":"my-mrrawradio","arch":"js","styles":{"a":"5d246e","b":100,"c":"FFFFFF","d":"FFFFFF","j":"993399","k":"5d246e","l":"5d246e","m":"5d246e","n":"FFFFFF","p":"10","q":"5d246e","r":100,"t":0,"ab":false,"usricon":0,"sbc":"ec4899","surl":0,"allowpm":0,"cnrs":"0.35","fwtickm":1}}';
    
    const chatContainer = document.getElementById('chatango-container');
    if (chatContainer) {
      chatContainer.appendChild(script);
    }
  
    return () => {
      const existingScript = document.getElementById('cid0020000397167357047');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen animate-gradient text-white pt-16 relative">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="https://play.radioking.io/mrrawradio"
        preload="none"
        crossOrigin="anonymous"
      />

      {/* Background Logo with Parallax */}
      <div 
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-20 transition-transform duration-1000"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      >
        <div className="relative w-[800px] h-[800px]">
          <Image
            src="/logo.jpg"
            alt="Background Logo"
            fill
            className="rounded-full object-cover"
            priority
          />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">
            MR RAW RADIO
          </h1>
          <div className="hidden md:flex space-x-6">
            <a href="#home" className="hover:text-pink-500 transition-colors">Home</a>
            <a href="#schedule" className="hover:text-pink-500 transition-colors">Schedule</a>
            <a href="#chat" className="hover:text-pink-500 transition-colors">Chat</a>
            <a href="#djs" className="hover:text-pink-500 transition-colors">DJs</a>
            <a href="#connect" className="hover:text-pink-500 transition-colors">Connect</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20">
        {/* Hero Section */}
        <section id="home" className="text-center py-20 animate-fadeIn">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 text-transparent bg-clip-text">
            Raw. Real. Radio.
          </h1>
          <p className="text-xl text-pink-300">Where Raw Meats Radio</p>
        </section>

        {/* Schedule Section */}
        <section id="schedule" className="mb-16 animate-fadeIn">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-pink-500" />
            <h2 className="text-2xl font-bold">Live Shows</h2>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 h-full w-1 bg-pink-500/20"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pl-8">
              <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-lg backdrop-blur-sm border border-zinc-700/30 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
                <h3 className="text-xl font-bold mb-2 text-pink-400">Morning Raw</h3>
                <p className="text-cyan-300 mb-4">Mon-Fri • 6:00 AM - 10:00 AM</p>
                <p className="text-zinc-300">Start your day with the freshest tracks and raw energy</p>
              </div>
            </div>
          </div>
        </section>

        {/* DJs Section */}
        <section id="djs" className="mb-16 animate-fadeIn">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-pink-500" />
            <h2 className="text-2xl font-bold">Our DJs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 p-6 rounded-lg backdrop-blur-sm border border-zinc-700/30 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-pink-500/20">
              <div className="w-24 h-24 relative mx-auto mb-4">
                <Image
                  src="/dj1.jpg"
                  alt="Dr Kou"
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  priority
                />
              </div>
              <h3 className="text-lg font-bold mb-1 text-pink-400">Dr Kou</h3>
              <p className="text-cyan-300">Morning Raw</p>
            </div>
          </div>
        </section>

        {/* Chat Section */}
        <section id="chat" className="fixed right-4 top-20 z-40">
          <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-lg backdrop-blur-sm border border-zinc-700/30 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="text-pink-500" />
              <h2 className="text-xl font-bold">Live Chat</h2>
            </div>
            <div id="chatango-container"></div>
          </div>
        </section>

        {/* Social Links */}
        <section id="connect" className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Share2 className="text-pink-500" />
            <h2 className="text-2xl font-bold">Connect With Us</h2>
          </div>
          <div className="flex justify-center gap-6">
            <a 
              href="https://www.instagram.com/mr_rawradio/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-pink-400 hover:text-pink-300 transition-colors"
            >
              Instagram
            </a>
            <a 
              href="https://www.facebook.com/mrrawradio/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Facebook
            </a>
          </div>
        </section>
      </main>


      {/* Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-sm border-t border-zinc-700/30">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={togglePlay}
              className="p-2 hover:bg-pink-500/20 rounded-full transition-colors"
              aria-label={isPlaying ? 'Pause Radio Stream' : 'Play Radio Stream'}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} className="text-pink-500" />
              ) : (
                <Play size={20} className="text-pink-500" />
              )}
            </button>
            
            {/* Current Song Info */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 relative rounded overflow-hidden">
                <Image
                  src={currentSong.coverArt}
                  alt="Cover Art"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <div className="text-sm text-pink-400">Now Playing</div>
                <div className="font-semibold">{currentSong.title}</div>
                <div className="text-sm text-zinc-400">{currentSong.artist}</div>
                {streamError && (
                  <div className="text-red-400 text-sm mt-1">{streamError}</div>
                )}
              </div>
            </div>

            {/* Audio Visualizer */}
            <canvas 
              ref={canvasRef}
              className="h-12 flex-1 mx-4 opacity-75" 
              width={600}
              height={48}
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Volume2 size={20} className="text-pink-500" />
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 accent-pink-500"
              aria-label="Volume Control"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadioWebsite;