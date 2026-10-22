import type { DeviceInfo } from '~/types/activity';

/**
 * Composable for getting device info (type, browser, OS)
 * Uses @nuxtjs/device under the hood
 */
export function useDeviceInfo() {
  const device = useDevice();

  function getDeviceType(): DeviceInfo['type'] {
    switch (true) {
      case device.isMobile: return 'mobile';
      case device.isTablet: return 'tablet';
      default: return 'desktop';
    }
  }

  function getBrowser(): string {
    switch (true) {
      case device.isChrome: return 'Chrome';
      case device.isFirefox: return 'Firefox';
      case device.isSafari: return 'Safari';
      case device.isEdge: return 'Edge';
      default: return 'Other';
    }
  }

  function getOS(): string {
    switch (true) {
      case device.isIos: return 'iOS';
      case device.isAndroid: return 'Android';
      case device.isMacOS: return 'macOS';
      case device.isWindows: return 'Windows';
      default: return 'Other';
    }
  }

  function getDeviceInfo(): DeviceInfo {
    return {
      type: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
    };
  }

  return {
    getDeviceInfo,
    // Expose raw flags for direct access if needed
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
  };
}
