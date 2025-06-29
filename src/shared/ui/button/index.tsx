import type { ReactNode } from "react"

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  variant?: "primary"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  className = "",
}: ButtonProps) {
  const baseClasses = "font-bold rounded transition-colors duration-200"

  const variantClasses = {
    primary: "bg-on-primary hover:bg-primary-hover text-primary",
  }

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  }

  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (href) {
    return (
      <a href={href} className={allClasses}>
        {children}
      </a>
    )
  }

  return (
    <button type="button" onClick={onClick} className={allClasses}>
      {children}
    </button>
  )
}
