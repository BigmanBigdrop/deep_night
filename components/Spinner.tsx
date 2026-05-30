type Props = { size?: 'sm' | 'md' | 'lg'; className?: string }

const sizes = { sm: 'w-4 h-4 border-[1.5px]', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-2' }

export default function Spinner({ size = 'md', className = '' }: Props) {
  return (
    <span
      className={`inline-block rounded-full border-white/20 border-t-brand animate-spin ${sizes[size]} ${className}`}
    />
  )
}
