import { useState, useEffect } from 'react' // Import useEffect
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { supabase } from './supabaseClient' // Import the supabase client

// Define an interface for the carrier data structure (optional but good practice with TypeScript)
interface Carrier {
  carriername: string;
}

function App() {
  // Log the client to console to verify import (check browser dev tools)
  // console.log('Supabase client:', supabase); // Keep or remove as desired
  const [count, setCount] = useState(0)
  const [carriers, setCarriers] = useState<Carrier[]>([]) // State to hold carrier data
  const [loading, setLoading] = useState(true) // State for loading indicator
  const [error, setError] = useState<string | null>(null) // State for error message

  // Fetch data on component mount
  useEffect(() => {
    async function fetchCarriers() {
      setLoading(true)
      setError(null)
      try {
        // Select only the 'carriername' column from the 'carrier' table
        const { data, error } = await supabase
          .from('carrier')
          .select('carriername')

        if (error) {
          throw error // Throw error to be caught by catch block
        }

        if (data) {
          setCarriers(data as Carrier[]) // Update state with fetched data
        }
      } catch (err: any) {
        console.error("Error fetching carriers:", err)
        setError(err.message || "Failed to fetch carriers") // Set error state
      } finally {
        setLoading(false) // Set loading to false regardless of success/failure
      }
    }

    fetchCarriers() // Call the async function
  }, []) // Empty dependency array means this runs once on mount

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
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <hr /> {/* Add a separator */}

      {/* Section to display carrier data */}
      <div>
        <h2>Carriers from Supabase:</h2>
        {loading && <p>Loading carriers...</p>} {/* Show loading message */}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>} {/* Show error message */}
        {!loading && !error && (
          <ul>
            {carriers.length > 0 ? (
              carriers.map((carrier, index) => (
                // Use a unique key if available, otherwise index (less ideal)
                <li key={carrier.carriername + index}>{carrier.carriername}</li>
              ))
            ) : (
              <li>No carriers found.</li> // Message if no data
            )}
          </ul>
        )}
      </div>
    </>
  )
}

export default App
