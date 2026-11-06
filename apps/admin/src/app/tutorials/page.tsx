'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Heading2,
  AlertCircle,
  Table as TableIcon,
  List,
  Compass,
  Globe,
  Save,
  Download,
  PlusCircle,
  Mic,
  MicOff,
} from 'lucide-react';
import { ShellLayout } from '@/components/shell';
import { Badge } from '@multi-site-cms/ui';

interface ToolbarChapter {
  id: string;
  time: number;
  toolName: string;
  toolRole: string;
  audioFile: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOOLBAR_GUIDE: ToolbarChapter[] = [
  {
    id: 'login',
    time: 0,
    toolName: '1. Admin Sign In',
    toolRole: 'Authenticating Ashiqur Rahaman for Travel Blog & Air Sports.',
    audioFile: '/videos/step_login.wav',
    icon: Globe,
  },
  {
    id: 'dashboard',
    time: 9,
    toolName: '2. Dashboard & New Post',
    toolRole: 'Navigating to /posts/new to create a canonical post from scratch.',
    audioFile: '/videos/step_dashboard.wav',
    icon: PlusCircle,
  },
  {
    id: 'destination',
    time: 14,
    toolName: '3. Destination Info Card',
    toolRole: 'Click tool, fill modal (Sajek Valley), insert rich travel block.',
    audioFile: '/videos/step_destination.wav',
    icon: Compass,
  },
  {
    id: 'heading2',
    time: 28,
    toolName: '4. Heading 2 (H2)',
    toolRole: 'Creating bold section titles for clear content structure.',
    audioFile: '/videos/step_heading2.wav',
    icon: Heading2,
  },
  {
    id: 'callout',
    time: 35,
    toolName: '5. Callout Box (Alerts)',
    toolRole: 'Inserting high-priority travel warnings & escort notices.',
    audioFile: '/videos/step_callout.wav',
    icon: AlertCircle,
  },
  {
    id: 'table',
    time: 53,
    toolName: '6. 3x3 Data Table',
    toolRole: 'Inserting table to compare viewpoints, attractions & transit.',
    audioFile: '/videos/step_table.wav',
    icon: TableIcon,
  },
  {
    id: 'list',
    time: 68,
    toolName: '7. Bullet List & Bold Text',
    toolRole: 'Formatting gear checklists with bold emphasized tips.',
    audioFile: '/videos/step_list.wav',
    icon: List,
  },
  {
    id: 'publications',
    time: 86,
    toolName: '8. Multi-Site Publications',
    toolRole: 'Configuring Travel Blog & Air Sports categories and SEO.',
    audioFile: '/videos/step_publications.wav',
    icon: Globe,
  },
  {
    id: 'save',
    time: 95,
    toolName: '9. Create Post & Save',
    toolRole: 'Saving canonical post to database & redirecting to edit mode.',
    audioFile: '/videos/step_save.wav',
    icon: Save,
  },
];

function getChapter(idx: number): ToolbarChapter {
  return TOOLBAR_GUIDE[idx] ?? TOOLBAR_GUIDE[0]!;
}

export default function VideoTutorialPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(104);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Play audio clip for a specific chapter
  const playChapterAudio = useCallback((chapter: ToolbarChapter) => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.src = chapter.audioFile;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    let currentIdx = 0;
    for (let i = 0; i < TOOLBAR_GUIDE.length; i++) {
      const ch = getChapter(i);
      if (time >= ch.time) {
        currentIdx = i;
      }
    }
    if (currentIdx !== activeChapterIndex) {
      setActiveChapterIndex(currentIdx);
      if (voiceEnabled && isPlaying) {
        playChapterAudio(getChapter(currentIdx));
      }
    }
  };

  const jumpToChapter = (index: number) => {
    if (!videoRef.current) return;
    const target = getChapter(index);
    videoRef.current.currentTime = target.time;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setActiveChapterIndex(index);
    if (voiceEnabled) {
      playChapterAudio(target);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      if (voiceEnabled) {
        playChapterAudio(getChapter(activeChapterIndex));
      }
    }
  };

  const restartVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => {});
    setIsPlaying(true);
    setActiveChapterIndex(0);
    if (voiceEnabled) {
      playChapterAudio(getChapter(0));
    }
  };

  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx] ?? 1.0;
    videoRef.current.playbackRate = newSpeed;
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next && isPlaying) {
      playChapterAudio(getChapter(activeChapterIndex));
    } else if (!next && audioRef.current) {
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const activeChapter = getChapter(activeChapterIndex);

  return (
    <ShellLayout>
      {/* Hidden audio element for synchronous human voice narration */}
      <audio ref={audioRef} preload="auto" />

      {/* Full-width container maximizing canvas area */}
      <div className="w-full flex flex-col gap-3 pb-8">
        {/* Sleek Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-xs">
          <div className="flex items-center gap-2.5">
            <Badge className="bg-brand-400 text-brand-950 font-bold px-2 py-0.5 text-[11px]">
              Masterclass Video
            </Badge>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">
                How to Create a Post & Master Every Editorial Toolbar Tool
              </h1>
              <p className="text-[11px] text-slate-500">
                Step-by-step creation tutorial showing each tool in action and how it renders in the
                content body.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/posts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <PlusCircle className="size-3.5 text-brand-400" />
              <span>Open Post Editor</span>
            </Link>
            <a
              href="/videos/admin-tutorial.webm"
              download="editorial-toolbar-masterclass.webm"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-400 hover:bg-brand-300 text-brand-950 text-xs font-bold transition-all"
            >
              <Download className="size-3.5" />
              <span>Download Video</span>
            </a>
          </div>
        </div>

        {/* Theater Workspace Grid: Video Player + Synchronized Toolbar Timeline */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-start w-full">
          {/* Main Video Viewport (XL: 8 cols) */}
          <div className="xl:col-span-8 flex flex-col gap-2.5">
            <div className="relative group overflow-hidden rounded-2xl bg-black border border-slate-800 shadow-xl aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                src="/videos/admin-tutorial.webm"
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration || 104);
                }}
                onEnded={() => setIsPlaying(false)}
                playsInline
              >
                <track
                  src="/videos/admin-tutorial.vtt"
                  kind="subtitles"
                  srcLang="en"
                  label="English"
                  default
                />
              </video>

              {/* Center Play Overlay */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute z-10 size-16 rounded-full bg-brand-400 text-brand-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  aria-label="Play Tutorial"
                >
                  <Play className="w-7 h-7 fill-brand-950 ml-1" />
                </button>
              )}

              {/* Active Subtitle Cue Banner */}
              <div className="absolute top-3 left-3 right-3 pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/80 backdrop-blur-md text-white text-xs border border-white/10 shadow-md">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-brand-300">{activeChapter.toolName}:</span>
                  <span className="text-slate-200 truncate">{activeChapter.toolRole}</span>
                </div>
              </div>

              {/* Player Controls */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                {/* Scrub Bar */}
                <div
                  className="w-full h-2 rounded-full bg-white/20 hover:h-2.5 transition-all cursor-pointer overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percent = clickX / rect.width;
                    if (videoRef.current) {
                      videoRef.current.currentTime = percent * duration;
                    }
                  }}
                >
                  <div
                    className="h-full bg-brand-400 transition-all duration-100"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={restartVideo}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Restart Video"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <span className="font-mono text-[11px] text-slate-500">
                      {Math.floor(currentTime)}s / {Math.floor(duration)}s
                    </span>

                    <button
                      type="button"
                      onClick={cycleSpeed}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 font-mono text-[10px] font-bold"
                      title="Playback Speed"
                    >
                      {playbackRate}x
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Synchronized Human Voice Toggle */}
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        voiceEnabled
                          ? 'bg-emerald-400 text-slate-950 shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-slate-500'
                      }`}
                      title="Toggle Synchronized English Voice Narration"
                    >
                      {voiceEnabled ? (
                        <Mic className="size-3.5" />
                      ) : (
                        <MicOff className="size-3.5" />
                      )}
                      <span>{voiceEnabled ? 'Voice Narration: ON' : 'Voice Narration: OFF'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (videoRef.current) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen().catch(() => {});
                          } else {
                            videoRef.current.requestFullscreen().catch(() => {});
                          }
                        }
                      }}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Active Tool Spotlight Card */}
            <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
                  <activeChapter.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {activeChapter.toolName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      @ {activeChapter.time}s
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {activeChapter.toolRole}
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Step {activeChapterIndex + 1} of {TOOLBAR_GUIDE.length}
              </span>
            </div>
          </div>

          {/* Synchronized Toolbar Timeline & Action Guide (XL: 4 cols) */}
          <div className="xl:col-span-4 flex flex-col gap-2 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Tools Used In Content Creation
              </h2>
              <span className="text-[10px] text-slate-500">Click tool to jump</span>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[580px] overflow-y-auto pr-1">
              {TOOLBAR_GUIDE.map((ch, idx) => {
                const isActive = activeChapterIndex === idx;
                const Icon = ch.icon;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => jumpToChapter(idx)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                      isActive
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/60 shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-brand-400 text-brand-950 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            isActive
                              ? 'font-bold text-brand-950 dark:text-brand-300'
                              : 'font-semibold text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {ch.toolName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0">
                          {ch.time}s
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug">
                        {ch.toolRole}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
