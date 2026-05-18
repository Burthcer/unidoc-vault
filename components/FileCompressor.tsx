// File: components/FileCompressor.tsx
"use client";

import { useState, ChangeEvent, useId, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useAuth } from "@/lib/AuthContext";

interface FileCompressorProps {
  docId: string;
  docName: string;
  sides?: number;
  maxSizeKB?: number;
  disabled?: boolean;
  onCompressComplete?: (docId: string, sideIndex: number, compressed: File, original: File) => void;
  revertSignal?: { sideIndex: number; file: File; timestamp: number };
}

interface SideState {
  selectedFile: File | null;
  compressedFile: File | null; 
  isCompressing: boolean;
  progressMessage: string | null;
  error: string | null;
  isDragging: boolean;
}

export default function FileCompressor({ 
  docId, 
  docName, 
  sides = 1, 
  maxSizeKB = 50, 
  disabled = false, 
  onCompressComplete,
  revertSignal
}: FileCompressorProps) {
  const baseId = useId(); 
  const { profileData } = useAuth();

  const [outputFormat, setOutputFormat] = useState<"JPG" | "PDF">("JPG");
  const [saveToVault, setSaveToVault] = useState(true);
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("Self-Attested");

  const [sideData, setSideData] = useState<SideState[]>(
    Array.from({ length: sides }).map(() => ({
      selectedFile: null, 
      compressedFile: null, 
      isCompressing: false, 
      progressMessage: null, 
      error: null, 
      isDragging: false,
    }))
  );

  // Phase 7: Local Target Size state for Quick Chips
  const [localLimits, setLocalLimits] = useState<number[]>(Array(sides).fill(maxSizeKB));

  useEffect(() => {
    setLocalLimits(Array(sides).fill(maxSizeKB));
  }, [maxSizeKB, sides]);

  // Phase 7: Revert Signal Listener
  const lastRevertRef = useRef<number>(0);
  useEffect(() => {
    if (revertSignal && revertSignal.timestamp > lastRevertRef.current) {
      lastRevertRef.current = revertSignal.timestamp;
      setSideData(prev => {
        const next = [...prev];
        next[revertSignal.sideIndex] = {
          ...next[revertSignal.sideIndex],
          selectedFile: revertSignal.file,
          compressedFile: null,
          isCompressing: false,
          progressMessage: null,
          error: null,
          isDragging: false
        };
        return next;
      });
    }
  }, [revertSignal]);

  const [preCropState, setPreCropState] = useState<{sideIndex: number; file: File; src: string} | null>(null);

  const [cropModal, setCropModal] = useState<{ 
    isOpen: boolean; 
    sideIndex: number; 
    src: string; 
    file: File | null; 
    crop?: Crop; 
    aspect?: number 
  }>({ 
    isOpen: false, 
    sideIndex: 0, 
    src: "", 
    file: null 
  });
  
  const imgRef = useRef<HTMLImageElement | null>(null);

  const formatSizeLabel = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024; 
    const sizes = ["B", "KB", "MB"]; 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = (e: React.DragEvent, sideIndex: number, isDragging: boolean) => {
    e.preventDefault();
    if(disabled) return;
    setSideData((prev) => { 
      const newData = [...prev]; 
      newData[sideIndex].isDragging = isDragging; 
      return newData; 
    });
  };

  const handleDrop = (e: React.DragEvent, sideIndex: number) => {
    e.preventDefault();
    if(disabled) return;
    setSideData((prev) => { 
      const newData = [...prev]; 
      newData[sideIndex].isDragging = false; 
      return newData; 
    });
    const file = e.dataTransfer.files?.[0];
    if (file) processSelectedFile(file, sideIndex);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, sideIndex: number) => {
    if(disabled) return;
    const file = e.target.files?.[0];
    if (file) processSelectedFile(file, sideIndex);
    e.target.value = ""; 
  };

  const processSelectedFile = (file: File, sideIndex: number) => {
    if (file.type.startsWith("image/")) {
      setPreCropState({ sideIndex, file, src: URL.createObjectURL(file) });
    } else {
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { ...newData[sideIndex], selectedFile: file, compressedFile: null, error: null }; 
        return newData; 
      });
    }
  };

  const handlePreCropChoice = (mode: 'skip' | 'free' | 'passport' | 'signature') => {
    if (!preCropState) return;
    const { sideIndex, file, src } = preCropState;

    if (mode === 'skip') {
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { ...newData[sideIndex], selectedFile: file, compressedFile: null, error: null }; 
        return newData; 
      });
    } else {
      let aspect: number | undefined = undefined;
      if (mode === 'passport') aspect = 3.5 / 4.5;
      if (mode === 'signature') aspect = 3 / 1;
      setCropModal({ 
        isOpen: true, 
        sideIndex, 
        src, 
        file, 
        crop: { unit: "%", width: 80, height: 80, x: 10, y: 10 }, 
        aspect 
      });
    }
    setPreCropState(null);
  };

  const handleClearFile = (sideIndex: number) => {
    setSideData((prev) => { 
      const newData = [...prev]; 
      newData[sideIndex] = { 
        selectedFile: null, 
        compressedFile: null, 
        isCompressing: false, 
        progressMessage: null, 
        error: null, 
        isDragging: false 
      }; 
      return newData; 
    });
  };

  const handleCropConfirm = async () => {
    const { sideIndex, file, crop } = cropModal;
    if (!file) return;
    if (!imgRef.current || !crop || crop.width === 0 || crop.height === 0) {
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { ...newData[sideIndex], selectedFile: file, compressedFile: null, error: null }; 
        return newData; 
      });
      setCropModal({ isOpen: false, sideIndex: 0, src: "", file: null });
      return;
    }
    
    try {
      const img = imgRef.current;
      const canvas = document.createElement("canvas");
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      
      canvas.width = crop.width * scaleX; 
      canvas.height = crop.height * scaleY;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No context");
      
      ctx.drawImage(
        img, 
        crop.x * scaleX, 
        crop.y * scaleY, 
        crop.width * scaleX, 
        crop.height * scaleY, 
        0, 
        0, 
        canvas.width, 
        canvas.height
      );
      
      const croppedBlob = await new Promise<Blob>((resolve, reject) => 
        canvas.toBlob((b) => (b ? resolve(b) : reject("Err")), file.type, 1)
      );
      
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { 
          ...newData[sideIndex], 
          selectedFile: new File([croppedBlob], file.name, { type: file.type }), 
          compressedFile: null, 
          error: null 
        }; 
        return newData; 
      });
    } catch (err) {
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { ...newData[sideIndex], selectedFile: file, compressedFile: null, error: null }; 
        return newData; 
      });
    }
    setCropModal({ isOpen: false, sideIndex: 0, src: "", file: null });
  };

  const compressSourceToLimit = (source: File | Blob, limitKB: number, sideIndex: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(source);
      
      img.onload = async () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("No Canvas Context"));
          
          let currentWidth = img.width; 
          let currentHeight = img.height;
          const targetBytes = limitKB * 1024;

          const maxDim = 1500;
          if (currentWidth > maxDim || currentHeight > maxDim) { 
            const ratio = Math.min(maxDim / currentWidth, maxDim / currentHeight); 
            currentWidth = Math.floor(currentWidth * ratio); 
            currentHeight = Math.floor(currentHeight * ratio); 
          }
          
          while (true) {
            canvas.width = currentWidth; 
            canvas.height = currentHeight;
            ctx.clearRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
            
            if (watermarkEnabled && watermarkText.trim()) {
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(-Math.PI / 4);
              ctx.globalAlpha = 0.25;
              ctx.fillStyle = "white";
              const fontSize = Math.max(20, Math.floor(Math.min(canvas.width, canvas.height) / 12));
              ctx.font = `bold ${fontSize}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(watermarkText.trim(), 0, 0);
              ctx.restore();
            }

            let bestBlob: Blob | null = null;

            for (let q = 1.0; q >= 0.1; q -= 0.05) {
              const currentQ = parseFloat(q.toFixed(2));
              setSideData((prev) => { 
                const newData = [...prev]; 
                newData[sideIndex].progressMessage = `Matching Target Size...`; 
                return newData; 
              });

              const blob = await new Promise<Blob>((res) => 
                canvas.toBlob((b) => res(b!), "image/jpeg", currentQ)
              );
              
              if (blob.size <= targetBytes) {
                bestBlob = blob;
                break; 
              }
            }

            if (bestBlob) {
              resolve(bestBlob);
              return;
            }

            currentWidth = Math.floor(currentWidth * 0.85);
            currentHeight = Math.floor(currentHeight * 0.85);

            if (currentWidth < 50 || currentHeight < 50) {
              const finalBlob = await new Promise<Blob>((res) => 
                canvas.toBlob((b) => res(b!), "image/jpeg", 0.1)
              );
              resolve(finalBlob);
              return;
            }
          }
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error("Image Error"));
    });
  };

  const generateFinalFile = async (pages: Blob[], format: "JPG" | "PDF", sideIndex: number): Promise<File> => {
    const sanitizedDocName = docName.replace(/[^a-zA-Z0-9]/g, "_");
    const sideStr = sides === 2 ? (sideIndex === 0 ? "_Front" : "_Back") : "";
    
    let prefix = "";
    if (profileData.firstName || profileData.lastName || profileData.course) {
      const parts = [profileData.firstName, profileData.lastName, profileData.course]
        .filter(Boolean)
        .map(s => s.trim().replace(/\s+/g, "_"));
      if (parts.length > 0) {
        prefix = parts.join("_") + "_";
      }
    }
    const baseName = `${prefix}${sanitizedDocName}${sideStr}`;
    
    if (format === "PDF") {
      const pdf = new jsPDF({ orientation: "portrait", format: "a4" });
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        const imgUrl = URL.createObjectURL(pages[i]);
        const img = new Image(); 
        img.src = imgUrl;
        
        await new Promise((resolve, reject) => { 
          img.onload = resolve; 
          img.onerror = reject; 
        });
        
        const ratio = Math.min(
          pdf.internal.pageSize.getWidth() / img.width, 
          pdf.internal.pageSize.getHeight() / img.height
        );
        const w = img.width * ratio; 
        const h = img.height * ratio;
        
        pdf.addImage(
          img, 
          "JPEG", 
          (pdf.internal.pageSize.getWidth() - w) / 2, 
          (pdf.internal.pageSize.getHeight() - h) / 2, 
          w, 
          h
        );
        URL.revokeObjectURL(imgUrl);
      }
      return new File(
        [pdf.output("blob")], 
        `${baseName}_Secure.pdf`, 
        { type: "application/pdf" }
      );
      
    } else {
      if (pages.length === 1) {
        return new File(
          [pages[0]], 
          `${baseName}_Secure.jpg`, 
          { type: "image/jpeg" }
        );
      }
      
      const zip = new JSZip();
      pages.forEach((blob, idx) => zip.file(`${baseName}_Pg${idx + 1}.jpg`, blob));
      
      return new File(
        [await zip.generateAsync({ type: "blob" })], 
        `${baseName}_Images.zip`, 
        { type: "application/zip" }
      );
    }
  };

  const handleCompressAndSave = async (sideIndex: number) => {
    const data = sideData[sideIndex];
    if (!data.selectedFile) return;
    
    setSideData((prev) => { 
      const newData = [...prev]; 
      newData[sideIndex].isCompressing = true; 
      return newData; 
    });

    try {
      const pagesBlobs: Blob[] = [];
      const file = data.selectedFile;
      const targetSize = localLimits[sideIndex]; 

      if (file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          const v = pdfjsLib.version;
          const ext = v.startsWith("3") ? "js" : "mjs";
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${v}/build/pdf.worker.min.${ext}`;
        }
        
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const targetPerKB = Math.max(15, Math.floor(targetSize / pdf.numPages));
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 });
          const canvas = document.createElement("canvas"); 
          const ctx = canvas.getContext("2d");
          
          canvas.width = viewport.width; 
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx!, viewport }).promise;
          
          const uncompressedBlob = await new Promise<Blob>((resolve) => 
            canvas.toBlob(b => resolve(b!), "image/jpeg", 1.0)
          );
          
          pagesBlobs.push(await compressSourceToLimit(uncompressedBlob, targetPerKB, sideIndex));
        }
      } else {
        pagesBlobs.push(await compressSourceToLimit(file, targetSize, sideIndex));
      }

      const finalFile = await generateFinalFile(pagesBlobs, outputFormat, sideIndex);
      
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { 
          ...newData[sideIndex], 
          compressedFile: finalFile, 
          isCompressing: false, 
          progressMessage: null 
        }; 
        return newData; 
      });
      
      if (saveToVault && onCompressComplete) {
        onCompressComplete(docId, sideIndex, finalFile, file);
      }
      
      const url = URL.createObjectURL(finalFile);
      const a = document.createElement("a"); 
      a.href = url; 
      a.download = finalFile.name; 
      a.click(); 
      URL.revokeObjectURL(url);
      
    } catch (err) {
      setSideData((prev) => { 
        const newData = [...prev]; 
        newData[sideIndex] = { ...newData[sideIndex], error: "Processing failed.", isCompressing: false }; 
        return newData; 
      });
    }
  };

  const handleDownloadAgain = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = file.name; 
    a.click(); 
    URL.revokeObjectURL(url);
  };

  const handleLocalLimitChange = (sideIndex: number, val: number) => {
    const newLimits = [...localLimits];
    newLimits[sideIndex] = val;
    setLocalLimits(newLimits);
  };

  if (disabled) {
    return (
      <div className="w-full bg-zinc-950 rounded-b-xl border-x border-b border-zinc-800 p-6 flex justify-center items-center h-48 opacity-50">
        <p className="text-sm text-zinc-500">Vault editing is disabled in Global View.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900 rounded-b-xl border-x border-b border-zinc-800 p-6 shadow-sm">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-5 border-b border-zinc-800 gap-4">
        <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
          <button 
            onClick={() => setOutputFormat("JPG")} 
            className={`px-4 py-1.5 text-xs rounded-md transition-all ${
              outputFormat === "JPG" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            JPG Image
          </button>
          <button 
            onClick={() => setOutputFormat("PDF")} 
            className={`px-4 py-1.5 text-xs rounded-md transition-all ${
              outputFormat === "PDF" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            A4 PDF
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id={`wm-${baseId}`} 
              checked={watermarkEnabled} 
              onChange={e => setWatermarkEnabled(e.target.checked)} 
              className="accent-zinc-300" 
            />
            <label htmlFor={`wm-${baseId}`} className="text-xs text-zinc-400 cursor-pointer">
              Add Watermark
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id={`sv-${baseId}`} 
              checked={saveToVault} 
              onChange={e => setSaveToVault(e.target.checked)} 
              className="accent-zinc-300" 
            />
            <label htmlFor={`sv-${baseId}`} className="text-xs text-zinc-400 cursor-pointer">
              Save to Current Vault
            </label>
          </div>
        </div>
      </div>

      {watermarkEnabled && (
        <div className="mb-5 animate-in slide-in-from-top-2 fade-in">
          <input 
            type="text" 
            value={watermarkText} 
            onChange={e => setWatermarkText(e.target.value)} 
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-all" 
            placeholder="Enter watermark text (e.g., Self-Attested)" 
          />
        </div>
      )}

      <div className={`grid gap-6 ${sides === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {sideData.map((data, index) => {
          const sideLabel = sides === 2 ? (index === 0 ? "Upload Front" : "Upload Back") : "Upload File";
          const inputId = `dz-${baseId}-${index}`;

          if (preCropState && preCropState.sideIndex === index) {
            return (
              <div key={index} className="flex flex-col items-center justify-center w-full h-auto min-h-32 border border-zinc-700 bg-zinc-950 rounded-xl p-4 animate-in fade-in">
                <p className="text-sm text-zinc-300 mb-3 font-medium">Crop Settings</p>
                <div className="flex flex-wrap justify-center gap-2 w-full">
                  <button onClick={() => handlePreCropChoice('skip')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-all">Skip Crop</button>
                  <button onClick={() => handlePreCropChoice('free')} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-medium rounded transition-all border border-blue-500/20">Freeform</button>
                  <button onClick={() => handlePreCropChoice('passport')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-all">Passport (3.5:4.5)</button>
                  <button onClick={() => handlePreCropChoice('signature')} className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded transition-all">Signature (3:1)</button>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="flex flex-col w-full">
              <label 
                htmlFor={inputId} 
                onDragOver={(e) => handleDrag(e, index, true)} 
                onDragLeave={(e) => handleDrag(e, index, false)} 
                onDrop={(e) => handleDrop(e, index)}
                className={`flex flex-col items-center justify-center w-full h-32 border border-dashed rounded-xl cursor-pointer transition-all ${
                  data.isDragging ? "border-zinc-400 bg-zinc-800" : "border-zinc-700 bg-zinc-950 hover:bg-zinc-900 hover:border-zinc-600"
                }`}
              >
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <svg 
                    className={`w-5 h-5 mb-2 ${data.isDragging ? "text-zinc-200" : "text-zinc-500"}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-zinc-300 font-medium mb-1">{data.isDragging ? "Drop here!" : sideLabel}</p>
                  <p className="text-xs text-zinc-500">Target Size: &lt; {maxSizeKB}KB</p>
                </div>
                <input 
                  id={inputId} 
                  type="file" 
                  accept="image/jpeg, image/png, image/jpg, application/pdf" 
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, index)} 
                />
              </label>

              {data.error && (
                <p className="text-xs text-red-400 mt-2 text-center">{data.error}</p>
              )}
              
              {data.isCompressing && (
                <div className="flex items-center justify-center mt-3 text-zinc-200 space-x-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs font-medium animate-pulse">{data.progressMessage || "Processing..."}</span>
                </div>
              )}

              {data.selectedFile && !data.isCompressing && !data.compressedFile && (
                <div className="mt-4 relative bg-zinc-950 border border-zinc-800 p-4 rounded-xl">
                  <button 
                    onClick={() => handleClearFile(index)} 
                    className="absolute top-2 right-2 text-zinc-600 hover:text-zinc-300 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-xs text-zinc-400 mb-3 text-center truncate px-4" title={data.selectedFile.name}>
                    Ready: {data.selectedFile.name}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Target Size (KB)</span>
                      <input 
                        type="number" 
                        value={localLimits[index]} 
                        onChange={(e) => handleLocalLimitChange(index, Number(e.target.value))} 
                        className="w-14 bg-black border border-zinc-700 rounded px-1.5 py-0.5 text-xs text-white text-center outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex gap-1.5 justify-center">
                      {[50, 100, 300, 500].map(kb => (
                        <button
                          key={kb}
                          onClick={() => handleLocalLimitChange(index, kb)}
                          className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all border ${
                            localLimits[index] === kb 
                              ? "bg-blue-600/20 border-blue-500/30 text-blue-400 shadow-sm" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                          }`}
                        >
                          {kb}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleCompressAndSave(index)} 
                    className="w-full py-2 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 text-sm font-semibold rounded-lg transition-all"
                  >
                    {saveToVault ? "Compress & Secure" : "Compress & Download"}
                  </button>
                </div>
              )}

              {data.compressedFile && data.selectedFile && !data.isCompressing && (
                <div className="mt-4 relative p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <button 
                    onClick={() => handleClearFile(index)} 
                    className="absolute top-2 right-2 text-green-700 hover:text-green-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="text-xs text-green-400 font-medium mb-1 text-center truncate px-4">
                    {data.compressedFile.name}
                  </p>
                  <p className="text-xs text-green-500/80 mb-2 text-center">
                    <span className="line-through">{formatSizeLabel(data.selectedFile.size)}</span> → <span className="font-bold text-green-400">{formatSizeLabel(data.compressedFile.size)}</span>
                  </p>
                  
                  <p className="text-[10px] text-green-500/70 mb-3 text-center flex items-center justify-center gap-1 font-medium bg-green-500/10 py-1 rounded">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    EXIF Scrubbed
                  </p>

                  <button 
                    onClick={() => handleDownloadAgain(data.compressedFile!)} 
                    className="w-full py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs font-semibold rounded-lg transition-all"
                  >
                    Download Again
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cropModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-medium text-zinc-100 mb-6">Crop Image</h3>
            <div className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl w-full flex justify-center mb-6">
              <ReactCrop 
                crop={cropModal.crop} 
                onChange={(c) => setCropModal({ ...cropModal, crop: c })}
                aspect={cropModal.aspect}
              >
                <img 
                  src={cropModal.src} 
                  onLoad={(e) => { imgRef.current = e.currentTarget; }} 
                  className="max-h-[60vh] object-contain w-auto block mx-auto" 
                  alt="Crop Preview" 
                />
              </ReactCrop>
            </div>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setCropModal({ isOpen: false, sideIndex: 0, src: "", file: null })} 
                className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-lg transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropConfirm} 
                className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 text-sm font-semibold rounded-lg transition-all"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}