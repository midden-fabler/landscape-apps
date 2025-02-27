import { IconProps } from './icon';

export default function MessagesIcon({
  className,
  isInactive,
  isDarkMode,
}: { isInactive?: boolean; isDarkMode?: boolean } & IconProps) {
  if (isInactive) {
    return (
      <svg
        viewBox="0 0 21 22"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.375 5C1.375 2.79086 3.16586 1 5.375 1H15.375C17.5841 1 19.375 2.79086 19.375 5V13C19.375 15.2091 17.5841 17 15.375 17H11.375L6.73243 20.7141C6.58839 20.8293 6.375 20.7267 6.375 20.5423V17H5.375C3.16586 17 1.375 15.2091 1.375 13V5Z"
          stroke="#CCCCCC"
          className="stroke-current"
          strokeOpacity={isDarkMode ? '0.8' : '0.2'}
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 21 22"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.375 5C1.375 2.79086 3.16586 1 5.375 1H15.375C17.5841 1 19.375 2.79086 19.375 5V13C19.375 15.2091 17.5841 17 15.375 17H11.375L6.73243 20.7141C6.58839 20.8293 6.375 20.7267 6.375 20.5423V17H5.375C3.16586 17 1.375 15.2091 1.375 13V5Z"
        className="fill-current stroke-current"
        strokeWidth="1.8"
      />
    </svg>
  );
}
