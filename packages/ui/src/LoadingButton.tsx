"use client";

type LoadingButtonProps = {
  children: React.ReactNode;
  variant?: "blue" | "green" | "slate";
  isPending?: boolean;
  formAction?: (formData: FormData) => void;
  className?: string;
};

const variants = {
  blue: {
    base: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
    spinner: "border-blue-200 border-t-blue-600",
  },
  green: {
    base: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    spinner: "border-green-200 border-t-green-600",
  },
  slate: {
    base: "bg-slate-900 hover:bg-slate-800 focus:ring-slate-900",
    spinner: "border-slate-400 border-t-white",
  },
};

export function LoadingButton({
  children,
  variant = "blue",
  isPending = false,
  formAction,
  className = "",
}: LoadingButtonProps) {
  const v = variants[variant] || variants.blue;

  return (
    <button
      type="submit"
      disabled={isPending}
      formAction={formAction}
      className={`
        w-full py-2.5 px-4 text-white font-semibold rounded-xl transition cursor-pointer shadow-xs
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${v.base} ${className}
      `}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-2">
          <span className={`w-4 h-4 border-2 rounded-full animate-spin ${v.spinner}`} />
          <span>Se autentifică...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
