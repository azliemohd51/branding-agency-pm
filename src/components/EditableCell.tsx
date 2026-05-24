// Version: 1.4
"use client";

import {
  useState,
  useRef,
  useEffect,
  useTransition,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Check, X } from "lucide-react";

export type EditableType = "text" | "number" | "date" | "url" | "select";

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

interface Props {
  type: EditableType;
  value: string | null;
  onSave: (newValue: string | null) => Promise<void> | void;
  options?: SelectOption[];
  display?: ReactNode;            // custom read-only render (e.g. chip)
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  align?: "left" | "center";
  commitOnBlur?: boolean;          // default true; set false for select where blur fires too early
  fullWidth?: boolean;
}

export function EditableCell({
  type,
  value,
  onSave,
  options,
  display,
  placeholder = "—",
  className = "",
  inputClassName = "",
  disabled = false,
  align = "left",
  commitOnBlur = true,
  fullWidth = true,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState<string>(value ?? "");
  const [pending, start] = useTransition();
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    setVal(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement && (type === "text" || type === "url" || type === "number")) {
        inputRef.current.select();
      }
    }
  }, [editing, type]);

  const commit = () => {
    const trimmed = val.trim();
    const finalVal = trimmed === "" ? null : trimmed;
    setEditing(false);
    if (finalVal !== value) {
      start(() => {
        void onSave(finalVal);
      });
    }
  };

  const cancel = () => {
    setVal(value ?? "");
    setEditing(false);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter" && type !== "text") {
      e.preventDefault();
      commit();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
  };

  if (!editing) {
    return (
      <button
        disabled={disabled}
        onClick={() => !disabled && setEditing(true)}
        className={`group/cell relative ${fullWidth ? "w-full" : ""} ${
          align === "center" ? "text-center justify-center flex items-center" : "text-left"
        } px-2 py-1 -mx-1 rounded transition ${
          !disabled ? "hover:bg-bg-2 hover:ring-1 hover:ring-line cursor-text" : "cursor-default"
        } ${pending ? "opacity-50" : ""} ${className}`}
      >
        {display !== undefined ? (
          display
        ) : value ? (
          <span className="truncate">{value}</span>
        ) : (
          <span className="text-ink-3 italic">{placeholder}</span>
        )}
      </button>
    );
  }

  const inputBase =
    "w-full bg-bg-1 border border-accent rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-accent/30";

  if (type === "select") {
    return (
      <div className="flex items-center gap-1">
        <select
          ref={(el) => {
            inputRef.current = el;
          }}
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            // for select, commit on change
            const trimmed = e.target.value.trim();
            const finalVal = trimmed === "" ? null : trimmed;
            setEditing(false);
            if (finalVal !== value) {
              start(() => {
                void onSave(finalVal);
              });
            }
          }}
          onBlur={commitOnBlur ? commit : undefined}
          onKeyDown={onKey}
          className={`${inputBase} ${inputClassName}`}
        >
          <option value="">— none —</option>
          {options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      <input
        ref={(el) => {
          inputRef.current = el;
        }}
        type={type === "number" ? "number" : type === "date" ? "date" : type === "url" ? "url" : "text"}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commitOnBlur ? commit : undefined}
        onKeyDown={onKey}
        placeholder={placeholder}
        className={`${inputBase} ${inputClassName}`}
      />
      {!commitOnBlur && (
        <>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              commit();
            }}
            className="size-7 grid place-items-center text-success hover:bg-bg-2 rounded transition"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              cancel();
            }}
            className="size-7 grid place-items-center text-ink-3 hover:bg-bg-2 rounded transition"
          >
            <X size={14} />
          </button>
        </>
      )}
    </div>
  );
}
