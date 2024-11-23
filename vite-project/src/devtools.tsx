import { useState } from "react"
import viteLogo from "/vite.svg"
import reactLogo from "./assets/react.svg"
import { createRoot } from "react-dom/client"
import "./App.css"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count sdf is {count}
        </button>
        <p>DEVTOOLS PasdfawerawerawerawerANEL!!!</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

chrome.devtools.panels.create(
  "testPanel",
  "/vite.svg",
  "/panel.html",
  (panel) =>
    panel.onShown.addListener((window) => {
      const root = createRoot(
        window.document.getElementById("root") as HTMLElement
      )
      root.render(<App />)
    })
)

export default App
