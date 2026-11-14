import type { ReactNode } from "react";

type GameButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  primary?: boolean;
  onClick?: () => void;
};

export default function GameButton({
  children,
  icon,
  primary = false,
  onClick,
}: GameButtonProps) {
  return (
    <button
      type="button"
      className={`game-button ${primary ? "game-button--primary" : ""}`}
      onClick={onClick}
    >
      {icon && <span className="game-button__icon">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
