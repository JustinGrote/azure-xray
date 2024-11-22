import { useEffect } from "react"

interface ToastProps {
  message: string
  content: string
  onClose: () => void
}

export const Toast = ({ message, content, onClose }: ToastProps) => {
  return (
    <div
      style={{
        position: "fixed",
        right: "20px",
        bottom: "20px",
        backgroundColor: "#323232",
        color: "#fff",
        padding: "12px",
        borderRadius: "4px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        zIndex: 9999,
        maxWidth: "80vw",
        maxHeight: "50vh",
        overflow: "auto"
      }}>
      <div style={{ marginBottom: "8px", fontWeight: "bold" }}>{message}</div>
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          fontSize: "12px",
          fontFamily: "monospace"
        }}>
        {content}
      </pre>
    </div>
  )
}
