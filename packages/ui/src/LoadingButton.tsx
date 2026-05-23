"use client";

interface LoadingButtonProps {
  children: React.ReactNode;
  variant: "blue" | "green";
  isPending?: boolean;
  formAction?: (formData: FormData) => void;
  className?: string;
}

const variants = {
  blue: {
    base: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    spinner: "border-blue-200 border-t-blue-600",
  },
  green: {
    base: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    spinner: "border-green-200 border-t-green-600",
  },
};

export function LoadingButton({
  children,
  variant = "blue",
  isPending = false,
  formAction,
  className = "",
}: LoadingButtonProps) {
  const v = variants[variant];

  return (
    <button
      type="submit"
      disabled={isPending}
      formAction={formAction}
      className={`
        w-full py-2 px-4 text-white font-medium rounded transition
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${v.base} ${className}
      `}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className={`opacity-25 ${v.spinner}`}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Signing in...
        </span>
      ) : (
        children
      )}
    </button>
  );
}