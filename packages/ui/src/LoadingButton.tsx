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
        <span className="flex items-center justify-center">
          Signing in...
        </span>
      ) : (
        children
      )}
    </button>
  );
}