import { useCallback, useEffect, useState } from 'react'
import { getHealthStatus } from '../services/healthService'

export function useApiHealth() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setIsError(false)

    try {
      const result = await getHealthStatus()
      setData(result)
    } catch (error) {
      setIsError(true)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, isLoading, isError, refetch }
}
