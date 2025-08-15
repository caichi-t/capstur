import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import "./App.css";
import ScreenshotManager from "./components/ScreenshotManager";
import CompositionPanel from "./components/CompositionPanel";
import UploadPanel from "./components/UploadPanel";

interface ScreenshotData {
  id: string;
  timestamp: number;
  base64_data: string;
  width: number;
  height: number;
  region: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

function App() {
  const [screenshots, setScreenshots] = useState<ScreenshotData[]>([]);
  const [selectedScreenshots, setSelectedScreenshots] = useState<string[]>([]);
  const [composedImage, setComposedImage] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);

  const loadScreenshots = async () => {
    try {
      console.log("Loading screenshots...");
      const result = await invoke<ScreenshotData[]>("get_screenshots");
      console.log("Loaded screenshots:", result.length, "items");
      setScreenshots(result);
    } catch (error) {
      console.error("Failed to load screenshots:", error);
    }
  };

  useEffect(() => {
    loadScreenshots();
    
    // Listen for screenshot capture events
    const unlisten = listen<ScreenshotData>("screenshot-captured", (event) => {
      console.log("Received screenshot-captured event:", event.payload);
      loadScreenshots();
    });
    
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const handleStartCapture = async () => {
    try {
      setIsCapturing(true);
      await invoke("start_region_capture");
    } catch (error) {
      console.error("Failed to start capture:", error);
      alert("キャプチャの開始に失敗しました: " + error);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    try {
      await invoke("delete_screenshot", { id });
      await loadScreenshots();
      // Remove from selected if it was selected
      setSelectedScreenshots(prev => prev.filter(selectedId => selectedId !== id));
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
      alert("スクリーンショットの削除に失敗しました: " + error);
    }
  };

  const handleComposeImages = async (layout: string) => {
    if (selectedScreenshots.length === 0) {
      alert("合成するスクリーンショットを選択してください");
      return;
    }

    try {
      const result = await invoke<string>("compose_screenshots", {
        screenshot_ids: selectedScreenshots,
        layout,
      });
      setComposedImage(result);
    } catch (error) {
      console.error("Failed to compose images:", error);
      alert("画像の合成に失敗しました: " + error);
    }
  };

  const toggleScreenshotSelection = (id: string) => {
    setSelectedScreenshots(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📸 Capstur
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            ドラッグ&ドロップで範囲選択してスクリーンショットを撮影・合成・送信
          </p>
        </header>

        {/* Quick Capture Button */}
        <div className="mb-8 space-x-4">
          <button
            onClick={handleStartCapture}
            disabled={isCapturing}
            className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCapturing ? "キャプチャ中..." : "📷 範囲選択キャプチャ"}
          </button>
          <button
            onClick={async () => {
              try {
                const result = await invoke<string>("test_screen_capture");
                alert("テスト成功: " + result);
              } catch (error) {
                alert("テスト失敗: " + error);
              }
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg"
          >
            🧪 スクリーンキャプチャテスト
          </button>
          <button
            onClick={loadScreenshots}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg"
          >
            🔄 リスト更新
          </button>
          <button
            onClick={async () => {
              try {
                const result = await invoke<string>("test_region_capture");
                alert("テスト成功: " + result);
                await loadScreenshots();
              } catch (error) {
                alert("テスト失敗: " + error);
              }
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg"
          >
            🎯 領域キャプチャテスト
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Screenshot Manager */}
          <div className="xl:col-span-2">
            <ScreenshotManager
              screenshots={screenshots}
              selectedScreenshots={selectedScreenshots}
              onToggleSelection={toggleScreenshotSelection}
              onDelete={handleDeleteScreenshot}
              onRefresh={loadScreenshots}
            />
          </div>

          {/* Right Panel */}
          <div className="space-y-6">
            {/* Composition Panel */}
            <CompositionPanel
              selectedCount={selectedScreenshots.length}
              onCompose={handleComposeImages}
              composedImage={composedImage}
              onClearComposition={() => setComposedImage("")}
            />

            {/* Upload Panel */}
            {composedImage && (
              <UploadPanel
                composedImage={composedImage}
                onUploadComplete={() => {
                  setComposedImage("");
                  setSelectedScreenshots([]);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
