import { axiosClient } from '../lib/axiosClient'

export async function getHealthStatus() {
  const response = await axiosClient.get('/api/health')
  return response.data
}
