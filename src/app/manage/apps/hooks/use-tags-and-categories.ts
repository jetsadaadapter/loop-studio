"use client";

import { useEffect, useState } from "react";
import type { ManageTagListResponse } from "@/core/interfaces/tags.interface";
import { getManageApps } from "@/core/services/apps.service";
import { getUserProfile } from "@/core/services/users.service";

export function useTagsAndCategories() {
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagNameToId, setTagNameToId] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    let fallbackLoaded = false;

    async function loadFallbackFromApps() {
      if (fallbackLoaded) return;
      fallbackLoaded = true;
      try {
        const appsPage = await getManageApps({ page: 1, limit: 1000 });
        if (cancelled) return;
        const appsList = appsPage.data ?? [];

        // 1. Extract unique Categories from app list
        const extractedCategories: Array<{ id: string; name: string }> = [];
        const seenCategoryIds = new Set<string>();
        for (const app of appsList) {
          if (app.category && typeof app.category === "object" && app.category.id) {
            const catId = app.category.id;
            if (!seenCategoryIds.has(catId)) {
              seenCategoryIds.add(catId);
              extractedCategories.push({
                id: catId,
                name: app.category.name,
              });
            }
          } else if (app.categoryId && typeof app.category === "string") {
            const catId = app.categoryId;
            if (!seenCategoryIds.has(catId)) {
              seenCategoryIds.add(catId);
              extractedCategories.push({
                id: catId,
                name: app.category,
              });
            }
          }
        }
        setCategories(extractedCategories);

        // 2. Extract unique Tags from app list
        const suggestions: string[] = [];
        const nameToId: Record<string, string> = {};
        const seenTagNames = new Set<string>();
        for (const app of appsList) {
          if (Array.isArray(app.tags)) {
            for (const tag of app.tags) {
              const tagObj = tag as unknown;
              if (tagObj && typeof tagObj === "object") {
                const tagRecord = tagObj as Record<string, unknown>;
                const tagName = String(tagRecord.name ?? "").trim();
                const tagId = String(tagRecord.id ?? tagRecord.tagId ?? "");
                if (tagName && tagId) {
                  const lowerName = tagName.toLowerCase();
                  if (!seenTagNames.has(lowerName)) {
                    seenTagNames.add(lowerName);
                    suggestions.push(tagName);
                    nameToId[lowerName] = tagId;
                  }
                }
              } else if (typeof tagObj === "string" && tagObj.trim()) {
                const tagName = tagObj.trim();
                const lowerName = tagName.toLowerCase();
                if (!seenTagNames.has(lowerName)) {
                  seenTagNames.add(lowerName);
                  suggestions.push(tagName);
                  nameToId[lowerName] = lowerName;
                }
              }
            }
          }
        }
        setTagSuggestions(suggestions);
        setTagNameToId(nameToId);
      } catch {
        // Silent catch
      }
    }

    async function loadManageTags() {
      try {
        const response = await fetch("/api/manage/tags", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          await loadFallbackFromApps();
          return;
        }

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
          await loadFallbackFromApps();
        }
      }
    }

    async function loadCategories() {
      try {
        const response = await fetch("/api/manage/categories", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) {
          await loadFallbackFromApps();
          return;
        }

        const payload = await response.json();
        const data = Array.isArray(payload.data) ? payload.data : [];
        if (!cancelled) setCategories(data);
      } catch {
        if (!cancelled) {
          await loadFallbackFromApps();
        }
      }
    }

    async function init() {
      try {
        const profile = await getUserProfile();
        if (cancelled) return;
        const hasAccess = (profile.roles ?? []).some(
          (r) => r === "admin" || r === "system-admin"
        );
        if (!hasAccess) {
          await loadFallbackFromApps();
          return;
        }
        void loadManageTags();
        void loadCategories();
      } catch {
        if (!cancelled) {
          await loadFallbackFromApps();
        }
      }
    }

    void init();

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
