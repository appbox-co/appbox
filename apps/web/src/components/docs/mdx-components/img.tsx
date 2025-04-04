import Image from "next/image"
import { cn } from "@/lib/utils"

export const img = ({
  alt,
  className,
  src,
  width,
  height,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) => {
  // Return null or a placeholder if src is undefined
  if (!src) return null

  // Convert width/height to numbers if they exist
  const widthNum = width ? Number(width) : undefined
  const heightNum = height ? Number(height) : undefined

  return (
    <Image
      className={cn("rounded-md", className)}
      alt={alt ?? ""}
      src={src}
      style={{
        objectFit: "contain"
      }}
      width={widthNum}
      height={heightNum}
      fill
      {...props}
    />
  )
}
