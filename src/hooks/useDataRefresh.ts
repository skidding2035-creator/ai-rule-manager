import { useSyncExternalStore } from 'react'

// A global "please re-fetch" signal, independent of the domain-specific
// notify*Changes buses (which only fire on in-app mutations). Pages include
// this tick in their fetch effect's dependency array so the sidebar's manual
// refresh button can force a re-fetch even when data changed outside the app
// (e.g. a rule proposed via the MCP server while the page was already open).
let tick = 0
const listeners = new Set<() => void>()

export function triggerDataRefresh() {
  tick++
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return tick
}

export function useDataRefreshTick(): number {
  return useSyncExternalStore(subscribe, getSnapshot)
}
