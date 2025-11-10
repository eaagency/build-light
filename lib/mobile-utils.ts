/**
 * Mobile Utilities
 * Utilities for detecting mobile devices and optimizing mobile experience
 */

/**
 * Detect if the user is on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Detect if the user is on a tablet
 */
export function isTablet(): boolean {
  if (typeof window === "undefined") return false;

  return /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
}

/**
 * Detect if the viewport is mobile-sized
 */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;

  return window.innerWidth < 768;
}

/**
 * Get device type
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

export function getDeviceType(): DeviceType {
  if (isMobileDevice() && !isTablet()) {
    return "mobile";
  } else if (isTablet()) {
    return "tablet";
  } else {
    return "desktop";
  }
}

/**
 * Check if touch events are supported
 */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;

  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
}

/**
 * Get optimal view mode for device
 */
export type ScheduleViewMode = "gantt" | "list" | "calendar";

export function getOptimalScheduleView(): ScheduleViewMode {
  const deviceType = getDeviceType();

  if (deviceType === "mobile") {
    // Mobile devices default to list view (best UX for small screens)
    return "list";
  } else if (deviceType === "tablet") {
    // Tablets can handle Gantt, but calendar might be better
    return "calendar";
  } else {
    // Desktop defaults to Gantt view
    return "gantt";
  }
}

/**
 * Check if Gantt view should be disabled on current device
 */
export function shouldDisableGanttView(): boolean {
  return isMobileDevice() && !isTablet();
}

/**
 * Get minimum touch target size (in pixels)
 * Recommended: 44px for iOS, 48px for Android
 */
export function getMinTouchTargetSize(): number {
  if (typeof window === "undefined") return 48;

  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isIOS ? 44 : 48;
}

/**
 * Enable/disable swipe gestures based on device
 */
export function shouldEnableSwipeGestures(): boolean {
  return isTouchDevice();
}

/**
 * Get optimal table row height for device
 */
export function getOptimalRowHeight(): number {
  const deviceType = getDeviceType();

  if (deviceType === "mobile") {
    return 72; // Larger for easier tapping
  } else if (deviceType === "tablet") {
    return 60;
  } else {
    return 48;
  }
}

/**
 * Get optimal font size for device
 */
export function getOptimalFontSize(): {
  base: string;
  small: string;
  large: string;
} {
  const deviceType = getDeviceType();

  if (deviceType === "mobile") {
    return {
      base: "16px", // Minimum for iOS to avoid zoom
      small: "14px",
      large: "18px",
    };
  } else {
    return {
      base: "14px",
      small: "12px",
      large: "16px",
    };
  }
}

/**
 * Check if device supports hover
 */
export function supportsHover(): boolean {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(hover: hover)").matches;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Mobile-specific schedule configuration
 */
export interface MobileScheduleConfig {
  defaultView: ScheduleViewMode;
  enableSwipeGestures: boolean;
  disableGanttView: boolean;
  minTouchTargetSize: number;
  rowHeight: number;
  enableBottomSheet: boolean;
  enablePullToRefresh: boolean;
}

export function getMobileScheduleConfig(): MobileScheduleConfig {
  return {
    defaultView: getOptimalScheduleView(),
    enableSwipeGestures: shouldEnableSwipeGestures(),
    disableGanttView: shouldDisableGanttView(),
    minTouchTargetSize: getMinTouchTargetSize(),
    rowHeight: getOptimalRowHeight(),
    enableBottomSheet: isMobileDevice(),
    enablePullToRefresh: isMobileDevice(),
  };
}

/**
 * Optimize images for mobile
 */
export function getOptimalImageSize(): {
  maxWidth: number;
  maxHeight: number;
  quality: number;
} {
  const deviceType = getDeviceType();

  if (deviceType === "mobile") {
    return {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.7,
    };
  } else if (deviceType === "tablet") {
    return {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
    };
  } else {
    return {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.9,
    };
  }
}

/**
 * Check if device has slow network
 */
export function hasSlowNetwork(): boolean {
  if (typeof navigator === "undefined" || !(navigator as any).connection) {
    return false;
  }

  const connection = (navigator as any).connection;
  const slowNetworkTypes = ["slow-2g", "2g", "3g"];

  return (
    slowNetworkTypes.includes(connection.effectiveType) ||
    connection.saveData === true
  );
}

/**
 * Get optimal data loading strategy
 */
export type LoadingStrategy = "eager" | "lazy" | "incremental";

export function getOptimalLoadingStrategy(): LoadingStrategy {
  if (hasSlowNetwork()) {
    return "incremental"; // Load data in chunks
  } else if (isMobileDevice()) {
    return "lazy"; // Lazy load to save battery/data
  } else {
    return "eager"; // Load everything upfront on desktop
  }
}

/**
 * Prevent zoom on input focus (iOS)
 */
export function preventIOSZoom(): void {
  if (typeof document === "undefined") return;

  const addMaximumScaleToMetaViewport = () => {
    const el = document.querySelector('meta[name="viewport"]');

    if (el !== null) {
      let content = el.getAttribute("content");
      const re = /maximum-scale=[0-9.]+/g;

      if (re.test(content || "")) {
        content = content?.replace(re, "maximum-scale=1.0");
      } else {
        content = [content, "maximum-scale=1.0"].join(", ");
      }

      el.setAttribute("content", content || "");
    }
  };

  const disableIOSTextFieldZoom = addMaximumScaleToMetaViewport;

  // iOS 10+ supports disabling zoom on fields
  if (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    !window.MSStream
  ) {
    disableIOSTextFieldZoom();
  }
}

/**
 * Enable iOS momentum scrolling
 */
export function enableIOSMomentumScrolling(element: HTMLElement): void {
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    element.style.webkitOverflowScrolling = "touch";
  }
}
