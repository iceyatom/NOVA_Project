"use client";

import {
  useRef,
  type MouseEventHandler,
  type PointerEventHandler,
} from "react";

type BackdropCloseHandlers<T extends HTMLElement> = {
  onPointerDown: PointerEventHandler<T>;
  onClick: MouseEventHandler<T>;
};

export default function useBackdropPointerClose<
  T extends HTMLElement = HTMLDivElement,
>(onClose: () => void): BackdropCloseHandlers<T> {
  const pointerStartedOnBackdropRef = useRef(false);

  const onPointerDown: PointerEventHandler<T> = (event) => {
    pointerStartedOnBackdropRef.current = event.target === event.currentTarget;
  };

  const onClick: MouseEventHandler<T> = (event) => {
    const clickedBackdrop = event.target === event.currentTarget;
    if (clickedBackdrop && pointerStartedOnBackdropRef.current) {
      onClose();
    }
    pointerStartedOnBackdropRef.current = false;
  };

  return { onPointerDown, onClick };
}
