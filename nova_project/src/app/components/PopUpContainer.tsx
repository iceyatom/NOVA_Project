import React, { ReactNode } from "react";
import "../styles/PopUpContainer.css";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";

interface PopupData {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const PopUpContainer: React.FC<PopupData> = ({ isOpen, onClose, children }) => {
  const backdropCloseHandlers =
    useBackdropPointerClose<HTMLDivElement>(onClose);

  if (!isOpen) return null;

  return (
    <div className="popup-backdrop" {...backdropCloseHandlers}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <div className="popup-content">{children}</div>
      </div>
    </div>
  );
};

export default PopUpContainer;
