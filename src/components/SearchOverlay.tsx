"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { HiSearch, HiX } from "react-icons/hi";
import { PunkAvatar } from "./PunkAvatar";

export interface SearchItem {
  type: "punk" | "project";
  id: string | number;
  name: string;
  slug: string;
  punkId?: number;
}

interface SearchOverlayProps {
  items: SearchItem[];
}

export function SearchOverlay({ items }: SearchOverlayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filteredItems = query.trim()
    ? items.filter((item) => {
        const q = query.toLowerCase();
        const name = String(item.name ?? "");
        const nameMatch = name.toLowerCase().includes(q);
        const idMatch = String(item.id).includes(q);
        return nameMatch || idMatch;
      })
    : [];

  const punks = filteredItems.filter((item) => item.type === "punk");
  const projects = filteredItems.filter((item) => item.type === "project");

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
  };

  const handleSelect = (item: SearchItem) => {
    router.push(item.slug);
    handleClose();
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-9 h-9 flex items-center justify-center hover:bg-foreground/5 transition-colors"
        title="Search (⌘K)"
      >
        <HiSearch className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Search container */}
      <div className="relative mx-auto max-w-2xl px-4 pt-4">
        <div className="bg-background border-2 border-foreground/10 shadow-xl">
          {/* Input row */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-foreground/10">
            <HiSearch className="w-5 h-5 opacity-40 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search punks and projects..."
              className="flex-1 bg-transparent outline-none text-lg"
            />
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-foreground/5 transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="max-h-[60vh] overflow-y-auto">
              {punks.length === 0 && projects.length === 0 ? (
                <div className="px-4 py-8 text-center opacity-50">
                  No results for &quot;{query}&quot;
                </div>
              ) : (
                <>
                  {/* Punks */}
                  {punks.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs uppercase tracking-wider opacity-40 bg-foreground/5">
                        Punks
                      </div>
                      {punks.map((item) => (
                        <button
                          key={`punk-${item.id}`}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 transition-colors text-left"
                        >
                          <PunkAvatar punkId={item.punkId!} size={24} />
                          <span className="font-medium">{item.name}</span>
                          <span className="opacity-40">#{item.id}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div>
                      <div className="px-4 py-2 text-xs uppercase tracking-wider opacity-40 bg-foreground/5">
                        Projects
                      </div>
                      {projects.map((item) => (
                        <button
                          key={`project-${item.id}`}
                          onClick={() => handleSelect(item)}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-foreground/5 transition-colors text-left"
                        >
                          <span className="font-medium">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Hint */}
          {!query.trim() && (
            <div className="px-4 py-6 text-center opacity-40">
              Type to search punks by name or ID, or projects by name
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
