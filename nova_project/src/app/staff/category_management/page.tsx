"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type KeyboardEvent,
  type SetStateAction,
} from "react";
import CategoryCreateModal, {
  type CategoryLevel,
} from "@/app/components/CategoryCreateModal";
import useBackdropPointerClose from "@/app/hooks/useBackdropPointerClose";

type CategoryApiResponse = {
  categories?: unknown;
};

type SubcategoryApiResponse = {
  subcategories?: unknown;
};

type TypeApiResponse = {
  types?: unknown;
};

type HierarchySubcategoryEntry = {
  name: string;
  parentCategory3: string;
};

type HierarchyTypeEntry = {
  name: string;
  parentCategory3: string;
  parentCategory2: string;
};

type HierarchySearchResponse = {
  success?: boolean;
  data?: {
    categories?: unknown;
    subcategories?: unknown;
    types?: unknown;
  };
};

type HierarchyListPayload = Partial<
  Record<"categories" | "subcategories" | "types", unknown>
>;

type ClassificationSearchOption = {
  key: string;
  level: CategoryLevel;
  name: string;
  parentCategory3: string | null;
  parentCategory2: string | null;
  displayValue: string;
  contextText: string;
  searchText: string;
};

type EditPopupContext = {
  level: CategoryLevel;
  name: string;
  parentCategory3?: string;
  parentCategory2?: string;
};

type DependencyInfo = {
  subcategoryCount: number;
  typeCount: number;
};

type SessionResponse = {
  ok?: boolean;
  account?: {
    role?: unknown;
  };
};

const PAGE_SIZE = 10;

function parseStringArray(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((entry): entry is string => typeof entry === "string");
}

function parseHierarchySubcategories(
  payload: unknown,
): HierarchySubcategoryEntry[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      if (
        typeof candidate.name !== "string" ||
        typeof candidate.parentCategory3 !== "string"
      ) {
        return null;
      }

      return {
        name: candidate.name,
        parentCategory3: candidate.parentCategory3,
      } satisfies HierarchySubcategoryEntry;
    })
    .filter((entry): entry is HierarchySubcategoryEntry => entry !== null);
}

function parseHierarchyTypes(payload: unknown): HierarchyTypeEntry[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const candidate = entry as Record<string, unknown>;
      if (
        typeof candidate.name !== "string" ||
        typeof candidate.parentCategory3 !== "string" ||
        typeof candidate.parentCategory2 !== "string"
      ) {
        return null;
      }

      return {
        name: candidate.name,
        parentCategory3: candidate.parentCategory3,
        parentCategory2: candidate.parentCategory2,
      } satisfies HierarchyTypeEntry;
    })
    .filter((entry): entry is HierarchyTypeEntry => entry !== null);
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function getTotalPages(itemCount: number): number {
  return Math.max(1, Math.ceil(itemCount / PAGE_SIZE));
}

function changePage(
  setPage: Dispatch<SetStateAction<number>>,
  totalPages: number,
  pageDelta: number,
) {
  setPage((current) => Math.min(totalPages, Math.max(1, current + pageDelta)));
}

function fetchListKey(
  payload: HierarchyListPayload,
  key: "categories" | "subcategories" | "types",
): string[] {
  return parseStringArray(payload[key]);
}

function normalizeRole(value: string): string {
  return value.trim().toUpperCase();
}

function TablePagination({
  page,
  totalPages,
  setPage,
}: {
  page: number;
  totalPages: number;
  setPage: Dispatch<SetStateAction<number>>;
}) {
  return (
    <div className="category-mgmt-pagination-controls">
      <button
        className="pagination__nav"
        onClick={() => setPage(1)}
        disabled={page === 1}
      >
        &lt;&lt;&lt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, -5)}
        disabled={page === 1}
      >
        &lt;&lt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, -1)}
        disabled={page === 1}
      >
        &lt;
      </button>
      <span className="item-search-page__page-info">
        Page {page} of {totalPages}
      </span>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, 1)}
        disabled={page === totalPages}
      >
        &gt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => changePage(setPage, totalPages, 5)}
        disabled={page === totalPages}
      >
        &gt;&gt;
      </button>
      <button
        className="pagination__nav"
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages}
      >
        &gt;&gt;&gt;
      </button>
    </div>
  );
}

export default function StaffCategoryManagementPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null,
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [allSubcategories, setAllSubcategories] = useState<
    HierarchySubcategoryEntry[]
  >([]);
  const [allTypes, setAllTypes] = useState<HierarchyTypeEntry[]>([]);
  const [classificationSearchInput, setClassificationSearchInput] =
    useState("");
  const [selectedSearchOptionKey, setSelectedSearchOptionKey] = useState<
    string | null
  >(null);
  const [isSearchSuggestionsOpen, setIsSearchSuggestionsOpen] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [categoryPage, setCategoryPage] = useState(1);
  const [subcategoryPage, setSubcategoryPage] = useState(1);
  const [typePage, setTypePage] = useState(1);
  const [editPopupContext, setEditPopupContext] =
    useState<EditPopupContext | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const [editName, setEditName] = useState("");
  const [editParentCategory3, setEditParentCategory3] = useState("");
  const [editParentCategory2, setEditParentCategory2] = useState("");
  const [editParentCategory2Options, setEditParentCategory2Options] = useState<
    string[]
  >([]);

  const [dependencyInfo, setDependencyInfo] = useState<DependencyInfo>({
    subcategoryCount: 0,
    typeCount: 0,
  });

  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [editPopupError, setEditPopupError] = useState<string | null>(null);
  const [editPopupSuccess, setEditPopupSuccess] = useState<string | null>(null);

  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [createCategoryLevel, setCreateCategoryLevel] =
    useState<CategoryLevel>("category3");
  const [viewerRole, setViewerRole] = useState<string | null>(null);
  const searchBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    let disposed = false;

    const fetchViewerRole = async () => {
      try {
        const response = await fetch("/api/auth/session", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (!disposed) {
            setViewerRole(null);
          }
          return;
        }

        const payload = (await response.json()) as SessionResponse;
        const nextRole =
          typeof payload.account?.role === "string" ? payload.account.role : "";

        if (!disposed) {
          setViewerRole(nextRole);
        }
      } catch {
        if (!disposed) {
          setViewerRole(null);
        }
      }
    };

    fetchViewerRole();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (searchBlurTimeoutRef.current) {
        clearTimeout(searchBlurTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let disposed = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/catalog/categories", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load categories.");
        }

        const payload = (await response.json()) as CategoryApiResponse;
        const nextCategories = fetchListKey(payload, "categories");

        if (disposed) {
          return;
        }

        setCategories(nextCategories);
      } catch {
        if (!disposed) {
          setLoadError("Failed to load category hierarchy.");
        }
      } finally {
        if (!disposed) {
          setCategoriesLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      disposed = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    let disposed = false;

    const loadHierarchyForSearch = async () => {
      try {
        const response = await fetch(
          "/api/catalog/staff/categories?action=hierarchy",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load classification search data.");
        }

        const payload = (await response.json()) as HierarchySearchResponse;
        const nextCategories = fetchListKey(payload.data ?? {}, "categories");
        const nextSubcategories = parseHierarchySubcategories(
          payload.data?.subcategories,
        );
        const nextTypes = parseHierarchyTypes(payload.data?.types);

        if (disposed) {
          return;
        }

        setCategories(nextCategories);
        setAllSubcategories(nextSubcategories);
        setAllTypes(nextTypes);
      } catch {
        if (!disposed) {
          setAllSubcategories([]);
          setAllTypes([]);
        }
      }
    };

    void loadHierarchyForSearch();

    return () => {
      disposed = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    let disposed = false;

    if (!selectedCategory) {
      setSubcategories([]);
      setSelectedSubcategory(null);
      setTypes([]);
      setSelectedType(null);
      setSubcategoriesLoading(false);
      return;
    }

    const loadSubcategories = async () => {
      setSubcategoriesLoading(true);
      setTypes([]);

      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(selectedCategory)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load subcategories.");
        }

        const payload = (await response.json()) as SubcategoryApiResponse;
        const nextSubcategories = fetchListKey(payload, "subcategories");

        if (!disposed) {
          setSubcategories(nextSubcategories);
        }
      } catch {
        if (!disposed) {
          setSubcategories([]);
        }
      } finally {
        if (!disposed) {
          setSubcategoriesLoading(false);
          setSubcategoryPage(1);
          setTypePage(1);
        }
      }
    };

    loadSubcategories();

    return () => {
      disposed = true;
    };
  }, [selectedCategory, refreshToken]);

  useEffect(() => {
    let disposed = false;

    if (!selectedCategory || !selectedSubcategory) {
      setTypes([]);
      setSelectedType(null);
      setTypesLoading(false);
      return;
    }

    const loadTypes = async () => {
      setTypesLoading(true);

      try {
        const response = await fetch(
          `/api/catalog/staff/types?category=${encodeURIComponent(selectedCategory)}&subcategory=${encodeURIComponent(selectedSubcategory)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load types.");
        }

        const payload = (await response.json()) as TypeApiResponse;
        const nextTypes = fetchListKey(payload, "types");

        if (!disposed) {
          setTypes(nextTypes);
        }
      } catch {
        if (!disposed) {
          setTypes([]);
        }
      } finally {
        if (!disposed) {
          setTypesLoading(false);
          setTypePage(1);
        }
      }
    };

    loadTypes();

    return () => {
      disposed = true;
    };
  }, [selectedCategory, selectedSubcategory, refreshToken]);

  const classificationOptions = useMemo<ClassificationSearchOption[]>(() => {
    const levelOrder: Record<CategoryLevel, number> = {
      category3: 0,
      category2: 1,
      category1: 2,
    };

    const nextOptions: ClassificationSearchOption[] = [
      ...categories.map((category) => ({
        key: `category3::${category}`,
        level: "category3" as const,
        name: category,
        parentCategory3: null,
        parentCategory2: null,
        displayValue: `${category} (Category)`,
        contextText: "Category (Level 3)",
        searchText: normalizeSearchText(`${category} category level 3`),
      })),
      ...allSubcategories.map((subcategory) => ({
        key: `category2::${subcategory.parentCategory3}::${subcategory.name}`,
        level: "category2" as const,
        name: subcategory.name,
        parentCategory3: subcategory.parentCategory3,
        parentCategory2: null,
        displayValue: `${subcategory.name} (${subcategory.parentCategory3})`,
        contextText: `Subcategory (Level 2) | ${subcategory.parentCategory3}`,
        searchText: normalizeSearchText(
          `${subcategory.name} ${subcategory.parentCategory3} subcategory level 2`,
        ),
      })),
      ...allTypes.map((typeEntry) => ({
        key: `category1::${typeEntry.parentCategory3}::${typeEntry.parentCategory2}::${typeEntry.name}`,
        level: "category1" as const,
        name: typeEntry.name,
        parentCategory3: typeEntry.parentCategory3,
        parentCategory2: typeEntry.parentCategory2,
        displayValue: `${typeEntry.name} (${typeEntry.parentCategory3} > ${typeEntry.parentCategory2})`,
        contextText: `Type (Level 1) | ${typeEntry.parentCategory3} > ${typeEntry.parentCategory2}`,
        searchText: normalizeSearchText(
          `${typeEntry.name} ${typeEntry.parentCategory3} ${typeEntry.parentCategory2} type level 1`,
        ),
      })),
    ];

    nextOptions.sort((left, right) => {
      const levelDiff = levelOrder[left.level] - levelOrder[right.level];
      if (levelDiff !== 0) return levelDiff;

      const byName = left.name.localeCompare(right.name, undefined, {
        sensitivity: "base",
      });
      if (byName !== 0) return byName;

      const byParentCategory3 = (left.parentCategory3 ?? "").localeCompare(
        right.parentCategory3 ?? "",
        undefined,
        { sensitivity: "base" },
      );
      if (byParentCategory3 !== 0) return byParentCategory3;

      return (left.parentCategory2 ?? "").localeCompare(
        right.parentCategory2 ?? "",
        undefined,
        { sensitivity: "base" },
      );
    });

    return nextOptions;
  }, [allSubcategories, allTypes, categories]);

  const normalizedSearchQuery = normalizeSearchText(classificationSearchInput);

  const classificationSuggestions = useMemo(() => {
    if (!normalizedSearchQuery) {
      return [] as ClassificationSearchOption[];
    }

    return classificationOptions
      .filter((option) => option.searchText.includes(normalizedSearchQuery))
      .sort((left, right) => {
        const leftStartsWithName = left.name
          .toLowerCase()
          .startsWith(normalizedSearchQuery)
          ? 0
          : 1;
        const rightStartsWithName = right.name
          .toLowerCase()
          .startsWith(normalizedSearchQuery)
          ? 0
          : 1;
        if (leftStartsWithName !== rightStartsWithName) {
          return leftStartsWithName - rightStartsWithName;
        }

        return left.name.localeCompare(right.name, undefined, {
          sensitivity: "base",
        });
      })
      .slice(0, 25);
  }, [classificationOptions, normalizedSearchQuery]);

  const selectedSearchOption = useMemo(
    () =>
      selectedSearchOptionKey
        ? (classificationOptions.find(
            (option) => option.key === selectedSearchOptionKey,
          ) ?? null)
        : null,
    [classificationOptions, selectedSearchOptionKey],
  );

  const categoryTotalPages = getTotalPages(categories.length);
  const subcategoryTotalPages = getTotalPages(subcategories.length);
  const typeTotalPages = getTotalPages(types.length);

  useEffect(() => {
    setCategoryPage((current) => Math.min(current, categoryTotalPages));
  }, [categoryTotalPages]);

  useEffect(() => {
    setSubcategoryPage((current) => Math.min(current, subcategoryTotalPages));
  }, [subcategoryTotalPages]);

  useEffect(() => {
    setTypePage((current) => Math.min(current, typeTotalPages));
  }, [typeTotalPages]);

  useEffect(() => {
    if (!selectedSearchOptionKey) return;

    if (
      !classificationOptions.some(
        (option) => option.key === selectedSearchOptionKey,
      )
    ) {
      setSelectedSearchOptionKey(null);
    }
  }, [classificationOptions, selectedSearchOptionKey]);

  useEffect(() => {
    if (!selectedCategory) return;
    const selectedIndex = categories.findIndex(
      (name) => name === selectedCategory,
    );
    if (selectedIndex < 0) return;

    setCategoryPage(Math.floor(selectedIndex / PAGE_SIZE) + 1);
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (!selectedSubcategory) return;
    const selectedIndex = subcategories.findIndex(
      (name) => name === selectedSubcategory,
    );
    if (selectedIndex < 0) return;

    setSubcategoryPage(Math.floor(selectedIndex / PAGE_SIZE) + 1);
  }, [selectedSubcategory, subcategories]);

  useEffect(() => {
    if (!selectedType) return;
    const selectedIndex = types.findIndex((name) => name === selectedType);
    if (selectedIndex < 0) return;

    setTypePage(Math.floor(selectedIndex / PAGE_SIZE) + 1);
  }, [selectedType, types]);

  const pagedCategories = categories.slice(
    (categoryPage - 1) * PAGE_SIZE,
    categoryPage * PAGE_SIZE,
  );
  const pagedSubcategories = subcategories.slice(
    (subcategoryPage - 1) * PAGE_SIZE,
    subcategoryPage * PAGE_SIZE,
  );
  const pagedTypes = types.slice(
    (typePage - 1) * PAGE_SIZE,
    typePage * PAGE_SIZE,
  );

  const shouldShowSearchSuggestions =
    isSearchSuggestionsOpen && normalizedSearchQuery.length > 0;

  const applySearchOptionSelection = (option: ClassificationSearchOption) => {
    setClassificationSearchInput(option.displayValue);
    setSelectedSearchOptionKey(option.key);
    setIsSearchSuggestionsOpen(false);
    setSearchMessage(null);
    setEditPopupContext(null);

    if (option.level === "category3") {
      setSelectedCategory(option.name);
      setSelectedSubcategory(null);
      setSelectedType(null);
      setSubcategoryPage(1);
      setTypePage(1);
      return;
    }

    if (option.level === "category2") {
      if (!option.parentCategory3) {
        return;
      }

      setSelectedCategory(option.parentCategory3);
      setSelectedSubcategory(option.name);
      setSelectedType(null);
      setTypePage(1);
      return;
    }

    if (!option.parentCategory3 || !option.parentCategory2) {
      return;
    }

    setSelectedCategory(option.parentCategory3);
    setSelectedSubcategory(option.parentCategory2);
    setSelectedType(option.name);
  };

  const handleSearchInputChange = (value: string) => {
    setClassificationSearchInput(value);
    setSelectedSearchOptionKey(null);
    setSearchMessage(null);
    setIsSearchSuggestionsOpen(true);
  };

  const handleSearchInputFocus = () => {
    if (searchBlurTimeoutRef.current) {
      clearTimeout(searchBlurTimeoutRef.current);
      searchBlurTimeoutRef.current = null;
    }
    setIsSearchSuggestionsOpen(true);
  };

  const handleSearchInputBlur = () => {
    if (searchBlurTimeoutRef.current) {
      clearTimeout(searchBlurTimeoutRef.current);
    }

    searchBlurTimeoutRef.current = setTimeout(() => {
      setIsSearchSuggestionsOpen(false);
      searchBlurTimeoutRef.current = null;
    }, 120);
  };

  const handleSearchInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsSearchSuggestionsOpen(false);
      return;
    }

    if (event.key === "Enter" && !selectedSearchOptionKey) {
      event.preventDefault();
      setSearchMessage(
        "Select one autocomplete option before applying classification search.",
      );
    }
  };

  const handleClassificationSearchSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedSearchOption) {
      setSearchMessage(
        "Select one autocomplete option before applying classification search.",
      );
      return;
    }

    applySearchOptionSelection(selectedSearchOption);
  };

  const handleClearClassificationSearch = () => {
    setClassificationSearchInput("");
    setSelectedSearchOptionKey(null);
    setSearchMessage(null);
    setIsSearchSuggestionsOpen(false);
  };

  const closeEditPopup = () => {
    setEditPopupContext(null);
    setEditPopupError(null);
    setEditPopupSuccess(null);
    setDeleteConfirmChecked(false);
    setShowDeleteConfirmation(false);
    setShowSaveConfirmation(false);
  };

  const closeCreatePopup = () => {
    setShowCreatePopup(false);
  };

  const openCreatePopup = (level: CategoryLevel) => {
    if (isViewerStaff) {
      return;
    }

    setEditPopupContext(null);
    setShowSaveConfirmation(false);
    setShowCreatePopup(true);
    setCreateCategoryLevel(level);
  };

  const openEditPopup = (context: EditPopupContext) => {
    if (isViewerStaff) {
      return;
    }

    setEditPopupContext(context);
  };

  const handleCategoryCreated = (result: {
    level: CategoryLevel;
    name: string;
    parentCategory3: string | null;
    parentCategory2: string | null;
  }) => {
    if (result.level === "category3") {
      setSelectedCategory(result.name);
      setSelectedSubcategory(null);
      setSelectedType(null);
    } else if (result.level === "category2") {
      setSelectedCategory(result.parentCategory3 ?? "");
      setSelectedSubcategory(result.name);
      setSelectedType(null);
    } else {
      setSelectedCategory(result.parentCategory3 ?? "");
      setSelectedSubcategory(result.parentCategory2 ?? "");
      setSelectedType(result.name);
    }

    setSubcategoryPage(1);
    setTypePage(1);
    setRefreshToken((current) => current + 1);
    closeCreatePopup();
  };

  useEffect(() => {
    let disposed = false;

    if (!editPopupContext) {
      setEditName("");
      setEditParentCategory3("");
      setEditParentCategory2("");
      setEditParentCategory2Options([]);
      setDependencyInfo({ subcategoryCount: 0, typeCount: 0 });
      setEditPopupError(null);
      setEditPopupSuccess(null);
      setDeleteConfirmChecked(false);
      setShowDeleteConfirmation(false);
      setShowSaveConfirmation(false);
      return;
    }

    setEditName(editPopupContext.name);
    setEditParentCategory3(editPopupContext.parentCategory3 ?? "");
    setEditParentCategory2(editPopupContext.parentCategory2 ?? "");
    setEditPopupError(null);
    setEditPopupSuccess(null);
    setDeleteConfirmChecked(false);
    setShowDeleteConfirmation(false);
    setShowSaveConfirmation(false);

    const loadDependencyInfo = async () => {
      const params = new URLSearchParams({
        action: "dependencies",
        level: editPopupContext.level,
        name: editPopupContext.name,
      });

      if (editPopupContext.parentCategory3) {
        params.set("parentCategory3", editPopupContext.parentCategory3);
      }
      if (editPopupContext.parentCategory2) {
        params.set("parentCategory2", editPopupContext.parentCategory2);
      }

      try {
        const response = await fetch(
          `/api/catalog/staff/categories?${params.toString()}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load dependency details.");
        }

        const payload = (await response.json()) as {
          data?: { subcategoryCount?: number; typeCount?: number };
        };

        if (disposed) {
          return;
        }

        setDependencyInfo({
          subcategoryCount: Number(payload.data?.subcategoryCount ?? 0),
          typeCount: Number(payload.data?.typeCount ?? 0),
        });
      } catch {
        if (!disposed) {
          setDependencyInfo({ subcategoryCount: 0, typeCount: 0 });
        }
      }
    };

    loadDependencyInfo();

    return () => {
      disposed = true;
    };
  }, [editPopupContext]);

  useEffect(() => {
    let disposed = false;

    if (!editPopupContext || editPopupContext.level !== "category1") {
      return;
    }

    if (!editParentCategory3) {
      setEditParentCategory2Options([]);
      setEditParentCategory2("");
      return;
    }

    const loadParentSubcategoryOptions = async () => {
      try {
        const response = await fetch(
          `/api/catalog/staff/subcategories?category=${encodeURIComponent(editParentCategory3)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Failed to load parent subcategories.");
        }

        const payload = (await response.json()) as SubcategoryApiResponse;
        const nextOptions = fetchListKey(payload, "subcategories");

        if (disposed) {
          return;
        }

        setEditParentCategory2Options(nextOptions);
        setEditParentCategory2((current) =>
          nextOptions.includes(current)
            ? current
            : editPopupContext.parentCategory2 &&
                nextOptions.includes(editPopupContext.parentCategory2)
              ? editPopupContext.parentCategory2
              : "",
        );
      } catch {
        if (!disposed) {
          setEditParentCategory2Options([]);
          setEditParentCategory2("");
        }
      }
    };

    loadParentSubcategoryOptions();

    return () => {
      disposed = true;
    };
  }, [editPopupContext, editParentCategory3]);

  const handleSaveEdit = async () => {
    if (!editPopupContext) {
      return;
    }

    const trimmedName = editName.trim();
    const getSaveValidationError = (): string | null => {
      if (!trimmedName) {
        return "Category name is required.";
      }

      if (
        editPopupContext.level === "category2" &&
        !editParentCategory3.trim()
      ) {
        return "Parent Category is required.";
      }

      if (
        editPopupContext.level === "category1" &&
        (!editParentCategory3.trim() || !editParentCategory2.trim())
      ) {
        return "Parent Category and Parent Subcategory are required.";
      }

      return null;
    };

    const validationError = getSaveValidationError();
    if (validationError) {
      setEditPopupError(validationError);
      setEditPopupSuccess(null);
      return;
    }

    setEditSubmitting(true);
    setEditPopupError(null);
    setEditPopupSuccess(null);
    setShowDeleteConfirmation(false);
    setShowSaveConfirmation(false);

    try {
      const response = await fetch("/api/catalog/staff/categories", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: editPopupContext.level,
          currentName: editPopupContext.name,
          newName: trimmedName,
          currentParentCategory3: editPopupContext.parentCategory3,
          currentParentCategory2: editPopupContext.parentCategory2,
          newParentCategory3:
            editPopupContext.level !== "category3"
              ? editParentCategory3
              : undefined,
          newParentCategory2:
            editPopupContext.level === "category1"
              ? editParentCategory2
              : undefined,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        details?: string;
        data?: {
          name?: string;
          parentCategory3?: string;
          parentCategory2?: string;
        };
      };

      if (!response.ok || !payload.success) {
        const message =
          payload.error && payload.details
            ? `${payload.error} ${payload.details}`
            : payload.error || "Failed to update category.";
        throw new Error(message);
      }

      const nextName = payload.data?.name ?? trimmedName;
      const nextParentCategory3 =
        payload.data?.parentCategory3 ?? editParentCategory3;
      const nextParentCategory2 =
        payload.data?.parentCategory2 ?? editParentCategory2;

      if (editPopupContext.level === "category3") {
        setSelectedCategory(nextName);
        setSelectedSubcategory(null);
        setSelectedType(null);
      } else if (editPopupContext.level === "category2") {
        setSelectedCategory(nextParentCategory3);
        setSelectedSubcategory(nextName);
        setSelectedType(null);
      } else {
        setSelectedCategory(nextParentCategory3);
        setSelectedSubcategory(nextParentCategory2);
        setSelectedType(nextName);
      }

      setEditPopupContext({
        level: editPopupContext.level,
        name: nextName,
        parentCategory3:
          editPopupContext.level !== "category3"
            ? nextParentCategory3
            : undefined,
        parentCategory2:
          editPopupContext.level === "category1"
            ? nextParentCategory2
            : undefined,
      });

      setRefreshToken((current) => current + 1);
      closeEditPopup();
    } catch (error) {
      setEditPopupError(
        error instanceof Error ? error.message : "Failed to update category.",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editPopupContext) {
      return;
    }

    if (!showDeleteConfirmation) {
      setShowDeleteConfirmation(true);
      setEditPopupError(null);
      setEditPopupSuccess(null);
      return;
    }

    if (!deleteConfirmChecked) {
      setEditPopupError("You must confirm the deletion warning first.");
      setEditPopupSuccess(null);
      return;
    }

    setDeleteSubmitting(true);
    setEditPopupError(null);
    setEditPopupSuccess(null);
    setShowSaveConfirmation(false);

    try {
      const response = await fetch("/api/catalog/staff/categories", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          level: editPopupContext.level,
          name: editPopupContext.name,
          parentCategory3: editPopupContext.parentCategory3,
          parentCategory2: editPopupContext.parentCategory2,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
        details?: string;
      };

      if (!response.ok || !payload.success) {
        const message =
          payload.error && payload.details
            ? `${payload.error} ${payload.details}`
            : payload.error || "Failed to delete category.";
        throw new Error(message);
      }

      if (editPopupContext.level === "category3") {
        setSelectedCategory(null);
        setSelectedSubcategory(null);
        setSelectedType(null);
      } else if (editPopupContext.level === "category2") {
        setSelectedSubcategory(null);
        setSelectedType(null);
      } else {
        setSelectedType(null);
      }

      setRefreshToken((current) => current + 1);
      closeEditPopup();
    } catch (error) {
      setEditPopupError(
        error instanceof Error ? error.message : "Failed to delete category.",
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const getLevelLabel = (level: CategoryLevel) => {
    if (level === "category3") return "Category";
    if (level === "category2") return "Subcategory";
    return "Type";
  };

  const isNameDirty = editPopupContext
    ? editName.trim() !== editPopupContext.name
    : false;
  const isParentCategoryDirty = editPopupContext
    ? (editPopupContext.parentCategory3 ?? "") !== editParentCategory3
    : false;
  const isParentSubcategoryDirty = editPopupContext
    ? (editPopupContext.parentCategory2 ?? "") !== editParentCategory2
    : false;
  const isAnyEditDirty = editPopupContext
    ? isNameDirty ||
      (editPopupContext.level !== "category3" && isParentCategoryDirty) ||
      (editPopupContext.level === "category1" && isParentSubcategoryDirty)
    : false;
  const isViewerStaff = normalizeRole(viewerRole ?? "STAFF") === "STAFF";
  const editPopupBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(closeEditPopup);
  const saveConfirmationBackdropHandlers =
    useBackdropPointerClose<HTMLDivElement>(() =>
      setShowSaveConfirmation(false),
    );

  return (
    <div>
      <div className="staffTitle">Category Management</div>
      <div className="staffSubtitle">
        Manage top-level categories, subcategories, and item types from one
        place.
      </div>
      <div className="item-search-page__controls category-mgmt-search-controls">
        <div className="item-search-page__search">
          <form onSubmit={handleClassificationSearchSubmit}>
            <div className="item-search-page__search-bar category-mgmt-search-bar">
              <div className="item-search-page__search-input-wrap category-mgmt-search-input-wrap">
                <input
                  type="text"
                  placeholder="Search classification name, parent category, or parent subcategory"
                  className="item-search-page__search-input"
                  value={classificationSearchInput}
                  onChange={(event) =>
                    handleSearchInputChange(event.target.value)
                  }
                  onFocus={handleSearchInputFocus}
                  onBlur={handleSearchInputBlur}
                  onKeyDown={handleSearchInputKeyDown}
                  autoComplete="off"
                />
                {(classificationSearchInput || selectedSearchOptionKey) && (
                  <button
                    type="button"
                    className="item-search-page__search-clear"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={handleClearClassificationSearch}
                    aria-label="Clear classification search"
                  >
                    x
                  </button>
                )}

                {shouldShowSearchSuggestions ? (
                  <div
                    className="category-mgmt-search-suggestions"
                    role="listbox"
                    aria-label="Classification suggestions"
                  >
                    {classificationSuggestions.length === 0 ? (
                      <div className="category-mgmt-search-suggestion-empty">
                        No matching classifications
                      </div>
                    ) : (
                      classificationSuggestions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          className={`category-mgmt-search-suggestion-btn${
                            option.key === selectedSearchOptionKey
                              ? " category-mgmt-search-suggestion-btn--selected"
                              : ""
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applySearchOptionSelection(option)}
                        >
                          <span className="category-mgmt-search-suggestion-name">
                            {option.name}
                          </span>
                          <span className="category-mgmt-search-suggestion-meta">
                            {option.contextText}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>
              <button
                type="submit"
                className="item-search-page__search-submit"
                aria-label="Apply classification search"
                disabled={!selectedSearchOption}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="7" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>
          {searchMessage ? (
            <div className="staffCardHint category-mgmt-search-message">
              {searchMessage}
            </div>
          ) : null}
        </div>
      </div>
      {loadError && <div className="staffCardHint">{loadError}</div>}

      <div className="staffGrid">
        <div className="staffCard col4 category-mgmt-panel">
          <div className="category-mgmt-panel-header">
            <div className="staffCardLabel">Category (Level 3)</div>
            <button
              type="button"
              className={`category-mgmt-add-btn${isViewerStaff ? " category-mgmt-add-btn--disabled" : ""}`}
              onClick={() => openCreatePopup("category3")}
              aria-label="Create new category"
              disabled={isViewerStaff}
            >
              +
            </button>
          </div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categoriesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : categories.length ? (
                  pagedCategories.map((name) => (
                    <tr
                      key={name}
                      className={`category-mgmt-tr ${selectedCategory === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <div className="category-mgmt-action">
                          <Link
                            href={`/staff/category_management?level=category3&name=${encodeURIComponent(name)}`}
                            className="item-search-page__edit-link"
                            onClick={(event) => {
                              event.preventDefault();
                              if (selectedCategory === name) {
                                setSelectedCategory(null);
                                setSelectedSubcategory(null);
                                setSelectedType(null);
                                setEditPopupContext(null);
                                setSubcategoryPage(1);
                                setTypePage(1);
                                return;
                              }

                              setSelectedCategory(name);
                              setSelectedSubcategory(null);
                              setSelectedType(null);
                              setEditPopupContext(null);
                              setSubcategoryPage(1);
                              setTypePage(1);
                            }}
                          >
                            Select
                          </Link>
                          {selectedCategory === name ? (
                            <button
                              type="button"
                              className={`category-mgmt-selected-icon${isViewerStaff ? " category-mgmt-selected-icon--disabled" : ""}`}
                              aria-label={`Open edit popup for ${name}`}
                              onClick={() =>
                                openEditPopup({
                                  level: "category3",
                                  name,
                                })
                              }
                              disabled={isViewerStaff}
                            >
                              &#9998;
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No categories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={categoryPage}
            totalPages={categoryTotalPages}
            setPage={setCategoryPage}
          />
        </div>

        <div className="staffCard col4 category-mgmt-panel">
          <div className="category-mgmt-panel-header">
            <div className="staffCardLabel">Subcategory (Level 2)</div>
            <button
              type="button"
              className={`category-mgmt-add-btn${isViewerStaff ? " category-mgmt-add-btn--disabled" : ""}`}
              onClick={() => openCreatePopup("category2")}
              aria-label="Create new subcategory"
              disabled={isViewerStaff}
            >
              +
            </button>
          </div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedCategory ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Select a category to view subcategories.
                    </td>
                  </tr>
                ) : subcategoriesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : subcategories.length ? (
                  pagedSubcategories.map((name) => (
                    <tr
                      key={`${selectedCategory}::${name}`}
                      className={`category-mgmt-tr ${selectedSubcategory === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <div className="category-mgmt-action">
                          <Link
                            href={`/staff/category_management?level=category2&category3=${encodeURIComponent(selectedCategory)}&name=${encodeURIComponent(name)}`}
                            className="item-search-page__edit-link"
                            onClick={(event) => {
                              event.preventDefault();
                              if (selectedSubcategory === name) {
                                setSelectedSubcategory(null);
                                setSelectedType(null);
                                setEditPopupContext(null);
                                setTypePage(1);
                                return;
                              }

                              setSelectedSubcategory(name);
                              setSelectedType(null);
                              setEditPopupContext(null);
                              setTypePage(1);
                            }}
                          >
                            Select
                          </Link>
                          {selectedSubcategory === name ? (
                            <button
                              type="button"
                              className={`category-mgmt-selected-icon${isViewerStaff ? " category-mgmt-selected-icon--disabled" : ""}`}
                              aria-label={`Open edit popup for ${name}`}
                              onClick={() =>
                                openEditPopup({
                                  level: "category2",
                                  name,
                                  parentCategory3:
                                    selectedCategory ?? undefined,
                                })
                              }
                              disabled={isViewerStaff}
                            >
                              &#9998;
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No subcategories found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={subcategoryPage}
            totalPages={subcategoryTotalPages}
            setPage={setSubcategoryPage}
          />
        </div>

        <div className="staffCard col4 category-mgmt-panel">
          <div className="category-mgmt-panel-header">
            <div className="staffCardLabel">Type (Level 1)</div>
            <button
              type="button"
              className={`category-mgmt-add-btn${isViewerStaff ? " category-mgmt-add-btn--disabled" : ""}`}
              onClick={() => openCreatePopup("category1")}
              aria-label="Create new type"
              disabled={isViewerStaff}
            >
              +
            </button>
          </div>
          <div className="category-mgmt-table-wrap">
            <table className="category-mgmt-table">
              <thead className="category-mgmt-thead">
                <tr>
                  <th className="category-mgmt-th">Name</th>
                  <th className="category-mgmt-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedCategory || !selectedSubcategory ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Select a subcategory to view types.
                    </td>
                  </tr>
                ) : typesLoading ? (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      Loading...
                    </td>
                  </tr>
                ) : types.length ? (
                  pagedTypes.map((name) => (
                    <tr
                      key={`${selectedCategory}::${selectedSubcategory}::${name}`}
                      className={`category-mgmt-tr ${selectedType === name ? "category-mgmt-tr--selected" : ""}`}
                    >
                      <td className="category-mgmt-td">{name}</td>
                      <td className="category-mgmt-td">
                        <div className="category-mgmt-action">
                          <Link
                            href={`/staff/category_management?level=category1&category3=${encodeURIComponent(selectedCategory)}&category2=${encodeURIComponent(selectedSubcategory)}&name=${encodeURIComponent(name)}`}
                            className="item-search-page__edit-link"
                            onClick={(event) => {
                              event.preventDefault();
                              if (selectedType === name) {
                                setSelectedType(null);
                                setEditPopupContext(null);
                                return;
                              }

                              setSelectedType(name);
                              setEditPopupContext(null);
                            }}
                          >
                            Select
                          </Link>
                          {selectedType === name ? (
                            <button
                              type="button"
                              className={`category-mgmt-selected-icon${isViewerStaff ? " category-mgmt-selected-icon--disabled" : ""}`}
                              aria-label={`Open edit popup for ${name}`}
                              onClick={() =>
                                openEditPopup({
                                  level: "category1",
                                  name,
                                  parentCategory3:
                                    selectedCategory ?? undefined,
                                  parentCategory2:
                                    selectedSubcategory ?? undefined,
                                })
                              }
                              disabled={isViewerStaff}
                            >
                              &#9998;
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="category-mgmt-tr">
                    <td className="category-mgmt-td" colSpan={2}>
                      No types found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={typePage}
            totalPages={typeTotalPages}
            setPage={setTypePage}
          />
        </div>
      </div>
      <CategoryCreateModal
        isOpen={showCreatePopup}
        level={createCategoryLevel}
        categories={categories}
        defaultParentCategory3={
          createCategoryLevel === "category3" ? "" : (selectedCategory ?? "")
        }
        defaultParentCategory2={
          createCategoryLevel === "category1" ? (selectedSubcategory ?? "") : ""
        }
        closeOnBackdrop
        closeOnSuccess
        onClose={closeCreatePopup}
        onCreated={handleCategoryCreated}
      />
      {editPopupContext ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Category"
          className="item-category-modal"
          onPointerDown={editPopupBackdropHandlers.onPointerDown}
          onClick={editPopupBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-edit-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">
              Edit {getLevelLabel(editPopupContext.level)}
            </div>
            <form
              className="item-category-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!editName.trim()) {
                  setEditPopupError("Category name is required.");
                  setEditPopupSuccess(null);
                  setShowSaveConfirmation(false);
                  return;
                }
                if (
                  editPopupContext.level === "category2" &&
                  !editParentCategory3.trim()
                ) {
                  setEditPopupError("Parent Category is required.");
                  setEditPopupSuccess(null);
                  setShowSaveConfirmation(false);
                  return;
                }
                if (
                  editPopupContext.level === "category1" &&
                  (!editParentCategory3.trim() || !editParentCategory2.trim())
                ) {
                  setEditPopupError(
                    "Parent Category and Parent Subcategory are required.",
                  );
                  setEditPopupSuccess(null);
                  setShowSaveConfirmation(false);
                  return;
                }
                if (!isAnyEditDirty) {
                  setShowSaveConfirmation(false);
                  return;
                }
                setEditPopupError(null);
                setEditPopupSuccess(null);
                setShowSaveConfirmation(true);
              }}
              noValidate
            >
              <label className="item-category-form__field">
                <span
                  className={`item-category-form__label ${isNameDirty ? "category-mgmt-edit-modal__label--dirty" : ""}`}
                >
                  Name
                </span>
                <input
                  className="item-search-page__search-input"
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  placeholder="Enter a unique name"
                />
              </label>

              {editPopupContext.level !== "category3" ? (
                <label className="item-category-form__field">
                  <span
                    className={`item-category-form__label ${isParentCategoryDirty ? "category-mgmt-edit-modal__label--dirty" : ""}`}
                  >
                    Parent Category
                  </span>
                  <select
                    className="item-search-page__select"
                    value={editParentCategory3}
                    onChange={(event) =>
                      setEditParentCategory3(event.target.value)
                    }
                  >
                    <option value="">None</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {editPopupContext.level === "category1" ? (
                <label className="item-category-form__field">
                  <span
                    className={`item-category-form__label ${isParentSubcategoryDirty ? "category-mgmt-edit-modal__label--dirty" : ""}`}
                  >
                    Parent Subcategory
                  </span>
                  <select
                    className="item-search-page__select"
                    value={editParentCategory2}
                    onChange={(event) =>
                      setEditParentCategory2(event.target.value)
                    }
                    disabled={!editParentCategory3.trim()}
                  >
                    <option value="">None</option>
                    {editParentCategory2Options.map((subcategory) => (
                      <option key={subcategory} value={subcategory}>
                        {subcategory}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {showDeleteConfirmation ? (
                <>
                  <div className="category-mgmt-delete-warning">
                    {editPopupContext.level === "category3" ? (
                      <p>
                        Warning: Deleting this category also deletes{" "}
                        <strong>{dependencyInfo.subcategoryCount}</strong>{" "}
                        subcategories and{" "}
                        <strong>{dependencyInfo.typeCount}</strong> types under
                        it.
                      </p>
                    ) : editPopupContext.level === "category2" ? (
                      <p>
                        Warning: Deleting this subcategory also deletes{" "}
                        <strong>{dependencyInfo.typeCount}</strong> types under
                        it.
                      </p>
                    ) : (
                      <p>
                        Warning: Deleting this type is permanent and cannot be
                        undone.
                      </p>
                    )}
                  </div>

                  <label className="category-mgmt-delete-confirm">
                    <input
                      type="checkbox"
                      checked={deleteConfirmChecked}
                      onChange={(event) =>
                        setDeleteConfirmChecked(event.target.checked)
                      }
                    />
                    I understand this deletion impact.
                  </label>
                </>
              ) : null}

              {editPopupError ? (
                <div className="item-category-form__status item-category-form__status--error">
                  {editPopupError}
                </div>
              ) : null}
              {editPopupSuccess ? (
                <div className="item-category-form__status item-category-form__status--success">
                  {editPopupSuccess}
                </div>
              ) : null}

              <div className="item-category-form__actions category-mgmt-edit-modal__actions">
                <button
                  type="button"
                  onClick={closeEditPopup}
                  className="staff-dev-pill"
                  disabled={editSubmitting || deleteSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="staff-dev-pill staff-dev-pill--danger"
                  disabled={editSubmitting || deleteSubmitting}
                >
                  {deleteSubmitting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="submit"
                  className={`staff-dev-pill${isAnyEditDirty ? " staff-dev-pill--ready" : ""}`}
                  disabled={
                    editSubmitting || deleteSubmitting || !isAnyEditDirty
                  }
                >
                  {editSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {editPopupContext && showSaveConfirmation ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Save Changes"
          className="item-category-modal"
          onPointerDown={saveConfirmationBackdropHandlers.onPointerDown}
          onClick={saveConfirmationBackdropHandlers.onClick}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Changes</div>
            <p className="category-mgmt-confirm-modal__message">
              Are you sure you want to save these changes?
            </p>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => setShowSaveConfirmation(false)}
                disabled={editSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={() => void handleSaveEdit()}
                disabled={editSubmitting}
              >
                {editSubmitting ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
