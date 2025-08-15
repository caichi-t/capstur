import React, { useState, useEffect } from "react";

interface UploadPanelProps {
  composedImage: string;
  onUploadComplete: () => void;
}

const UploadPanel: React.FC<UploadPanelProps> = ({
  composedImage,
  onUploadComplete,
}) => {
  const [uploadUrl, setUploadUrl] = useState("https://httpbin.org/post");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<string>("");

  // Load saved upload URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("capstur-upload-url");
    if (savedUrl) {
      setUploadUrl(savedUrl);
    }
  }, []);

  // Save upload URL to localStorage
  const handleUrlChange = (url: string) => {
    setUploadUrl(url);
    localStorage.setItem("capstur-upload-url", url);
  };

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const handleUpload = async () => {
    if (!uploadUrl.trim()) {
      alert("アップロードURLを入力してください");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult("");

    try {
      // Convert base64 to blob
      const blob = dataURLtoBlob(composedImage);
      
      // Create form data
      const formData = new FormData();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `capstur-screenshot-${timestamp}.png`;
      formData.append('image', blob, filename);
      formData.append('timestamp', new Date().toISOString());
      formData.append('source', 'Capstur');

      // Simulate progress (since we can't get real progress from fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type header, let the browser set it with boundary
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const responseText = await response.text();
        setUploadResult(`✅ アップロード成功！\nステータス: ${response.status}\nレスポンス: ${responseText.substring(0, 200)}...`);
        
        // Auto-clear after 3 seconds
        setTimeout(() => {
          onUploadComplete();
        }, 3000);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadResult(`❌ アップロード失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = composedImage;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.download = `capstur-screenshot-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyToClipboard = async () => {
    try {
      const blob = dataURLtoBlob(composedImage);
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('📋 画像をクリップボードにコピーしました！');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('クリップボードへのコピーに失敗しました');
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🚀 送信・共有
      </h3>

      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="btn-secondary text-sm"
          >
            📥 ダウンロード
          </button>
          <button
            onClick={handleCopyToClipboard}
            className="btn-secondary text-sm"
          >
            📋 クリップボードにコピー
          </button>
        </div>

        <div className="border-t pt-4">
          {/* Upload URL Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              アップロードURL
            </label>
            <input
              type="url"
              value={uploadUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com/upload"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={isUploading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              画像をPOSTリクエストで送信するエンドポイントURL
            </p>
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !uploadUrl.trim()}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? "アップロード中..." : "🌐 Webサーバーに送信"}
          </button>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  アップロード進捗
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {uploadResult}
              </pre>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            💡 アップロード先のサーバーはファイルアップロード（multipart/form-data）を
            サポートしている必要があります。テスト用にhttpbin.orgを使用できます。
          </p>
        </div>
      </div>
    </div>
  );
};

export default UploadPanel;