import styles from './Toast.module.css'

export default function Toast({ toasts, remove }) {
  if (!toasts.length) return null

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type] || styles.success}`}
        >
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.close} onClick={() => remove(toast.id)}>×</button>
        </div>
      ))}
    </div>
  )
}
