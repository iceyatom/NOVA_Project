"use client";

import { useEffect, useRef, useState } from "react";

type CategoryComboProps = {
  value: string;
  placeholder: string;
  options: string[];
  ariaLabel: string;
  onSelect: (value: string) => void;
  onNewClick: () => void;
};

export default function CategoryCombo({
  value,
  placeholder,
  options,
  ariaLabel,
  onSelect,
  onNewClick,
}: CategoryComboProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={dropdownRef} className="item-dropdown">
      <button
        type="button"
        className="item-search-page__select item-dropdown__trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          className={`item-dropdown__trigger-text${value ? "" : " item-dropdown__trigger-text--placeholder"}`}
        >
          {value || placeholder}
        </span>
        <span aria-hidden="true" className="item-dropdown__trigger-icon">
          {isOpen ? "\u25B4" : "\u25BE"}
        </span>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={`${ariaLabel} options`}
          className="item-dropdown__menu"
        >
          <button
            type="button"
            onClick={() => {
              onSelect("");
              setIsOpen(false);
            }}
            className="item-dropdown__option item-dropdown__option--placeholder"
          >
            None
          </button>

          {options.length > 0 ? (
            options.map((option) => {
              const isSelected = value === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setIsOpen(false);
                  }}
                  className={`item-dropdown__option${isSelected ? " item-dropdown__option--selected" : ""}`}
                >
                  {option}
                </button>
              );
            })
          ) : (
            <div className="item-dropdown__empty">No options</div>
          )}

          <div className="item-dropdown__footer">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNewClick();
              }}
              className="staff-dev-pill item-dropdown__new-button"
            >
              New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
