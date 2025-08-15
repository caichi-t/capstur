import React, { useState } from "react";
import clsx from "clsx";

interface CompositionPanelProps {
  selectedCount: number;
  onCompose: (layout: string) => void;
  composedImage: string;
  onClearComposition: () => void;
}

const CompositionPanel: React.FC<CompositionPanelProps> = ({
  selectedCount,
  onCompose,
  composedImage,
  onClearComposition,
}) => {
  const [selectedLayout, setSelectedLayout] = useState("horizontal");
  const [isComposing, setIsComposing] = useState(false);

  const layouts = [
    {
      id: "horizontal",
      name: "横並び",
      icon: "⬌",
      description: "左から右へ横に並べる",
    },
    {
      id: "vertical",
      name: "縦並び",
      icon: "⬍",
      description: "上から下へ縦に並べる",
    },
    {
      id: "grid",
      name: "グリッド",
      icon: "⊞",
      description: "格子状に配置",
    },
  ];

  const handleCompose = async () => {
    if (selectedCount === 0) return;

    setIsComposing(true);
    try {
      await onCompose(selectedLayout);
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        🖼️ 画像合成
      </h3>

      {selectedCount === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🖱️</div>
          <p className="text-gray-500 dark:text-gray-400">
            合成したいスクリーンショットを<br />選択してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              {selectedCount} 個のスクリーンショットが選択されています
            </p>
          </div>

          {/* Layout Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              レイアウト選択
            </label>
            <div className="space-y-2">
              {layouts.map((layout) => (
                <label
                  key={layout.id}
                  className={clsx(
                    "flex items-center p-3 border rounded-lg cursor-pointer transition-all",
                    {
                      "border-blue-500 bg-blue-50 dark:bg-blue-900/20":
                        selectedLayout === layout.id,
                      "border-gray-300 dark:border-gray-600 hover:border-blue-300":
                        selectedLayout !== layout.id,
                    }
                  )}
                >
                  <input
                    type="radio"
                    name="layout"
                    value={layout.id}
                    checked={selectedLayout === layout.id}
                    onChange={(e) => setSelectedLayout(e.target.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl mr-3">{layout.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {layout.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {layout.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Compose Button */}
          <button
            onClick={handleCompose}
            disabled={isComposing}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isComposing ? "合成中..." : "🎨 画像を合成"}
          </button>
        </div>
      )}

      {/* Composed Image Preview */}
      {composedImage && (
        <div className="mt-6 border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              合成結果
            </h4>
            <button
              onClick={onClearComposition}
              className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
            >
              ✕ クリア
            </button>
          </div>
          
          <div className="relative">
            <img
              src={composedImage}
              alt="Composed screenshot"
              className="w-full rounded-lg shadow-lg"
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 合成が完了しました！下のアップロードパネルからWebサーバーに送信できます。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompositionPanel;