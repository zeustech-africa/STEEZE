"use client";

import { useState, useEffect } from "react";
import { X, Play, Pause, RotateCcw, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { uploadManager, UploadTask } from "@/lib/uploadManager";

interface UploadQueueProps {
  onClose?: () => void;
}

export default function UploadQueue({ onClose }: UploadQueueProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateTasks = () => {
      setTasks(uploadManager.getTasks());
      const hasActive = uploadManager.getTasks().some(
        (t) => t.status === "uploading" || t.status === "pending" || t.status === "retrying"
      );
      if (hasActive && !isOpen) {
        setIsOpen(true);
      }
    };

    updateTasks();
    const interval = setInterval(updateTasks, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const activeCount = tasks.filter(
    (t) => t.status === "uploading" || t.status === "pending" || t.status === "retrying"
  ).length;

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  if (!isOpen && activeCount === 0 && completedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Upload size={18} />
        <span>Uploads</span>
        {activeCount > 0 && (
          <span className="w-5 h-5 bg-black text-gold rounded-full text-xs flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {/* Queue panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-gray-900 border-l border-white/10 z-50 shadow-xl flex flex-col">
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div>
              <h2 className="text-white font-bold">Upload Queue</h2>
              <p className="text-white/40 text-xs">
                {activeCount} active &bull; {completedCount} completed
              </p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tasks.length === 0 ? (
              <div className="text-center text-white/40 py-8">No uploads in queue</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-white/5 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{task.file.name}</p>
                      <p className="text-white/40 text-xs">
                        {(task.totalBytes / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {(task.status === "uploading" || task.status === "pending") && (
                        <button
                          onClick={() => uploadManager.pauseUpload(task.id)}
                          className="p-1 text-white/50 hover:text-white"
                        >
                          <Pause size={16} />
                        </button>
                      )}
                      {task.status === "paused" && (
                        <button
                          onClick={() => uploadManager.resumeUpload(task.id)}
                          className="p-1 text-white/50 hover:text-gold"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => uploadManager.cancelUpload(task.id)}
                        className="p-1 text-white/50 hover:text-red-400"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gold transition-all duration-300"
                      style={{ width: `${(task.uploadedBytes / task.totalBytes) * 100}%` }}
                    />
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2 text-xs">
                    {task.status === "uploading" && (
                      <>
                        <Loader2 size={12} className="text-gold animate-spin" />
                        <span className="text-white/50">Uploading...</span>
                        <span className="text-white/30 ml-auto">
                          {((task.uploadedBytes / task.totalBytes) * 100).toFixed(0)}%
                        </span>
                      </>
                    )}
                    {task.status === "pending" && (
                      <>
                        <Loader2 size={12} className="text-white/30" />
                        <span className="text-white/50">Waiting...</span>
                      </>
                    )}
                    {task.status === "paused" && (
                      <>
                        <Pause size={12} className="text-yellow-400" />
                        <span className="text-white/50">Paused</span>
                        <span className="text-white/30 ml-auto">
                          {((task.uploadedBytes / task.totalBytes) * 100).toFixed(0)}%
                        </span>
                      </>
                    )}
                    {task.status === "retrying" && (
                      <>
                        <RotateCcw size={12} className="text-orange-400 animate-spin" />
                        <span className="text-white/50">
                          Retrying... ({task.retryCount}/3)
                        </span>
                      </>
                    )}
                    {task.status === "completed" && (
                      <>
                        <CheckCircle size={12} className="text-green-400" />
                        <span className="text-white/50">Completed</span>
                      </>
                    )}
                    {task.status === "failed" && (
                      <>
                        <AlertCircle size={12} className="text-red-400" />
                        <span className="text-white/50">Failed: {task.error}</span>
                        <button
                          onClick={() => uploadManager.resumeUpload(task.id)}
                          className="ml-auto text-gold text-xs hover:underline"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}