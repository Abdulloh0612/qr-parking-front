import { useEffect, useState } from 'react'
import { getDeviceId } from '@/lib/utils/deviceId'

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string>('')

  useEffect(() => {
    setDeviceId(getDeviceId())
  }, [])

  return deviceId
}
