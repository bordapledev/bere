import { SVGProps } from 'react'
import { iconSize } from 'ui/src/theme/tokens'

// TODO(EXT-139): replace with reusable Icon component
export const PuzzleIcon = ({
  height = iconSize.icon20,
  width = iconSize.icon20,
  ...rest
}: // eslint-disable-next-line @typescript-eslint/no-explicit-any
SVGProps<any>): JSX.Element => {
  return (
    <svg
      fill="currentColor"
      height={height}
      viewBox="0 0 48 48"
      width={width}
      {...rest}>
      <path d="M0 0h48v48H0z" fill="none" />
      <path d="M41 22h-3v-8c0-2.21-1.79-4-4-4h-8V7c0-2.76-2.24-5-5-5s-5 2.24-5 5v3H8c-2.21 0-3.98 1.79-3.98 4l-.01 7.6H7c2.98 0 5.4 2.42 5.4 5.4S9.98 32.4 7 32.4H4.01L4 40c0 2.21 1.79 4 4 4h7.6v-3c0-2.98 2.42-5.4 5.4-5.4 2.98 0 5.4 2.42 5.4 5.4v3H34c2.21 0 4-1.79 4-4v-8h3c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
    </svg>
  )
}
