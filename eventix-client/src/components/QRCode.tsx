import { cn } from "../lib/utils"

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 120, className }: QRCodeProps) {
  // This is a placeholder QR code. In a real app, you'd use a QR code library
  // like 'qrcode' or 'react-qr-code'
  return (
    <div
      className={cn("flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg", className)}
      style={{ width: size, height: size }}
    >
      <div className="grid grid-cols-8 gap-px p-2">
        {/* Simple QR code pattern placeholder */}
        {Array.from({ length: 64 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2",
              // Create a pseudo-random pattern based on the value and index
              (value.charCodeAt(i % value.length) + i) % 3 === 0 ? "bg-black" : "bg-white",
            )}
          />
        ))}
      </div>
    </div>
  )
}
