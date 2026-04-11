import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  color?: "dark" | "light" | "blue"
}

const sizeMap = {
  sm: { icon: 24, text: "text-lg", gap: "gap-2" },
  md: { icon: 32, text: "text-xl", gap: "gap-2.5" },
  lg: { icon: 40, text: "text-2xl", gap: "gap-3" },
  xl: { icon: 56, text: "text-3xl", gap: "gap-4" },
}

const colorMap = {
  dark: { primary: "#0f172a", secondary: "#334155" },
  light: { primary: "#ffffff", secondary: "#cbd5e1" },
  blue: { primary: "#1e3a5f", secondary: "#3b82f6" },
}

// Icon representing transformation/growth - abstract ascending path
export function SoluterIcon({ className, size = "md", color = "dark" }: LogoProps) {
  const { icon } = sizeMap[size]
  const { primary, secondary } = colorMap[color]

  return (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Abstract geometric symbol - ascending transformation */}
      <path
        d="M8 36L20 24L28 32L40 12"
        stroke={primary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M32 12H40V20"
        stroke={primary}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="36" r="3" fill={secondary} />
      <circle cx="20" cy="24" r="3" fill={primary} />
      <circle cx="28" cy="32" r="3" fill={primary} />
      <circle cx="40" cy="12" r="3" fill={primary} />
    </svg>
  )
}

// Alternative Icon - Minimal geometric transformation mark
export function SoluterIconAlt({ className, size = "md", color = "dark" }: LogoProps) {
  const { icon } = sizeMap[size]
  const { primary, secondary } = colorMap[color]

  return (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Stacked ascending bars - growth/progression */}
      <rect x="6" y="32" width="8" height="12" rx="2" fill={secondary} />
      <rect x="18" y="24" width="8" height="20" rx="2" fill={primary} fillOpacity="0.7" />
      <rect x="30" y="14" width="8" height="30" rx="2" fill={primary} />
      {/* Upward arrow accent */}
      <path
        d="M42 8L42 18M42 8L38 12M42 8L46 12"
        stroke={primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Second Alternative - Abstract 'S' lettermark
export function SoluterIconLettermark({ className, size = "md", color = "dark" }: LogoProps) {
  const { icon } = sizeMap[size]
  const { primary } = colorMap[color]

  return (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Geometric S shape representing transformation */}
      <path
        d="M36 10H16C12.6863 10 10 12.6863 10 16V16C10 19.3137 12.6863 22 16 22H32C35.3137 22 38 24.6863 38 28V28C38 31.3137 35.3137 34 32 34H12"
        stroke={primary}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Ascending dots */}
      <circle cx="40" cy="6" r="3" fill={primary} />
      <circle cx="8" cy="38" r="3" fill={primary} />
    </svg>
  )
}

// Wordmark only
export function SoluterWordmark({ className, size = "md", color = "dark" }: LogoProps) {
  const { text } = sizeMap[size]
  const { primary } = colorMap[color]

  return (
    <span
      className={cn(
        text,
        "font-semibold tracking-tight inline-flex items-baseline",
        className
      )}
      style={{ color: primary }}
    >
      DOBROW
      <span className="font-light ml-1 opacity-70">Academy</span>
    </span>
  )
}

// Full horizontal lockup - Icon + Wordmark
export function SoluterLogoFull({ className, size = "md", color = "dark" }: LogoProps) {
  const { gap } = sizeMap[size]

  return (
    <div className={cn("flex items-center", gap, className)}>
      <SoluterIcon size={size} color={color} />
      <SoluterWordmark size={size} color={color} />
    </div>
  )
}

// Alternative lockup with lettermark
export function SoluterLogoLettermark({ className, size = "md", color = "dark" }: LogoProps) {
  const { gap } = sizeMap[size]

  return (
    <div className={cn("flex items-center", gap, className)}>
      <SoluterIconLettermark size={size} color={color} />
      <SoluterWordmark size={size} color={color} />
    </div>
  )
}

// Favicon - simplified for small sizes
export function SoluterFavicon({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="32" height="32" rx="6" fill="#0f172a" />
      <path
        d="M24 8H12C10.3431 8 9 9.34315 9 11V11C9 12.6569 10.3431 14 12 14H20C21.6569 14 23 15.3431 23 17V17C23 18.6569 21.6569 20 20 20H8"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="26" cy="6" r="2" fill="#3b82f6" />
    </svg>
  )
}
