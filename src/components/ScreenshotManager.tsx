import React from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import clsx from "clsx";

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

interface ScreenshotManagerProps {
  screenshots: ScreenshotData[];
  selectedScreenshots: string[];
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

interface ScreenshotItemProps {
  screenshot: ScreenshotData;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (id: string) => void;
  index: number;
  moveScreenshot: (dragIndex: number, hoverIndex: number) => void;
}

const ScreenshotItem: React.FC<ScreenshotItemProps> = ({
  screenshot,
  isSelected,
  onToggleSelection,
  onDelete,
  index,
  moveScreenshot,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: "screenshot",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "screenshot",
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveScreenshot(item.index, index);
        item.index = index;
      }
    },
  });

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const ref = React.useRef<HTMLDivElement>(null);
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={clsx(
        "card card-hover p-4",
        {
          "opacity-50": isDragging,
          "ring-2 ring-blue-500": isSelected,
        }
      )}
      onClick={() => onToggleSelection(screenshot.id)}
    >
      {/* Screenshot Preview */}
      <div className="relative mb-3">
        <img
          src={screenshot.base64_data}
          alt={`Screenshot ${screenshot.id}`}
          className="w-full h-32 object-cover rounded-lg"
        />
        {isSelected && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            ✓
          </div>
        )}
      </div>

      {/* Screenshot Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 dark:text-gray-400">
            {screenshot.width} × {screenshot.height}
          </span>
          <span className="text-gray-500 dark:text-gray-500">
            {formatTimestamp(screenshot.timestamp)}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-500">
          Region: ({screenshot.region.x}, {screenshot.region.y}) - {screenshot.region.width}×{screenshot.region.height}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(screenshot.id);
          }}
          className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
        >
          削除
        </button>
      </div>
    </div>
  );
};

const ScreenshotManager: React.FC<ScreenshotManagerProps> = ({
  screenshots,
  selectedScreenshots,
  onToggleSelection,
  onDelete,
  onRefresh,
}) => {
  const [orderedScreenshots, setOrderedScreenshots] = React.useState(screenshots);

  React.useEffect(() => {
    setOrderedScreenshots(screenshots);
  }, [screenshots]);

  const moveScreenshot = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = orderedScreenshots[dragIndex];
    const newOrder = [...orderedScreenshots];
    newOrder.splice(dragIndex, 1);
    newOrder.splice(hoverIndex, 0, draggedItem);
    setOrderedScreenshots(newOrder);
  };

  const handleSelectAll = () => {
    const allIds = orderedScreenshots.map(s => s.id);
    if (selectedScreenshots.length === allIds.length) {
      // Deselect all
      allIds.forEach(id => {
        if (selectedScreenshots.includes(id)) {
          onToggleSelection(id);
        }
      });
    } else {
      // Select all
      allIds.forEach(id => {
        if (!selectedScreenshots.includes(id)) {
          onToggleSelection(id);
        }
      });
    }
  };

  const handleClearSelection = () => {
    selectedScreenshots.forEach(id => {
      onToggleSelection(id);
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            スクリーンショット ({orderedScreenshots.length})
          </h2>
          <div className="flex gap-2">
            <button onClick={onRefresh} className="btn-secondary">
              🔄 更新
            </button>
            {orderedScreenshots.length > 0 && (
              <>
                <button onClick={handleSelectAll} className="btn-secondary">
                  {selectedScreenshots.length === orderedScreenshots.length ? "全選択解除" : "全選択"}
                </button>
                {selectedScreenshots.length > 0 && (
                  <button onClick={handleClearSelection} className="btn-secondary">
                    選択解除
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {selectedScreenshots.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-blue-700 dark:text-blue-300 text-sm">
              {selectedScreenshots.length} 個のスクリーンショットが選択されています
            </p>
          </div>
        )}

        {orderedScreenshots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              まだスクリーンショットがありません
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
              「範囲選択キャプチャ」ボタンを押してスクリーンショットを撮影してください
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orderedScreenshots.map((screenshot, index) => (
              <ScreenshotItem
                key={screenshot.id}
                screenshot={screenshot}
                isSelected={selectedScreenshots.includes(screenshot.id)}
                onToggleSelection={onToggleSelection}
                onDelete={onDelete}
                index={index}
                moveScreenshot={moveScreenshot}
              />
            ))}
          </div>
        )}

        {orderedScreenshots.length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 ヒント: スクリーンショットをクリックして選択、ドラッグして並び替えができます。
              選択した画像は右側のパネルで合成できます。
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default ScreenshotManager;