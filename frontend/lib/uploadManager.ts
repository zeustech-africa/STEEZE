import localforage from "localforage";

export interface UploadTask {
  id: string;
  file: File;
  fileId: string;
  uploadedBytes: number;
  totalBytes: number;
  status: "pending" | "uploading" | "paused" | "completed" | "failed" | "retrying";
  retryCount: number;
  error?: string;
  abortController?: AbortController;
  startTime?: number;
  estimatedTime?: number;
}

export interface UploadOptions {
  onProgress?: (taskId: string, progress: number) => void;
  onComplete?: (taskId: string, response: any) => void;
  onError?: (taskId: string, error: string) => void;
}

const STORAGE_KEY = "steeze_uploads";
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 10000]; // 1s, 3s, 10s

class UploadManager {
  private tasks: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private queue: string[] = [];
  private options: UploadOptions = {};

  constructor() {
    this.loadFromStorage();
    // Save to localStorage every 5 seconds
    setInterval(() => this.saveToStorage(), 5000);
    // Setup beforeunload to save final state
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.saveToStorage());
    }
  }

  setOptions(options: UploadOptions) {
    this.options = { ...this.options, ...options };
  }

  private async loadFromStorage() {
    try {
      const stored = await localforage.getItem<any[]>(STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        for (const task of stored) {
          if (task.status !== "completed") {
            this.tasks.set(task.id, {
              ...task,
              status: "pending",
              abortController: undefined,
            });
            this.queue.push(task.id);
          }
        }
        this.processQueue();
      }
    } catch (error) {
      console.error("Failed to load uploads from storage:", error);
    }
  }

  private async saveToStorage() {
    try {
      const toStore = Array.from(this.tasks.values()).map((task) => ({
        id: task.id,
        fileId: task.fileId,
        uploadedBytes: task.uploadedBytes,
        totalBytes: task.totalBytes,
        status: task.status,
        retryCount: task.retryCount,
        error: task.error,
        file: task.file,
      }));
      await localforage.setItem(STORAGE_KEY, toStore);
    } catch (error) {
      console.error("Failed to save uploads to storage:", error);
    }
  }

  addFile(file: File): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const fileId = `${file.name}-${file.size}-${file.lastModified}`;

    // Check if already uploaded
    const existing = Array.from(this.tasks.values()).find(
      (t) => t.fileId === fileId && t.status === "completed"
    );
    if (existing) {
      throw new Error("File already uploaded");
    }

    const task: UploadTask = {
      id,
      file,
      fileId,
      uploadedBytes: 0,
      totalBytes: file.size,
      status: "pending",
      retryCount: 0,
    };

    this.tasks.set(id, task);
    this.queue.push(id);
    this.processQueue();

    return id;
  }

  private async processQueue() {
    while (this.activeUploads.size < MAX_CONCURRENT && this.queue.length > 0) {
      const taskId = this.queue.shift();
      if (!taskId) break;

      const task = this.tasks.get(taskId);
      if (!task || task.status !== "pending") continue;

      this.activeUploads.add(taskId);
      this.uploadFile(taskId);
    }
  }

  private async uploadFile(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = "uploading";
    task.startTime = Date.now();
    task.abortController = new AbortController();
    this.tasks.set(taskId, task);
    this.saveToStorage();

    try {
      const formData = new FormData();
      // Calculate remaining chunk
      const chunk = task.file.slice(task.uploadedBytes);
      formData.append("file", chunk, task.file.name);
      formData.append("totalBytes", String(task.totalBytes));
      formData.append("uploadedBytes", String(task.uploadedBytes));
      formData.append("fileId", task.fileId);
      formData.append("taskId", task.id);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/creators/upload/resumable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: task.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.complete) {
        task.status = "completed";
        task.uploadedBytes = task.totalBytes;
        this.options.onComplete?.(taskId, data);
      } else {
        task.uploadedBytes = data.uploadedBytes;
        // Continue uploading next chunk
        this.uploadFile(taskId);
      }

      this.tasks.set(taskId, task);
      this.saveToStorage();
      this.options.onProgress?.(taskId, (task.uploadedBytes / task.totalBytes) * 100);
    } catch (error: any) {
      if (error.name === "AbortError") {
        task.status = "paused";
        this.tasks.set(taskId, task);
        this.saveToStorage();
        return;
      }

      // Handle retry
      if (task.retryCount < MAX_RETRIES) {
        task.status = "retrying";
        task.retryCount++;
        this.tasks.set(taskId, task);
        this.saveToStorage();

        const delay =
          RETRY_DELAYS[task.retryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        setTimeout(() => {
          const currentTask = this.tasks.get(taskId);
          if (currentTask && currentTask.status === "retrying") {
            currentTask.status = "pending";
            this.tasks.set(taskId, currentTask);
            this.queue.unshift(taskId);
            this.processQueue();
          }
        }, delay);

        this.options.onProgress?.(taskId, (task.uploadedBytes / task.totalBytes) * 100);
      } else {
        task.status = "failed";
        task.error = error.message;
        this.tasks.set(taskId, task);
        this.saveToStorage();
        this.options.onError?.(taskId, error.message);
      }
    } finally {
      this.activeUploads.delete(taskId);
      this.processQueue();
    }
  }

  pauseUpload(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && task.status === "uploading" && task.abortController) {
      task.abortController.abort();
      task.status = "paused";
      this.tasks.set(taskId, task);
      this.saveToStorage();
    }
  }

  resumeUpload(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && task.status === "paused") {
      task.status = "pending";
      this.tasks.set(taskId, task);
      this.queue.unshift(taskId);
      this.processQueue();
      this.saveToStorage();
    }
  }

  cancelUpload(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      if (task.abortController) {
        task.abortController.abort();
      }
      this.tasks.delete(taskId);
      this.queue = this.queue.filter((id) => id !== taskId);
      this.activeUploads.delete(taskId);
      this.saveToStorage();
    }
  }

  getTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }

  getTask(taskId: string): UploadTask | undefined {
    return this.tasks.get(taskId);
  }
}

export const uploadManager = new UploadManager();