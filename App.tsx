import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Skull, Activity, Fingerprint, RefreshCcw, Share2 } from 'lucide-react';
import { AppStage, AnalysisResult } from './types';
import { analyzeVictim } from './services/geminiService';
import { GlitchText } from './components/GlitchText';

export const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.INTRO);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingText, setLoadingText] = useState<string>("Initializing...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Intro cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Attach stream to video element when stream changes and video element is ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, stage]);

  const startCamera = async () => {
    try {
      setStage(AppStage.CAMERA);
      
      let mediaStream: MediaStream;
      try {
        // First try to get the front camera specifically
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' },
          audio: false
        });
      } catch (err) {
        console.warn("Facing mode 'user' not found, falling back to basic video.", err);
        // Fallback to any available video device
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        });
      }
      
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera denied or not found", err);
      setStage(AppStage.ERROR);
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    // Capture frame
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
    
    // Stop camera to freeze frame effect
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }

    setStage(AppStage.PROCESSING);
    
    // Fake loading steps for suspense
    const steps = [
      "正在入侵生物神经网络...",
      "解析微表情数据...",
      "比对全球通缉犯数据库...",
      "检测到异常脑电波...",
      "生成最终审判报告..."
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setLoadingText(steps[stepIndex]);
        stepIndex++;
      }
    }, 800);

    try {
      const analysis = await analyzeVictim(imageBase64);
      clearInterval(interval);
      // Wait a bit for the last text to show
      setTimeout(() => {
        setResult(analysis);
        setStage(AppStage.RESULT);
      }, 1000);
    } catch (e) {
      clearInterval(interval);
      setStage(AppStage.ERROR);
    }

  }, [stream]);

  const resetApp = () => {
    setStage(AppStage.INTRO);
    setResult(null);
  };

  // Render Helpers
  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-8 animate-fade-in">
      <div className="border-4 border-green-500 p-6 rounded-lg shadow-[0_0_20px_#0f0] bg-black/80">
        <Skull size={64} className="text-green-500 mx-auto mb-4 animate-pulse" />
        <GlitchText text="AI 灵魂审判" className="text-4xl text-green-500 mb-2" />
        <p className="text-green-400 font-mono text-sm mt-4">
          警告：本系统使用军用级AI算法解析你的人格缺陷。心理承受能力差者请立即退出。
        </p>
      </div>
      
      <button 
        onClick={startCamera}
        className="group relative px-8 py-4 bg-green-900/30 border border-green-500 text-green-500 font-bold uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all duration-300 w-full max-w-xs"
      >
        <span className="flex items-center justify-center gap-2">
          <Fingerprint /> 开始扫描
        </span>
        <div className="absolute inset-0 border border-green-500 blur opacity-30 group-hover:opacity-100 transition-opacity"></div>
      </button>

      <div className="text-xs text-green-800 absolute bottom-4">
        v6.6.6 | SYSTEM_ROOT_ACCESS: GRANTED
      </div>
    </div>
  );

  const renderCamera = () => (
    <div className="relative h-full w-full flex flex-col bg-black">
      <div className="relative flex-1 overflow-hidden">
        {/* Fake UI Overlay */}
        <div className="absolute inset-0 border-[2px] border-green-900 z-20 pointer-events-none m-4 rounded-lg">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
          
          <div className="scan-line"></div>
          
          <div className="absolute top-4 left-4 text-green-500 text-xs font-mono">
            REC ● [{(Math.random() * 99).toFixed(2)}%]
          </div>
          <div className="absolute bottom-4 right-4 text-green-500 text-xs font-mono animate-pulse">
            TARGET_LOCKED
          </div>
        </div>

        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover filter contrast-125 brightness-90 grayscale-[0.3]"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="h-32 bg-black flex items-center justify-center border-t border-green-900">
        <button 
          onClick={captureAndAnalyze}
          className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center bg-green-900/20 active:bg-green-500/50 transition-all"
        >
          <div className="w-16 h-16 bg-green-500 rounded-full animate-pulse"></div>
        </button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-black text-green-500 font-mono">
      <Activity size={64} className="animate-spin mb-8 text-green-400" />
      <div className="w-full max-w-md border border-green-800 h-6 p-1 relative mb-4">
        <div className="h-full bg-green-600 animate-[width_3s_ease-in-out_infinite] w-full origin-left"></div>
      </div>
      <p className="text-xl text-center glitch">{loadingText}</p>
      <div className="mt-8 text-xs text-green-800 w-full overflow-hidden whitespace-nowrap">
        {Array(20).fill("010110101001 ERROR CRITICAL FAILURE ").map((s, i) => (
          <span key={i} className="inline-block animate-marquee">{s}</span>
        ))}
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="h-full overflow-y-auto p-6 bg-black text-green-500 font-mono animate-fade-in flex flex-col">
      <div className="border-b-2 border-green-500 pb-4 mb-6">
        <h2 className="text-sm text-green-700 uppercase tracking-widest">Analysis Report #9921</h2>
        <h1 className="text-3xl font-bold mt-2 text-white glitch">{result?.title}</h1>
      </div>

      <div className="flex items-center gap-4 mb-8 p-4 bg-green-900/10 border border-green-800 rounded">
        <div className="flex-1">
          <div className="text-xs text-green-400 mb-1">废柴指数 (Hopelessness)</div>
          <div className="h-4 bg-gray-900 rounded overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-red-600" 
              style={{width: `${result?.dangerLevel}%`}}
            ></div>
          </div>
        </div>
        <div className="text-2xl font-bold text-red-500">{result?.dangerLevel}%</div>
      </div>

      <div className="flex-1 space-y-4">
        <p className="text-lg leading-relaxed text-green-300 border-l-4 border-green-500 pl-4 py-2 bg-green-900/5">
          {result?.roast}
        </p>
        
        <div className="mt-8 p-4 border border-dashed border-green-700 text-xs text-green-600 text-center">
          * 此结果由AI根据面相学与量子力学生成，如有雷同，纯属你倒霉。*
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button 
          onClick={resetApp}
          className="flex-1 py-3 border border-green-600 text-green-500 flex items-center justify-center gap-2 hover:bg-green-900/30"
        >
          <RefreshCcw size={18} /> 再测一次
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black text-green-500 overflow-hidden">
      {/* Background Matrix Effect (Simplified) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 0, .3) 25%, rgba(0, 255, 0, .3) 26%, transparent 27%, transparent 74%, rgba(0, 255, 0, .3) 75%, rgba(0, 255, 0, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px'}}>
      </div>

      {stage === AppStage.INTRO && renderIntro()}
      {stage === AppStage.CAMERA && renderCamera()}
      {stage === AppStage.PROCESSING && renderProcessing()}
      {stage === AppStage.RESULT && renderResult()}
      {stage === AppStage.ERROR && (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠</div>
          <h2 className="text-red-500 text-xl font-bold mb-4">SYSTEM ERROR</h2>
          <p className="text-green-700 mb-8">检测到你的手机摄像头被异物遮挡（或者是你没给权限）。</p>
          <button onClick={() => setStage(AppStage.INTRO)} className="border border-red-500 text-red-500 px-6 py-2">
            REBOOT
          </button>
        </div>
      )}
    </div>
  );
};