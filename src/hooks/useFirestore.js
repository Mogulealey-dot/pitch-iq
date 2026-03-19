import { useState, useEffect, useCallback } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

export function useFirestore(uid, collectionName) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid || !collectionName) { setLoading(false); return }
    const ref = collection(db, 'users', uid, collectionName)
    const q = query(ref, orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [uid, collectionName])

  const add = useCallback(async (item) => {
    if (!uid) return
    const ref = collection(db, 'users', uid, collectionName)
    return addDoc(ref, { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  }, [uid, collectionName])

  const update = useCallback(async (id, changes) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, collectionName, id)
    return updateDoc(ref, { ...changes, updatedAt: serverTimestamp() })
  }, [uid, collectionName])

  const remove = useCallback(async (id) => {
    if (!uid) return
    const ref = doc(db, 'users', uid, collectionName, id)
    return deleteDoc(ref)
  }, [uid, collectionName])

  return { data, loading, add, update, remove }
}
