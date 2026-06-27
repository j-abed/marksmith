type MadeInNycProps = {
  className?: string
}

function UsFlagIcon() {
  return (
    <svg
      className="made-in-nyc__flag"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 19 10"
      width="14"
      height="10"
      aria-hidden="true"
    >
      <rect width="19" height="10" fill="#b22234" />
      <path
        fill="#fff"
        d="M0 1.54h19V3.08H0V4.62h19V6.15H0V7.69h19V10H0V1.54z"
      />
      <rect width="8" height="5.38" fill="#3c3b6e" />
    </svg>
  )
}

export function MadeInNyc({ className = '' }: MadeInNycProps) {
  return (
    <span className={['made-in-nyc', className].filter(Boolean).join(' ')}>
      made with <span className="made-in-nyc__heart" aria-hidden="true">♥</span> in New York, NY{' '}
      <UsFlagIcon />
    </span>
  )
}
