// File: app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import FileCompressor from "@/components/FileCompressor";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import { useVault } from "@/lib/VaultContext";
import { encryptFile, decryptFile } from "@/lib/crypto";
import { PDFDocument } from "pdf-lib";

interface DocItem { 
  id: string; 
  title: string; 
  limitKB: number; 
  sides: number; 
}

interface CustomTemplate { 
  id: string; 
  name: string; 
  docs: DocItem[]; 
}

interface EncryptedDocData {
  blob: Blob;
  originalName: string;
  originalType: string;
}

interface VaultFilePair {
  compressed: File;
  original: File;
}

interface EncryptedVaultFilePair {
  compressed: EncryptedDocData;
  original: EncryptedDocData;
}

function GalleryCard({ 
  item, 
  title, 
  onDelete, 
  onRevert 
}: { 
  item: VaultFilePair, 
  title: string, 
  onDelete?: () => void, 
  onRevert?: () => void 
}) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const file = item.compressed;

  useEffect(() => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setImgUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleDownload = () => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a"); 
    a.href = url; 
    a.download = file.name; 
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    const k = 1024; 
    const sizes = ["B", "KB", "MB"]; 
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow group relative">
      {onRevert && (
        <button 
          onClick={onRevert} 
          className="absolute top-2 right-10 p-1.5 bg-black/60 backdrop-blur-sm text-zinc-400 hover:text-blue-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-black" 
          title="Revert & Edit"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button 
          onClick={onDelete} 
          className="absolute top-2 right-2 p-1.5 bg-black/60 backdrop-blur-sm text-zinc-400 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 hover:bg-black" 
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      
      <div className="h-32 bg-zinc-950 flex items-center justify-center border-b border-zinc-800 relative overflow-hidden">
        {imgUrl ? (
          <img src={imgUrl} alt={title} className="object-cover w-full h-full opacity-80" />
        ) : (
          <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-sm font-semibold text-zinc-100 truncate mb-1" title={file.name}>{file.name}</p>
        <p className="text-xs text-zinc-500 mb-4">{formatSize(file.size)}</p>
        <button 
          onClick={handleDownload} 
          className="mt-auto w-full py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors"
        >
          Download File
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { vaults, activeVaultId } = useVault();
  const isGlobal = activeVaultId === "all";
  const activeVault = vaults.find(v => v.id === activeVaultId);

  const [vaultDocs, setVaultDocs] = useState<Record<string, DocItem[]>>({
    default: [{ id: 'example-1', title: 'Example: 10th Marksheet', limitKB: 500, sides: 1 }]
  });
  
  const [vaultCompleted, setVaultCompleted] = useState<Record<string, Record<string, VaultFilePair>>>({});
  const [vaultIsLocked, setVaultIsLocked] = useState<Record<string, boolean>>({});
  const [vaultEncryptedDocs, setVaultEncryptedDocs] = useState<Record<string, Record<string, EncryptedVaultFilePair>>>({});

  const [revertSignals, setRevertSignals] = useState<Record<string, { sideIndex: number, file: File, timestamp: number }>>({});

  const documents = isGlobal ? Object.values(vaultDocs).flat() : (vaultDocs[activeVaultId] || []);
  const completedDocs = isGlobal ? Object.assign({}, ...Object.values(vaultCompleted)) : (vaultCompleted[activeVaultId] || {});
  const encryptedDocs = isGlobal ? Object.assign({}, ...Object.values(vaultEncryptedDocs)) : (vaultEncryptedDocs[activeVaultId] || {});
  const isLocked = isGlobal ? Object.values(vaultIsLocked).some(Boolean) : (vaultIsLocked[activeVaultId] || false);

  const updateDocs = (newDocs: DocItem[]) => { 
    if(!isGlobal) setVaultDocs(prev => ({ ...prev, [activeVaultId]: newDocs }));
  };
  const updateCompleted = (newCompleted: Record<string, VaultFilePair>) => { 
    if(!isGlobal) setVaultCompleted(prev => ({ ...prev, [activeVaultId]: newCompleted }));
  };
  const updateEncrypted = (newEncrypted: Record<string, EncryptedVaultFilePair>) => { 
    if(!isGlobal) setVaultEncryptedDocs(prev => ({ ...prev, [activeVaultId]: newEncrypted }));
  };

  const [isAddDocModalOpen, setIsAddDocModalOpen] = useState(false);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [isManageTemplatesModalOpen, setIsManageTemplatesModalOpen] = useState(false);
  const [lockModalMode, setLockModalMode] = useState<"LOCK" | "UNLOCK" | null>(null);
  
  const [isCompilerOpen, setIsCompilerOpen] = useState(false);
  const [compilerList, setCompilerList] = useState<{key: string, item: VaultFilePair}[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);

  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newLimitKB, setNewLimitKB] = useState<number>(500);
  const [newSides, setNewSides] = useState<number>(1);
  const [templateName, setTemplateName] = useState("");
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  
  const [cryptoPassword, setCryptoPassword] = useState("");
  const [isProcessingCrypto, setIsProcessingCrypto] = useState(false);

  const handleUpdateLimit = (id: string, newLimit: number) => {
    if (newLimit < 10) newLimit = 10;
    const updatedDocs = documents.map(d => d.id === id ? { ...d, limitKB: newLimit } : d);
    updateDocs(updatedDocs);
    setEditingTargetId(null);
  };

  const handleLoadPreset = (val: string) => {
    if (!val || isGlobal) return;
    if (val === "standard") {
      updateDocs([
        { id: `doc-${Date.now()}-1`, title: "10th Marksheet", limitKB: 50, sides: 1 },
        { id: `doc-${Date.now()}-2`, title: "12th HSC Marksheet", limitKB: 50, sides: 1 },
        { id: `doc-${Date.now()}-3`, title: "Aadhar Card", limitKB: 50, sides: 2 },
        { id: `doc-${Date.now()}-4`, title: "Passport Photo", limitKB: 50, sides: 1 },
      ]);
      updateCompleted({});
      toast.success("Standard Admissions template loaded!");
    } else {
      const template = customTemplates.find(t => t.id === val);
      if (template) {
        const freshDocs = template.docs.map(doc => ({ 
          ...doc, 
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
        }));
        updateDocs(freshDocs);
        updateCompleted({});
        toast.success(`Template "${template.name}" loaded!`);
      }
    }
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || documents.length === 0 || isGlobal) return;
    const newTemplate = { id: `tpl-${Date.now()}`, name: templateName.trim(), docs: documents };
    setCustomTemplates([...customTemplates, newTemplate]);
    setIsSaveTemplateModalOpen(false);
    setTemplateName("");
    toast.success(`Template saved!`);
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    const updated = customTemplates.filter(t => t.id !== id);
    setCustomTemplates(updated);
    if (updated.length === 0) setIsManageTemplatesModalOpen(false);
    toast.info(`Template deleted.`);
  };

  const handleCompressComplete = (docId: string, sideIndex: number, compressed: File, original: File) => {
    if(isGlobal) return;
    updateCompleted({ ...completedDocs, [`${docId}-${sideIndex}`]: { compressed, original } });
    toast.success(`${compressed.name} saved to Vault!`);
  };

  const handleDelete = (id: string) => {
    if(isGlobal) return;
    updateDocs(documents.filter((doc) => doc.id !== id));
    
    const newCompleted = { ...completedDocs };
    Object.keys(newCompleted).forEach((key) => { if (key.startsWith(`${id}-`)) delete newCompleted[key]; });
    updateCompleted(newCompleted);

    const newEncrypted = { ...encryptedDocs };
    Object.keys(newEncrypted).forEach((key) => { if (key.startsWith(`${id}-`)) delete newEncrypted[key]; });
    updateEncrypted(newEncrypted);
  };

  const handleDeleteGalleryItem = (key: string) => {
    if(isGlobal) { toast.error("Cannot delete from Global view."); return; }
    const newCompleted = { ...completedDocs };
    delete newCompleted[key];
    updateCompleted(newCompleted);
    toast.info("File removed from gallery.");
  };

  const handleRevert = (key: string, original: File) => {
    if(isGlobal) return;
    
    const newCompleted = { ...completedDocs };
    delete newCompleted[key];
    updateCompleted(newCompleted);

    const [docId, sideIndexStr] = key.split('-');
    setRevertSignals(prev => ({
      ...prev,
      [docId]: { sideIndex: Number(sideIndexStr), file: original, timestamp: Date.now() }
    }));

    toast.info("Original file restored for editing.");
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isGlobal) return;
    updateDocs([...documents, { id: `custom-${Date.now()}`, title: newTitle.trim(), limitKB: newLimitKB, sides: newSides }]);
    setIsAddDocModalOpen(false);
    setNewTitle("");
    setNewLimitKB(500);
    setNewSides(1);
  };

  const handleDownloadZip = async () => {
    if (isLocked) { toast.error("Please unlock the vault first."); return; }
    const files = Object.values(completedDocs);
    if (files.length === 0) return;
    toast.loading("Zipping vault...", { id: "zip" });
    const zip = new JSZip();
    files.forEach((item) => zip.file(item.compressed.name, item.compressed));
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${isGlobal ? "All_Docs" : activeVault?.name.replace(/[^a-zA-Z0-9]/g, "_")}_Vault.zip`);
    toast.success("Vault downloaded!", { id: "zip" });
  };

  const handleLockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoPassword || isGlobal) return;
    setIsProcessingCrypto(true);
    toast.loading("Encrypting gallery data...", { id: "crypto" });
    try {
      const encryptedPayload: Record<string, EncryptedVaultFilePair> = {};
      
      for (const [key, item] of Object.entries(completedDocs)) {
        const encCompressed = await encryptFile(item.compressed, cryptoPassword);
        const encOriginal = await encryptFile(item.original, cryptoPassword);
        encryptedPayload[key] = { 
          compressed: { blob: encCompressed, originalName: item.compressed.name, originalType: item.compressed.type },
          original: { blob: encOriginal, originalName: item.original.name, originalType: item.original.type }
        };
      }
      
      updateEncrypted(encryptedPayload);
      updateCompleted({}); 
      setVaultIsLocked(prev => ({ ...prev, [activeVaultId]: true }));
      toast.success("Gallery successfully locked!", { id: "crypto" });
    } catch (err) {
      toast.error("Encryption failed.", { id: "crypto" });
    } finally {
      setCryptoPassword(""); 
      setIsProcessingCrypto(false); 
      setLockModalMode(null);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cryptoPassword || isGlobal) return;
    setIsProcessingCrypto(true);
    toast.loading("Decrypting gallery data...", { id: "crypto" });
    try {
      const decryptedPayload: Record<string, VaultFilePair> = {};
      
      for (const [key, data] of Object.entries(encryptedDocs)) {
        const decCompressed = await decryptFile(data.compressed.blob, cryptoPassword, data.compressed.originalName, data.compressed.originalType);
        const decOriginal = await decryptFile(data.original.blob, cryptoPassword, data.original.originalName, data.original.originalType);
        decryptedPayload[key] = { compressed: decCompressed, original: decOriginal };
      }
      
      updateCompleted(decryptedPayload);
      updateEncrypted({});
      setVaultIsLocked(prev => ({ ...prev, [activeVaultId]: false }));
      toast.success("Gallery successfully unlocked!", { id: "crypto" });
    } catch (err) {
      toast.error("Incorrect password or corrupted data.", { id: "crypto" });
    } finally {
      setCryptoPassword(""); 
      setIsProcessingCrypto(false); 
      setLockModalMode(null);
    }
  };

  const openCompiler = () => {
    if (isLocked) { toast.error("Please unlock the vault first."); return; }
    setCompilerList(Object.entries(completedDocs).map(([key, item]) => ({ key, item })));
    setIsCompilerOpen(true);
  };

  const moveCompilerItem = (index: number, direction: -1 | 1) => {
    const newList = [...compilerList];
    const target = index + direction;
    if (target < 0 || target >= newList.length) return;
    [newList[index], newList[target]] = [newList[target], newList[index]];
    setCompilerList(newList);
  };

  const executeMasterCompile = async () => {
    setIsCompiling(true);
    toast.loading("Compiling Master PDF...", { id: "compile" });
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const listObj of compilerList) {
        const file = listObj.item.compressed;
        const arrayBuffer = await file.arrayBuffer();
        
        if (file.type === "application/pdf") {
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach(p => mergedPdf.addPage(p));
        } else if (file.type.includes("png")) {
          const img = await mergedPdf.embedPng(arrayBuffer);
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        } else {
          const img = await mergedPdf.embedJpg(arrayBuffer);
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
      }

      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, `${isGlobal ? "All" : activeVault?.name.replace(/[^a-zA-Z0-9]/g, "_")}_Master_Application.pdf`);
      toast.success("Master PDF Compiled Successfully!", { id: "compile" });
      setIsCompilerOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Compilation failed. Check file integrity.", { id: "compile" });
    } finally {
      setIsCompiling(false);
    }
  };

  const totalRequiredSides = documents.reduce((sum, doc) => sum + doc.sides, 0);
  const completedCount = Object.keys(completedDocs).length + Object.keys(encryptedDocs).length;
  const progressPercent = totalRequiredSides === 0 ? 0 : Math.round((completedCount / totalRequiredSides) * 100);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 mb-10 shadow-lg">
        <div className="md:flex md:items-start md:justify-between mb-8 gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-semibold text-zinc-100 tracking-tight">
              {isGlobal ? "All Documents" : activeVault?.name}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              {isGlobal ? "Global view of all your vaults." : "Compress and secure documents for this specific vault."}
            </p>
          </div>
          
          {!isGlobal && (
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-center justify-end mt-4 md:mt-0">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                <select 
                  onChange={(e) => { handleLoadPreset(e.target.value); e.target.value = ""; }} 
                  value="" 
                  style={{ colorScheme: "dark" }} 
                  className="bg-transparent text-zinc-300 text-sm px-3 py-2.5 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="" disabled className="bg-zinc-900">Load Template...</option>
                  <optgroup label="Default Templates" className="bg-zinc-900 text-zinc-500">
                    <option value="standard" className="text-zinc-100">Standard Admissions</option>
                  </optgroup>
                  {customTemplates.length > 0 && (
                    <optgroup label="Session Templates" className="bg-zinc-900 text-zinc-500">
                      {customTemplates.map(t => <option key={t.id} value={t.id} className="text-zinc-100">{t.name}</option>)}
                    </optgroup>
                  )}
                </select>
                {customTemplates.length > 0 && (
                  <button 
                    onClick={() => setIsManageTemplatesModalOpen(true)} 
                    className="px-3 py-2.5 border-l border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
              <button 
                onClick={() => setIsSaveTemplateModalOpen(true)} 
                disabled={documents.length === 0} 
                className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all ${documents.length === 0 ? "bg-zinc-950 border-zinc-800 text-zinc-600" : "bg-zinc-950 border-zinc-700 text-zinc-100 hover:bg-zinc-800"}`}
              >
                Save Template
              </button>
              <button 
                onClick={() => setIsAddDocModalOpen(true)} 
                className="inline-flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-all"
              >
                + Add Custom
              </button>
              <button 
                onClick={handleDownloadZip} 
                disabled={completedCount === 0 || isLocked} 
                className={`inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-bold shadow-lg transition-all ${completedCount === 0 || isLocked ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed" : "bg-zinc-100 text-zinc-900 hover:bg-zinc-300"}`}
              >
                Download Vault
              </button>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-zinc-400">Vault Readiness</span>
            <span className="text-sm font-bold text-zinc-100">{completedCount} / {totalRequiredSides} Secured</span>
          </div>
          <div className="w-full bg-zinc-950 border border-zinc-800 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900 rounded-2xl border-dashed border border-zinc-800 shadow-sm">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-700">
            <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <h2 className="text-xl font-medium text-zinc-100">This vault is empty</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {documents.map((doc) => (
            <div key={doc.id} className="flex flex-col relative group">
              <div className="bg-zinc-900 border border-zinc-800 rounded-t-xl px-5 py-4 flex justify-between items-center z-10 shadow-sm">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-100">{doc.title}</h3>
                  <div className="flex items-center text-xs text-zinc-400 mt-0.5 gap-1">
                    <span>Target: &lt;</span>
                    {editingTargetId === doc.id ? (
                      <input 
                        type="number" 
                        autoFocus 
                        defaultValue={doc.limitKB}
                        onBlur={(e) => handleUpdateLimit(doc.id, Number(e.target.value))}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateLimit(doc.id, Number((e.currentTarget as HTMLInputElement).value))}
                        className="w-12 bg-zinc-950 border border-zinc-700 text-white rounded px-1 py-0.5 outline-none text-center" 
                      />
                    ) : (
                      <span onClick={() => !isGlobal && setEditingTargetId(doc.id)} className={`underline decoration-dashed ${isGlobal ? "" : "cursor-pointer hover:text-white"}`}>{doc.limitKB}</span>
                    )}
                    <span>KB • {doc.sides === 2 ? "2 Sides" : "1 Side"}</span>
                  </div>
                </div>
                {!isGlobal && (
                  <button onClick={() => handleDelete(doc.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg opacity-0 group-hover:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
              <FileCompressor 
                docId={doc.id} 
                docName={doc.title} 
                sides={doc.sides} 
                maxSizeKB={doc.limitKB} 
                onCompressComplete={handleCompressComplete} 
                disabled={isGlobal} 
                revertSignal={revertSignals[doc.id]}
              />
            </div>
          ))}
        </div>
      )}

      {/* --- VAULT GALLERY & MASTER COMPILER --- */}
      {completedCount > 0 && (
        <div className="mt-16 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-zinc-100">Vault Gallery</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 font-medium">{completedCount} Files</span>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={openCompiler} 
                disabled={isLocked} 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-blue-600/10 text-blue-500 border border-blue-600/20 hover:bg-blue-600/20 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                Compile Master PDF
              </button>

              {!isGlobal && (
                <button 
                  onClick={() => setLockModalMode(isLocked ? "UNLOCK" : "LOCK")} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${isLocked ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"}`}
                >
                  {isLocked ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg> Unlock Gallery</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg> Lock Gallery</>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            {isLocked && (
              <div className="absolute inset-0 z-20 backdrop-blur-xl bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-zinc-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
                <p className="text-zinc-300 font-medium">Gallery is securely locked.</p>
                <button onClick={() => setLockModalMode("UNLOCK")} className="mt-4 px-6 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-zinc-300 transition-colors">Decrypt & Unlock</button>
              </div>
            )}

            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-all ${isLocked ? 'opacity-30 blur-sm pointer-events-none select-none' : ''}`}>
              {!isLocked && Object.entries(completedDocs).map(([key, item]) => {
                const docInfo = documents.find(d => key.startsWith(d.id));
                const title = docInfo ? docInfo.title : item.compressed.name;
                return (
                  <GalleryCard 
                    key={key} 
                    item={item} 
                    title={title} 
                    onDelete={isGlobal ? undefined : () => handleDeleteGalleryItem(key)} 
                    onRevert={isGlobal ? undefined : () => handleRevert(key, item.original)} 
                  />
                );
              })}
              {isLocked && Object.entries(encryptedDocs).map(([key, data]) => {
                const docInfo = documents.find(d => key.startsWith(d.id));
                const title = docInfo ? docInfo.title : data.compressed.originalName;
                return (
                  <div key={key} className="bg-zinc-900 border border-zinc-800 rounded-xl h-48 flex flex-col overflow-hidden">
                    <div className="flex-1 bg-zinc-950 border-b border-zinc-800"></div>
                    <div className="p-4"><div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div><div className="h-3 bg-zinc-800 rounded w-1/2"></div></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- MASTER COMPILER MODAL --- */}
      {isCompilerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-zinc-100">Master Compiler</h3>
                <p className="text-xs text-zinc-400 mt-1">Reorder your files. They will be merged into a single PDF.</p>
              </div>
              <button onClick={() => !isCompiling && setIsCompilerOpen(false)} className="text-zinc-500 hover:text-white"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-2 flex-1">
              {compilerList.map((listObj, idx) => (
                <div key={listObj.key} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="text-xs font-bold text-zinc-600 bg-zinc-800 px-2 py-1 rounded">{idx + 1}</div>
                    <p className="text-sm font-medium text-zinc-100 truncate">{listObj.item.compressed.name}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveCompilerItem(idx, -1)} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg></button>
                    <button onClick={() => moveCompilerItem(idx, 1)} disabled={idx === compilerList.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950/50 flex gap-3">
              <button onClick={() => setIsCompilerOpen(false)} disabled={isCompiling} className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg disabled:opacity-50">Cancel</button>
              <button onClick={executeMasterCompile} disabled={isCompiling || compilerList.length === 0} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {isCompiling ? "Compiling..." : "Merge & Download"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CRYPTO MODAL --- */}
      {lockModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-100">{lockModalMode === "LOCK" ? "Lock Gallery" : "Unlock Gallery"}</h3>
              <p className="text-xs text-zinc-400 mt-1">{lockModalMode === "LOCK" ? "Enter a master password to encrypt locally." : "Enter password to decrypt files."}</p>
            </div>
            <form onSubmit={lockModalMode === "LOCK" ? handleLockVault : handleUnlockVault} className="p-6 space-y-5">
              <input type="password" required autoFocus value={cryptoPassword} onChange={(e) => setCryptoPassword(e.target.value)} placeholder="Master Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500" />
              <div className="flex gap-3">
                <button type="button" disabled={isProcessingCrypto} onClick={() => setLockModalMode(null)} className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-lg disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isProcessingCrypto} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg disabled:opacity-50">{isProcessingCrypto ? "Processing..." : (lockModalMode === "LOCK" ? "Encrypt" : "Decrypt")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- STANDARD MODALS --- */}
      {isAddDocModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800"><h3 className="text-lg font-medium text-zinc-100">Add Custom Document</h3></div>
            <form onSubmit={handleAddCustom} className="p-6 space-y-5">
              <input type="text" required value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Caste Certificate" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500" />
              <div className="grid grid-cols-2 gap-5">
                <input type="number" required min={10} max={5000} value={newLimitKB} onChange={(e) => setNewLimitKB(Number(e.target.value))} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500" />
                <select value={newSides} onChange={(e) => setNewSides(Number(e.target.value))} style={{ colorScheme: "dark" }} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"><option value={1}>1 Side</option><option value={2}>2 Sides</option></select>
              </div>
              <div className="flex gap-3"><button type="button" onClick={() => setIsAddDocModalOpen(false)} className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-lg">Cancel</button><button type="submit" className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 text-sm font-medium rounded-lg">Add Document</button></div>
            </form>
          </div>
        </div>
      )}

      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-zinc-800">
              <h3 className="text-lg font-medium text-zinc-100">Save Template</h3>
              <p className="text-xs text-zinc-400 mt-1">Saves {documents.length} configurations for this session.</p>
            </div>
            <form onSubmit={handleSaveTemplate} className="p-6 space-y-5">
              <input type="text" required autoFocus value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template Name..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsSaveTemplateModalOpen(false)} className="flex-1 py-2.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-sm font-medium rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-zinc-100 text-zinc-900 hover:bg-zinc-300 text-sm font-medium rounded-lg">Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isManageTemplatesModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-medium text-zinc-100">Manage Templates</h3>
              <button onClick={() => setIsManageTemplatesModalOpen(false)} className="text-zinc-500 hover:text-zinc-200 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-3">
              {customTemplates.map((tpl) => (
                <div key={tpl.id} className="flex justify-between items-center bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{tpl.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{tpl.docs.length} Documents</p>
                  </div>
                  <button onClick={() => handleDeleteTemplate(tpl.id, tpl.name)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}