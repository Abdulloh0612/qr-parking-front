const DEVICE_ID_KEY = 'qr_device_id'

export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    deviceId = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}

function generateDeviceId(): string {
  return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY)
}
