import { MessageCircle } from "lucide-react";

interface SupportButtonProps {
  onClick: () => void;
}

export default function SupportButton({ onClick }: SupportButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-blue-600 text-white
        shadow-lg
        hover:bg-blue-700 hover:scale-105
        transition-all duration-300
      "
      aria-label="Support technique"
    >
      <MessageCircle size={26} />
    </button>
  );
}




