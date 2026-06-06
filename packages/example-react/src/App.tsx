import { useState } from 'react'
import './App.css'

// No wa-* imports here — the vite-plugin-webawesome plugin injects them automatically.
// {/* <wa-dialog> */} — this commented-out tag should NOT be imported by the plugin.

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>vite-plugin-webawesome demo</h1>
      <p>
        Components below are registered automatically by{' '}
        <code>vite-plugin-webawesome</code> — no manual imports in this file.
      </p>

      <section style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBlock: '1rem' }}>
        <wa-button>Default</wa-button>
        <wa-button variant="brand">Brand</wa-button>
        <wa-button variant="success">Success</wa-button>
        <wa-button variant="warning">Warning</wa-button>
        <wa-button variant="danger">Danger</wa-button>
      </section>

      <section style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBlock: '1rem' }}>
        <wa-badge>Default</wa-badge>
        <wa-badge variant="brand">Brand</wa-badge>
        <wa-badge variant="success">Success</wa-badge>
        <wa-badge variant="warning">Warning</wa-badge>
        <wa-badge variant="danger">Danger</wa-badge>
      </section>

      <section style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBlock: '1rem' }}>
        <wa-icon name="heart"></wa-icon>
        <wa-icon name="star"></wa-icon>
        <wa-icon name="check-circle"></wa-icon>
      </section>

      <section style={{ marginBlock: '1rem' }}>
        <wa-button onClick={() => setCount(c => c + 1)}>
          Count is {count}
        </wa-button>
      </section>
    </div>
  )
}

export default App
