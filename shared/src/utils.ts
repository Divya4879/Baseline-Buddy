import * as fs from 'fs';
import * as path from 'path';

export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function copyTemplate(templatePath: string, targetPath: string, replacements: Record<string, string> = {}): void {
  ensureDirectoryExists(path.dirname(targetPath));
  
  let content = fs.readFileSync(templatePath, 'utf-8');
  
  // Replace template variables
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value);
  });
  
  fs.writeFileSync(targetPath, content);
}

export function getProjectName(projectPath: string): string {
  return path.basename(projectPath);
}

export function isValidProjectName(name: string): boolean {
  return /^[a-zA-Z0-9-_]+$/.test(name) && name.length > 0 && name.length <= 50;
}

export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_\.]/g, '-').toLowerCase();
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function isWebFile(filePath: string): boolean {
  const webExtensions = ['.html', '.htm', '.css', '.scss', '.sass', '.less', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte'];
  return webExtensions.includes(getFileExtension(filePath));
}

export function calculateCompatibilityScore(safe: number, caution: number, avoid: number): number {
  const total = safe + caution + avoid;
  if (total === 0) return 100;
  
  // Weight: safe = 1.0, caution = 0.5, avoid = 0.0
  const weightedScore = (safe * 1.0 + caution * 0.5 + avoid * 0.0) / total;
  return Math.round(weightedScore * 100);
}

export function getStatusEmoji(status: 'safe' | 'caution' | 'avoid'): string {
  const emojis = {
    safe: '✅',
    caution: '⚠️',
    avoid: '❌'
  };
  return emojis[status];
}

export function getStatusColor(status: 'safe' | 'caution' | 'avoid'): string {
  const colors = {
    safe: '#22c55e',
    caution: '#f59e0b', 
    avoid: '#ef4444'
  };
  return colors[status];
}

export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}
