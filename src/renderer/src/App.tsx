import { useState, useEffect } from 'react'
import { LoadingScreen } from './components/LoadingScreen'
import { Layout } from './components/Layout'

interface LoadProgress {
  message: string
  percentage: number
}

function App() {
  const [loaded, setLoaded] = useState(false)
  const [modelsReady, setModelsReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({ message: 'Starting...', percentage: 0 })

  useEffect(() => {
    const cleanup = window.qvacAPI.onModelProgress((data) => {
      setLoadProgress(data)
      if (data.percentage >= 100) {
        setModelsReady(true)
        setTimeout(() => setLoaded(true), 800)
      }
    })

    window.qvacAPI.loadAllModels().then((result) => {
      if (!result.success) {
        setLoadProgress({ message: `Error: ${result.error}`, percentage: 0 })
      }
    })

    return cleanup
  }, [])

  if (!loaded) {
    return <LoadingScreen message={loadProgress.message} percentage={loadProgress.percentage} />
  }

  return <Layout modelsReady={modelsReady} />
}

export default App
