import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scanner.render(onScan, onScanFailure);

        function onScan(decodedText, decodedResult) {
            setScanResult(decodedText);
            onScanSuccess(decodedText);
            scanner.clear(); // Stop scanning after success
        }

        function onScanFailure(error) {
            // transform error to not spam console
        }

        return () => {
            try {
                scanner.clear();
            } catch (e) {
                // ignore clear error on unmount
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
            <div className="relative w-full max-w-lg bg-black/40 border border-emerald-500/30 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden">

                {/* Glass Header */}
                <div className="p-4 flex justify-between items-center border-b border-emerald-500/20 bg-emerald-900/10 backdrop-blur-sm">
                    <h3 className="text-emerald-400 font-mono text-sm tracking-widest flex items-center gap-2">
                        <Scan className="w-4 h-4" /> SCANNER_ACTIVE
                    </h3>
                    <button onClick={onClose} className="text-emerald-500/50 hover:text-emerald-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Viewport */}
                <div className="p-6 relative">
                    <div id="reader" className="rounded-lg overflow-hidden border-2 border-emerald-500/50 relative z-10"></div>

                    {/* Laser Animation Overlay */}
                    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-20 flex flex-col items-center justify-center">
                        <div className="w-64 h-64 border-2 border-emerald-400/50 rounded-lg relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-emerald-400 shadow-[0_0_15px_#34d399] animate-[scan_2s_infinite]"></div>
                        </div>
                    </div>
                </div>

                {/* Footer Status */}
                <div className="p-4 bg-black/60 text-center">
                    <p className="text-xs text-emerald-500/70 font-mono">
                        {scanResult ? `DETECTED: ${scanResult}` : "ALIGN CODE WITHIN FRAME"}
                    </p>
                </div>

            </div>

            <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        #reader__scan_region { background: transparent !important; }
        #reader__dashboard_section_csr span { display: none !important; }
      `}</style>
        </div>
    );
};

export default BarcodeScanner;
