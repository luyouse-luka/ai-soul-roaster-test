import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Skull, Fingerprint, RefreshCcw, AlertTriangle } from 'lucide-react';
import { AppStage, AnalysisResult } from './types';
import { analyzeVictim } from './services/geminiService';
import { GlitchText } from './components/GlitchText';

export const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.INTRO);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingText, setLoadingText] = useState<string>("初始化中...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, stage]);

  const startCamera = async () => {
    try {
      setStage(AppStage.CAMERA);
      // 优先使用前置摄像头
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 1280 }
        },
        audio: false
      });
      setStream(mediaStream);
    } catch (err) {
      console.error(err);
      alert("无法启动摄像头。请确保在 Safari/Chrome 中打开，并允许权限。微信内请点击右上角'在浏览器打开'。");
      setStage(AppStage.ERROR);
    }
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);
    // 降低图片质量以加快上传速度
    const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.5);
    
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }

    setStage(AppStage.PROCESSING);
    
    const steps = [
      "锁定目标生物...", 
      "解析面部风水...", 
      "查询犯罪记录...", 
      "检测智商余额...", 
      "匹配外星物种...", 
      "计算单身时长...", 
      "正在生成吐槽...", 
      "上传至黑历史数据库..."
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        setLoadingText(steps[stepIndex]);
        stepIndex++;
      }
    }, 600);

    try {
      const analysis = await analyzeVictim(imageBase64);
      clearInterval(interval);
      setResult(analysis);
      setStage(AppStage.RESULT);
    } catch (e) {
      clearInterval(interval);
      setStage(AppStage.ERROR);
    }
  }, [stream]);

  const resetApp = () => {
    setResult(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black text-green-500 font-mono select-none overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
           style={{
             backgroundImage: 'radial-gradient(circle, #0f0 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }}>
      </div>

      {/* STAGE: INTRO */}
      {stage === AppStage.INTRO && (
        <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in relative z-10">
          <div className="border border-green-500/50 p-6 bg-green-900/10 backdrop-blur-sm w-full max-w-sm text-center shadow-[0_0_30px_rgba(0,255,0,0.2)]">
            <AlertTriangle size={60} className="mx-auto text-yellow-500 mb-4 animate-pulse" />
            <GlitchText text="系统警告" className="text-3xl mb-2 text-red-500" />
            <h2 className="text-xl text-green-400 mb-4">生物磁场探测器 V3.0</h2>
            <p className="text-green-600 text-xs mb-8 border-t border-b border-green-800 py-2">
              注意：本设备用于检测当前环境中的"颜值洼地"与"智商漏斗"。心脏病患者请勿使用。
            </p>
            <button 
              onClick={startCamera}
              className="w-full py-4 bg-green-600 text-black font-bold text-xl tracking-widest hover:bg-green-500 transition-all active:scale-95 shadow-[0_0_15px_#0f0]"
            >
              启动检测
            </button>
          </div>
        </div>
      )}

      {/* STAGE: CAMERA */}
      {stage === AppStage.CAMERA && (
        <div className="relative h-full w-full flex flex-col bg-black">
          <div className="relative flex-1 overflow-hidden bg-gray-900">
             <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-contain opacity-90 transform -scale-x-100"
            />
            {/* HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="scan-line"></div>
                {/* Crosshairs */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-green-500/30 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-red-500/50 rounded-full animate-ping"></div>
                
                {/* Tech text */}
                <div className="absolute top-4 left-4 text-[10px] leading-tight opacity-70">
                  SYS: ONLINE<br/>
                  CAM: USER_FRONT<br/>
                  ISO: 800<br/>
                  TARGET: LOCKING...
                </div>
                <div className="absolute bottom-20 right-4 text-[10px] text-red-500 animate-pulse">
                  WARNING: UGLINESS DETECTED
                </div>
            </div>
          </div>
          <div className="h-28 bg-black flex items-center justify-center relative z-20">
            <button 
              onClick={captureAndAnalyze}
              className="group relative"
            >
              <div className="absolute inset-0 bg-green-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-20 h-20 rounded-full border-4 border-green-500 flex items-center justify-center bg-black active:scale-90 transition-transform relative z-10">
                <Fingerprint size={40} className="text-green-500 group-hover:text-white transition-colors" />
              </div>
            </button>
            <p className="absolute bottom-4 text-[10px] text-gray-500">点击指纹进行扫描</p>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* STAGE: PROCESSING */}
      {stage === AppStage.PROCESSING && (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-black z-20">
          <div className="relative">
            <Skull size={80} className="text-green-500 animate-pulse" />
            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
          </div>
          <h2 className="text-2xl glitch mt-8 mb-4 text-center font-bold">{loadingText}</h2>
          <div className="w-full max-w-xs h-1 bg-gray-800 rounded overflow-hidden mt-4">
            <div className="h-full bg-red-500 animate-[width_1s_ease-in-out_infinite] w-full origin-left"></div>
          </div>
          <div className="mt-8 text-xs text-green-800 font-mono text-center">
            正在分析五官比例...<br/>
            正在计算智商余额...<br/>
            正在匹配外星物种数据库...<br/>
            警告：颜值过低可能导致系统崩溃...
          </div>
        </div>
      )}

      {/* STAGE: RESULT */}
      {stage === AppStage.RESULT && result && (
        <div className="h-full bg-black p-4 flex flex-col relative z-20 overflow-hidden">
          {/* Ticket Style Result */}
          <div className="flex-1 border-2 border-green-500 bg-black relative p-6 flex flex-col items-center text-center shadow-[0_0_20px_rgba(0,255,0,0.3)] mt-4 mb-4">
             {/* Decorative cuts */}
             <div className="absolute -left-2 top-1/2 w-4 h-8 bg-black border-r-2 border-green-500 rounded-r-full"></div>
             <div className="absolute -right-2 top-1/2 w-4 h-8 bg-black border-l-2 border-green-500 rounded-l-full"></div>

             <div className="w-full border-b border-green-800 pb-2 mb-4 flex justify-between items-end">
               <span className="text-xs bg-green-900 px-1 text-green-300">NO. {Math.floor(Math.random() * 99999)}</span>
               <span className="text-xs text-red-500 font-bold">REJECTED</span>
             </div>

             <div className="mb-2 text-green-600 text-xs tracking-[0.2em]">DIAGNOSIS</div>
             <h1 className="text-4xl font-bold text-white mb-6 glitch leading-tight">{result.title}</h1>
             
             <div className="w-32 h-32 rounded-full border-4 border-red-600 flex items-center justify-center mb-6 relative">
                <div className="text-center">
                  <div className="text-xs text-red-400">危险指数</div>
                  <div className="text-4xl font-black text-red-600">{result.dangerLevel}</div>
                </div>
                <div className="absolute inset-0 border-t-4 border-red-600 rounded-full animate-spin [animation-duration:3s]"></div>
             </div>

             <p className="text-lg text-green-300 leading-relaxed font-bold border-t border-green-800 pt-4 w-full">
               "{result.roast}"
             </p>

             <div className="mt-auto w-full pt-4">
                <div className="text-[10px] text-gray-600 mb-2">SCAN_ID: {Date.now().toString(36).toUpperCase()}</div>
                <div className="h-8 w-full bg-[url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Pranked')] bg-contain bg-no-repeat bg-center opacity-50 grayscale"></div>
             </div>
          </div>

          <button 
            onClick={resetApp}
            className="w-full py-4 bg-gray-900 border border-green-600 text-green-500 font-bold uppercase hover:bg-green-900/50 active:bg-green-500 active:text-black transition-colors flex items-center justify-center gap-2 mb-4"
          >
            <RefreshCcw size={18} /> 不信的话 你在试试看
          </button>
        </div>
      )}
      
       {/* STAGE: ERROR */}
       {stage === AppStage.ERROR && (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center z-50">
           <AlertTriangle size={64} className="text-red-600 mb-4" />
           <p className="text-red-500 mb-6 font-bold">连接已断开</p>
           <p className="text-gray-500 text-xs mb-8">可能原因：<br/>1. 你的磁场过强干扰了信号<br/>2. 请点击右上角...在浏览器打开</p>
           <button onClick={() => setStage(AppStage.INTRO)} className="border border-red-500 text-red-500 px-8 py-3 hover:bg-red-900/20">
             重试
           </button>
        </div>
       )}
    </div>
  );
};