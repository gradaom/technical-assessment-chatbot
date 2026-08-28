/**
 * Inline icon set. Every icon inherits `currentColor` and sizes from the
 * `size` prop so they can be dropped anywhere without extra wrappers.
 */
interface IconProps {
  size?: number;
  className?: string;
}

function svg(path: React.ReactNode, viewBox = "0 0 24 24") {
  return function Icon({ size = 20, className }: IconProps) {
    return (
      <svg
        aria-hidden="true"
        focusable="false"
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        {path}
      </svg>
    );
  };
}

export const SidebarIcon = svg(
  <>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M9.5 4v16" />
  </>,
);

export const NewChatIcon = svg(
  <>
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    <path d="M14 5.5 18.5 10" />
  </>,
);

export const SearchIcon = svg(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
);

export const SendIcon = svg(
  <>
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </>,
);

export const StopIcon = ({ size = 20, className }: IconProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <rect x="7" y="7" width="10" height="10" rx="2" />
  </svg>
);

export const CopyIcon = svg(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M15 6.5A2.5 2.5 0 0 0 12.5 4H6.5A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15" />
  </>,
);

export const CheckIcon = svg(<path d="m4.5 12.5 5 5 10-11" />);

export const RegenerateIcon = svg(
  <>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v5h-5" />
  </>,
);

export const TrashIcon = svg(
  <>
    <path d="M4 7h16" />
    <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7" />
  </>,
);

export const PencilIcon = svg(
  <>
    <path d="M15.6 4.4a2 2 0 0 1 2.8 2.8L8.5 17.1 4.5 18l.9-4Z" />
  </>,
);

export const DotsIcon = ({ size = 20, className }: IconProps) => (
  <svg
    aria-hidden="true"
    focusable="false"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <circle cx="5.5" cy="12" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="18.5" cy="12" r="1.6" />
  </svg>
);

export const SunIcon = svg(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
  </>,
);

export const MoonIcon = svg(<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />);

export const ChevronDownIcon = svg(<path d="m6 9.5 6 6 6-6" />);

export const CloseIcon = svg(
  <>
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </>,
);

export const AlertIcon = svg(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <path d="M12 16.2v.2" />
  </>,
);

export const SparkIcon = svg(
  <>
    <path d="M12 3.5 13.7 9l5.3 1.7-5.3 1.7L12 18l-1.7-5.6L5 10.7 10.3 9Z" />
    <path d="M18.5 4v3M20 5.5h-3" />
  </>,
);
