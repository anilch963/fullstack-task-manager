import { useEffect, useRef, useCallback } from 'react'

type WsMessage = { event: string; [key: string]: unknown }

export function useWebSocket(projectId: number | null, onMessage: (msg: WsMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (!projectId) return
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const ws = new WebSocket(`${proto}://${window.location.host}/api/tasks/ws/${projectId}`)
    ws.onmessage = (e) => {
      try {
        onMessageRef.current(JSON.parse(e.data) as WsMessage)
      } catch {
        // ignore malformed frames
      }
    }
    ws.onclose = () => setTimeout(connect, 3000)
    wsRef.current = ws
  }, [projectId])

  useEffect(() => {
    connect()
    return () => wsRef.current?.close()
  }, [connect])
}
