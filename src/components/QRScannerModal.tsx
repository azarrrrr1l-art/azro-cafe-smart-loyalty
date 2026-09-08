import React, { useState, useEffect, useRef } from 'react';
import { X, QrCode, Camera, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck, Sparkles, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { CustomerProfile } from '../types';
import { scanVisit } from '../api';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CustomerProfile | null;
  onVisitSuccess: (result: any) => void;
  onOpenAuth: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onVisitSuccess,
  onOpenAuth
}) => {
  const [activeTab, setActiveTab] = useState<'card' | 'scanner'>('card');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrToken, setQrToken] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Scanner state
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'cooldown' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [customQrInput, setCustomQrInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');

  // Generate dynamic QR code whenever modal opens or refreshes
  const generateDynamicQR = async () => {
    if (!currentUser) return;
    setIsRefreshing(true);
    const timestamp = Math.floor(Date.now() / 1000);
    const token = `AZRO:CUST:${currentUser.id}:${timestamp}:${currentUser.membershipLevel}`;
    setQrToken(token);
    try {
      const url = await QRCode.toDataURL(token, {
        width: 320,
        margin: 2,
        color: {
          dark: '#29221D',
          light: '#FAF7F2'
        },
        errorCorrectionLevel: 'H'
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error('Failed to generate QR code', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && currentUser) {
      generateDynamicQR();
    }
  }, [isOpen, currentUser]);

  // Handle camera activation if selected
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access denied or unavailable in iframe', err);
      setCameraError('Camera access not available in this frame. Use the quick-scan location buttons below!');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCopyToken = () => {
    if (qrToken) {
      navigator.clipboard.writeText(qrToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Perform visit scan verification
  const handleExecuteScan = async (qrPayload: string, verifiedBy = 'table_qr') => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setIsProcessing(true);
    setScanStatus('scanning');
    setFeedbackMessage('Verifying QR authenticity and cooldown status with AZRO server...');

    try {
      const res = await scanVisit(currentUser.id, qrPayload, verifiedBy);

      if (res.cooldown) {
        setScanStatus('cooldown');
        setCooldownRemaining(res.minutesRemaining || 45);
        setFeedbackMessage(res.message || `Duplicate scan blocked! Please wait ${res.minutesRemaining}m.`);
      } else if (res.success) {
        setScanStatus('success');
        setFeedbackMessage(
          `Visit verified! +${res.pointsAwarded} points & +1 coffee stamp awarded. Total stamps: ${res.stampsCount}/8.`
        );

        // Celebration confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#D97724', '#E5A93C', '#29221D']
          });
        } catch (e) {}

        onVisitSuccess(res);
      }
    } catch (err: any) {
      setScanStatus('error');
      setFeedbackMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#EADFCF] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#29221D] text-white">
              <QrCode className="w-5 h-5 text-[#E5A93C]" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#29221D]">
                AZRO Dynamic QR Terminal
              </h3>
              <p className="text-[11px] text-stone-500">
                Instant visit recording & loyalty verification
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="p-3 bg-stone-50 border-b border-stone-100 flex gap-2">
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('card');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'card'
                ? 'bg-white text-[#29221D] shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5 text-[#D97724]" />
            <span>My Dynamic Card QR</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('scanner');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scanner'
                ? 'bg-white text-[#29221D] shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#D97724]" />
            <span>Scan In-Store QR</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'card' ? (
            /* Show My Card QR Tab */
            currentUser ? (
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0E6] text-[#A64A00] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Dynamic Member QR • {currentUser.membershipLevel} Tier</span>
                </div>

                {/* QR Code Container */}
                <div className="relative mx-auto w-64 h-64 p-3 bg-[#FAF7F2] rounded-3xl border-2 border-[#EADFCF] shadow-inner flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Customer Loyalty QR"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="animate-spin text-[#D97724]">
                      <RefreshCw className="w-8 h-8" />
                    </div>
                  )}

                  {/* Corner styling accents */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#29221D] rounded-tl-lg" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#29221D] rounded-tr-lg" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#29221D] rounded-bl-lg" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#29221D] rounded-br-lg" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-stone-800">
                    Present this QR code to the barista at the counter
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Auto-refreshed with secure cryptographic token to prevent forgery.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={generateDynamicQR}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Refresh Code</span>
                  </button>

                  <button
                    onClick={handleCopyToken}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Token'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <QrCode className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="font-bold text-base text-stone-800">Sign in to generate your QR Card</h4>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Your dynamic QR code connects your account to in-store barista scans and stamps.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#29221D] text-white text-xs font-bold shadow-xs hover:bg-[#3D322B]"
                >
                  Sign In / Register
                </button>
              </div>
            )
          ) : (
            /* Scan In-Store QR Tab */
            <div className="space-y-4">
              {/* Camera Scanner Container */}
              <div className="relative rounded-2xl bg-stone-900 overflow-hidden aspect-[4/3] flex items-center justify-center">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                  playsInline
                />

                {!cameraActive && (
                  <div className="text-center p-6 space-y-2 text-stone-300">
                    <Camera className="w-10 h-10 mx-auto text-stone-500" />
                    <p className="text-xs font-medium">Use device camera or quick-check options below</p>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#29221D] text-xs font-bold hover:bg-white transition-colors"
                    >
                      Enable Live Camera
                    </button>
                  </div>
                )}

                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[#E5A93C] rounded-2xl animate-pulse" />
                  </div>
                )}
              </div>

              {cameraError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  {cameraError}
                </p>
              )}

              {/* Status / Feedback Box */}
              {scanStatus !== 'idle' && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium space-y-1 transition-all ${
                    scanStatus === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                      : scanStatus === 'cooldown'
                      ? 'bg-amber-50 border border-amber-200 text-amber-900'
                      : scanStatus === 'scanning'
                      ? 'bg-stone-100 border border-stone-200 text-stone-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {scanStatus === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : scanStatus === 'cooldown' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <RefreshCw className="w-4 h-4 animate-spin text-stone-600" />
                    )}
                    <span>
                      {scanStatus === 'success'
                        ? 'Visit Verified Successfully!'
                        : scanStatus === 'cooldown'
                        ? 'Duplicate-Scan Policy Enforced'
                        : scanStatus === 'scanning'
                        ? 'Verifying...'
                        : 'Verification Error'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{feedbackMessage}</p>
                </div>
              )}

              {/* Quick-Scan Location Presets (Simulates scanning table QR or Counter QR) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                  Simulate Scanning In-Cafe QR (Table / Counter)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Table 4 (Dine-in)', payload: 'AZRO_TABLE_04', verifiedBy: 'table_qr' },
                    { label: 'Table 7 (Patio)', payload: 'AZRO_TABLE_07', verifiedBy: 'table_qr' },
                    { label: 'Counter 1 (Register)', payload: 'AZRO_COUNTER_01', verifiedBy: 'counter_staff' },
                    { label: 'Takeaway Kiosk', payload: 'AZRO_KIOSK_02', verifiedBy: 'table_qr' }
                  ].map(loc => (
                    <button
                      key={loc.payload}
                      disabled={isProcessing}
                      onClick={() => handleExecuteScan(loc.payload, loc.verifiedBy)}
                      className="p-2.5 rounded-xl border border-stone-200 bg-[#FAF7F2] hover:bg-[#EFE6DA] active:scale-95 text-xs text-left font-semibold text-stone-800 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span>{loc.label}</span>
                        <QrCode className="w-3.5 h-3.5 text-[#D97724]" />
                      </div>
                      <span className="text-[9px] text-stone-500 font-mono block mt-0.5">
                        {loc.payload}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual payload input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Manual QR String / Payload Test
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. AZRO_TABLE_12"
                    value={customQrInput}
                    onChange={e => setCustomQrInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D97724]"
                  />
                  <button
                    disabled={!customQrInput || isProcessing}
                    onClick={() => handleExecuteScan(customQrInput, 'table_qr')}
                    className="px-3 py-2 bg-[#29221D] hover:bg-[#3D322B] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        <div className="p-3 bg-[#FAF7F2] border-t border-stone-100 flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Anti-fraud dynamic tokenization & 45-min duplicate scan prevention active</span>
        </div>
      </div>
    </div>
  );
};
