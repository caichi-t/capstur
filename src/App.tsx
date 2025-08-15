import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState("Hello from Tauri + React!");

  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleDecrement = () => {
    setCount(count - 1);
  };

  const handleReset = () => {
    setCount(0);
  };

  const handleGreet = async () => {
    try {
      const greetMessage = await invoke("greet", { name: "World" });
      setMessage(greetMessage as string);
    } catch (error) {
      setMessage("Hello from React!");
    }
  };

  return (
    <main className="container">
      <h1>シンプルなTauriアプリ</h1>
      
      <div className="counter-section">
        <h2>カウンター</h2>
        <div className="counter-display">{count}</div>
        <div className="button-group">
          <button onClick={handleDecrement}>-1</button>
          <button onClick={handleReset}>リセット</button>
          <button onClick={handleIncrement}>+1</button>
        </div>
      </div>

      <div className="message-section">
        <h2>メッセージ</h2>
        <p>{message}</p>
        <button onClick={handleGreet}>挨拶する</button>
      </div>
    </main>
  );
}

export default App;
