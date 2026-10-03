export interface PasswordEyeIconProps {
  visible: boolean;
}

export function PasswordEyeIcon({ visible }: PasswordEyeIconProps) {
  if (visible) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12C3.8 7.9 7.4 5 12 5C16.6 5 20.2 7.9 22 12C20.2 16.1 16.6 19 12 19C7.4 19 3.8 16.1 2 12Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3L21 21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6 10.7C10.2 11.1 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 12.9 13.8 13.3 13.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.9 5.3C10.6 5.1 11.3 5 12 5C16.6 5 20.2 7.9 22 12C21.2 13.8 20.1 15.3 18.6 16.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6.2C4.3 7.5 3 9.5 2 12C3.8 16.1 7.4 19 12 19C13.9 19 15.6 18.5 17 17.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
