import { isTauri } from '../platform/desktop'
import { openExternalUrl } from '../platform/openExternalUrl'

export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/jasonabed'

type BuyMeCoffeeLinkProps = {
  className?: string
  label?: string
}

export function BuyMeCoffeeLink({
  className = '',
  label = 'Coffee',
}: BuyMeCoffeeLinkProps) {
  return (
    <a
      href={BUY_ME_A_COFFEE_URL}
      className={['support-link', className].filter(Boolean).join(' ')}
      target="_blank"
      rel="noopener noreferrer"
      title="Buy me a coffee"
      onClick={(event) => {
        if (!isTauri()) return
        event.preventDefault()
        void openExternalUrl(BUY_ME_A_COFFEE_URL)
      }}
    >
      ☕ {label}
    </a>
  )
}
