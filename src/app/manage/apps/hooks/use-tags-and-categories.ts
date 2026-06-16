"use client";

import { useEffect, useState } from "react";
import type { ManageTagListResponse } from "@/core/interfaces/tags.interface";

export function useTagsAndCategories() {
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagNameToId, setTagNameToId] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadManageTags() {
      try {
        const response = await fetch("/api/manage/tags", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = (await response.json()) as ManageTagListResponse;
        const tags = Array.isArray(payload.data) ? payload.data : [];
        if (cancelled) return;

        setTagSuggestions(tags.map((tag) => tag.name).filter(Boolean));
        setTagNameToId(
          Object.fromEntries(
            tags
              .filter((tag) => tag.name && tag.id)
              .map((tag) => [tag.name.trim().toLowerCase(), tag.id]),
          ),
        );
      } catch {
        if (!cancelled) {
          setTagSuggestions([]);
          setTagNameToId({});
        }
      }
    }

    void loadManageTags();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/manage/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;

        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    tagSuggestions,
    tagNameToId,
    categories,
  };
}
