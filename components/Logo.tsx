import Image from 'next/image'

type Props = {
  size?: number
  className?: string
}

export default function Logo({ size = 48, className = '' }: Props) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Deep Night"
      width={size}
      height={size}
      className={`rounded-lg object-cover ${className}`}
      priority
    />
  )
}
