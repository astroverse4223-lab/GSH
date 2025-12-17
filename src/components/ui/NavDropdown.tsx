"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./NavDropdown.module.css";

interface NavDropdownProps {
  label: string | React.ReactNode;
  items: {
    href: string;
    label: string;
    icon?: string;
    onClick?: () => void;
  }[];
}

export function NavDropdown({ label, items }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      {React.isValidElement(label) ? (
        <div
          className={styles.dropdownTrigger}
          onClick={() => setIsOpen(!isOpen)}>
          {React.cloneElement(label as React.ReactElement, {
            onClick: () => setIsOpen(!isOpen),
          })}
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <button
          className={styles.dropdownTrigger}
          onClick={() => setIsOpen(!isOpen)}>
          {label}
          <svg
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {isOpen && (
        <div className={styles.dropdownMenu}>
          {items.map((item) =>
            item.onClick ? (
              <button
                key={item.href}
                className={styles.dropdownItem}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}>
                {item.icon && (
                  <span className={styles.itemIcon}>{item.icon}</span>
                )}
                {item.label}
              </button>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={styles.dropdownItem}
                onClick={() => setIsOpen(false)}>
                {item.icon && (
                  <span className={styles.itemIcon}>{item.icon}</span>
                )}
                {item.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
