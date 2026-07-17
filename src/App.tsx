import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  Play, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Terminal,
  Settings2,
  ShieldCheck,
  FileCheck2,
  Clock
} from 'lucide-react';

// Type definitions
interface ProcessResult {
  id: string;
  originalName: string;
  newName: string;
  status: 'Pending' | 'Success' | 'Error' | 'Skipped';
  message?: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

export default function App() {
  const [date, setDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
  });
  const [projectName, setProjectName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [results, setResults] = useState<ProcessResult[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (level: LogEntry['level'], message: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLogs(prev => [...prev, { id: crypto.randomUUID(), timestamp: timeStr, level, message }]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const dwgFiles = files.filter(f => f.name.toLowerCase().endsWith('.dwg'));
      setSelectedFiles(dwgFiles);
      
      setResults(dwgFiles.map(f => ({
        id: crypto.randomUUID(),
        originalName: f.name,
        newName: '-',
        status: 'Pending'
      })));

      addLog('INFO', `Selected folder. Found ${dwgFiles.length} .dwg files out of ${files.length} total files.`);
    }
  };

  const startProcessing = async () => {
    if (!projectName.trim()) {
      addLog('WARN', 'Project name is required to start processing.');
      return;
    }
    if (selectedFiles.length === 0) {
      addLog('WARN', 'No DWG files selected.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    addLog('INFO', `Initializing AutoCAD COM Interface Simulation...`);
    addLog('INFO', `Target Output Configuration - Prefix: [${date}]_[${projectName}]_`);
    
    // Reset results status
    setResults(prev => prev.map(r => ({ ...r, status: 'Pending', newName: '-' })));

    // Simulation Loop
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const resultId = results[i].id;
      const originalName = file.name;
      const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
      const newName = `${date}_${projectName}_${baseName}.pdf`;

      addLog('INFO', `[${i + 1}/${selectedFiles.length}] Opening ${originalName} in AutoCAD engine...`);
      
      // Update running status
      setResults(prev => prev.map(r => r.originalName === originalName ? { ...r, newName, status: 'Pending' } : r));

      // Simulate plot time (500ms to 2000ms per file)
      const delay = 500 + Math.random() * 1500;
      await new Promise(resolve => setTimeout(resolve, delay));

      // 5% chance of simulated error for realistic exception handling demonstration
      const isError = Math.random() < 0.05;

      if (isError) {
        errorCount++;
        addLog('ERROR', `AutoCAD plotting timeout or font/CTB error on ${originalName}. Skipping.`);
        setResults(prev => prev.map(r => r.originalName === originalName ? { ...r, status: 'Error', message: 'Plot Timeout / Missing CTB' } : r));
      } else {
        successCount++;
        addLog('SUCCESS', `Successfully plotted and renamed: ${newName}`);
        setResults(prev => prev.map(r => r.originalName === originalName ? { ...r, status: 'Success' } : r));
      }

      setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
    }

    addLog('INFO', `Batch processing completed. Total: ${selectedFiles.length} | Success: ${successCount} | Failed: ${errorCount}`);
    setIsProcessing(false);
  };

  const downloadLogFile = () => {
    let content = `====================================================\n`;
    content += `[PRD] Drawing Management Automation Result Log\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Project: ${projectName}\n`;
    content += `====================================================\n\n`;
    
    content += `[Processing Summary]\n`;
    content += `Total Files: ${results.length}\n`;
    content += `Success: ${results.filter(r => r.status === 'Success').length}\n`;
    content += `Errors/Skipped: ${results.filter(r => r.status === 'Error').length}\n\n`;

    content += `[Detailed Results]\n`;
    results.forEach(r => {
      content += `${r.status.padEnd(8, ' ')} | ${r.originalName} -> ${r.newName}\n`;
      if (r.message) content += `           Reason: ${r.message}\n`;
    });

    content += `\n[System Logs]\n`;
    logs.forEach(l => {
      content += `[${l.timestamp}] [${l.level}] ${l.message}\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Result_Log_${date}_${projectName || 'Unknown'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      
      {/* Top Navigation Bar */}
      <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-orange-600 flex items-center justify-center shadow-[0_0_15px_rgba(234,88,12,0.3)]">
              <FileCheck2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-neutral-100 tracking-tight">LS Division Auto-Plotter</h1>
              <p className="text-xs text-neutral-500 font-mono">SECURE OFFLINE ENVIRONMENT</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-800/80 border border-neutral-700 text-xs font-mono text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              Local Simulation Mode
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Configuration & Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Configuration Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-800">
              <Settings2 className="w-5 h-5 text-orange-500" />
              <h2 className="font-medium text-neutral-200">Batch Configuration</h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Date Prefix</label>
                <input 
                  type="text" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                  placeholder="YYYYMMDD"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                  placeholder="e.g. K2_Turret_Mod"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Source Directory</label>
                <div 
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${isProcessing ? 'border-neutral-800 opacity-50 cursor-not-allowed' : 'border-neutral-700 hover:border-orange-500/50 hover:bg-orange-500/5'}`}
                >
                  <FolderOpen className="w-8 h-8 text-neutral-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-neutral-300">Select DWG Folder</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {selectedFiles.length > 0 ? `${selectedFiles.length} files loaded` : 'Click to browse local files'}
                  </p>
                </div>
                {/* @ts-ignore - webkitdirectory is non-standard but widely supported */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  webkitdirectory="" 
                  directory="" 
                  multiple
                />
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-sm">
            <button
              onClick={startProcessing}
              disabled={isProcessing || selectedFiles.length === 0 || !projectName}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-5 h-5 animate-spin" />
                  Processing in AutoCAD...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start Batch Plot
                </>
              )}
            </button>

            {isProcessing && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs text-neutral-400 font-mono">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Guidelines Box */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 flex gap-3 text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <div className="text-neutral-400">
              <strong className="text-neutral-300 font-medium block mb-1">Defense Security Protocol</strong>
              Operating in 100% offline mode. Files are modified locally. Original DWGs remain untouched; outputs are saved to the designated Plot folder.
            </div>
          </div>

        </div>

        {/* Right Column: Results & Logs */}
        <div className="lg:col-span-8 flex flex-col h-[calc(100vh-8rem)]">
          
          <div className="bg-neutral-900 border border-neutral-800 rounded-t-xl p-2 flex items-center justify-between">
            <div className="flex space-x-1">
              <button 
                onClick={() => setActiveTab('status')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'status' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Result Table
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'logs' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  System Logs
                </div>
              </button>
            </div>

            <button
              onClick={downloadLogFile}
              disabled={results.length === 0 || isProcessing}
              className="px-3 py-1.5 text-sm text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 rounded-md flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Log
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 bg-neutral-950 border-x border-b border-neutral-800 rounded-b-xl overflow-hidden relative">
            
            {/* Status Table View */}
            {activeTab === 'status' && (
              <div className="absolute inset-0 overflow-auto">
                {results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                    <p>No files processed yet. Configure and start batch plot.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-neutral-900/80 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-6 py-3 font-medium text-neutral-400 border-b border-neutral-800 w-12">#</th>
                        <th className="px-6 py-3 font-medium text-neutral-400 border-b border-neutral-800 w-32">Status</th>
                        <th className="px-6 py-3 font-medium text-neutral-400 border-b border-neutral-800">Original Source (DWG)</th>
                        <th className="px-6 py-3 font-medium text-neutral-400 border-b border-neutral-800">Generated Output (PDF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {results.map((r, idx) => (
                        <tr key={r.id} className="hover:bg-neutral-900/30 transition-colors">
                          <td className="px-6 py-3 text-neutral-500 font-mono text-xs">{idx + 1}</td>
                          <td className="px-6 py-3">
                            {r.status === 'Success' && <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5"/> OK</span>}
                            {r.status === 'Error' && <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-xs font-medium"><XCircle className="w-3.5 h-3.5"/> Failed</span>}
                            {r.status === 'Pending' && <span className="inline-flex items-center gap-1.5 text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded text-xs font-medium"><Clock className="w-3.5 h-3.5 animate-pulse"/> Pending</span>}
                          </td>
                          <td className="px-6 py-3 text-neutral-300 truncate max-w-[200px]" title={r.originalName}>{r.originalName}</td>
                          <td className="px-6 py-3 text-neutral-400 font-mono text-xs truncate max-w-[250px]" title={r.newName}>
                            {r.status === 'Error' ? (
                              <span className="text-red-400/70">{r.message}</span>
                            ) : (
                              r.newName
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Terminal Logs View */}
            {activeTab === 'logs' && (
              <div className="absolute inset-0 overflow-auto p-4 font-mono text-xs text-neutral-300 leading-relaxed">
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-600">
                    <Terminal className="w-12 h-12 mb-3 opacity-20" />
                    <p>System console is waiting for instructions...</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map(log => (
                      <div key={log.id} className="flex items-start gap-3">
                        <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
                        <span className={`shrink-0 w-16 ${
                          log.level === 'INFO' ? 'text-blue-400' :
                          log.level === 'WARN' ? 'text-yellow-400' :
                          log.level === 'ERROR' ? 'text-red-400' :
                          'text-emerald-400'
                        }`}>
                          [{log.level}]
                        </span>
                        <span className={`${log.level === 'ERROR' ? 'text-red-300' : log.level === 'SUCCESS' ? 'text-emerald-300' : 'text-neutral-300'}`}>
                          {log.message}
                        </span>
                      </div>
                    ))}
                    <div ref={logsEndRef} />
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
