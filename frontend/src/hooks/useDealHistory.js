import { useState, useEffect } from 'react'

const STORAGE_KEY = 'renlo_deal_history'
const MAX_DEALS = 20

export function useDealHistory() {
  const [deals, setDeals] = useState([])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setDeals(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to parse deal history:', e)
        setDeals([])
      }
    }
  }, [])

  const saveDeal = (deal, transcript) => {
    const entry = {
      id: Date.now(),
      deal,
      transcript,
      savedAt: new Date().toISOString()
    }
    const updated = [entry, ...deals].slice(0, MAX_DEALS)
    setDeals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return entry
  }

  const deleteDeal = (id) => {
    const updated = deals.filter(d => d.id !== id)
    setDeals(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  }

  const clearHistory = () => {
    setDeals([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return { deals, saveDeal, deleteDeal, clearHistory }
}
