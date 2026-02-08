import React from "react";

interface Props {
  variant: "outline" | "danger" | "primary";
  children: React.ReactNode;
  action: () => void;
  className?: string;
}

export default function Button({
  variant,
  children,
  action,
  className = "",
}: Props) {
  const variantClasses = {
    outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-100",
    danger: "bg-red-500 hover:bg-red-700 text-white",
    primary: "bg-blue-500 hover:bg-blue-700 text-white",
  };

  return (
    <button
      className={`px-4 py-2 rounded-md font-medium ${variantClasses[variant]} ${className}`}
      onClick={action}
    >
      {children}
    </button>
  );
}
