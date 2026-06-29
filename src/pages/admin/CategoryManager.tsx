import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useToast } from "../../hooks/useToast";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/categoryService";
import type { Category } from "../../types";

const toSlug = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

interface FlatCategory extends Category {
  depth: number;
}

const flattenTree = (categories: Category[], depth = 0): FlatCategory[] => {
  const result: FlatCategory[] = [];
  for (const cat of categories) {
    result.push({ ...cat, depth });
    if (cat.children) result.push(...flattenTree(cat.children, depth + 1));
  }
  return result;
};

interface CategoryFormData {
  name: string;
  slug?: string;
  parentId?: string;
  description?: string;
}

interface CategoryFormProps {
  initial: CategoryFormData;
  parents: FlatCategory[];
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  loading: boolean;
}

const INIT_FORM: CategoryFormData = { name: "", slug: "", parentId: "", description: "" };

const CategoryForm = ({ initial, parents, onSubmit, onCancel, loading }: CategoryFormProps) => {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug || "");
  const [parentId, setParentId] = useState(initial.parentId ?? "");
  const [description, setDescription] = useState(initial.description ?? "");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initial.slug || toSlug(initial.name) === initial.slug) {
      setSlug(toSlug(val));
    }
  };

  const canSubmit = name.trim().length > 0 && !loading;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      slug: slug.trim() || undefined,
      parentId: parentId || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border border-blue-200 bg-blue-50 rounded-lg p-3 mb-2">
      <input
        type="text"
        placeholder="Category name"
        value={name}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
        maxLength={160}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        required
      />
      <input
        type="text"
        placeholder="Slug (auto-generated)"
        value={slug}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
        maxLength={180}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
      />
      {parents.length > 0 && (
        <select
          value={parentId}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setParentId(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="">No parent (root)</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {"  ".repeat(p.depth)}{p.name}
            </option>
          ))}
        </select>
      )}
      <textarea
        rows={2}
        placeholder="Description (optional)"
        value={description}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving\u2026" : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

interface CategoryNodeProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddChild: (parent: Category) => void;
  flatParents: FlatCategory[];
}

const CategoryNode = ({ category, onEdit, onDelete, onAddChild, flatParents }: CategoryNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className="mb-1">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
          category.isActive === false
            ? "border-gray-200 bg-gray-50 opacity-60"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-gray-400 w-4 text-center"
        >
          {hasChildren ? (expanded ? "\u25BC" : "\u25B6") : ""}
        </button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-gray-800">{category.name}</span>
          <span className="text-xs text-gray-400 ml-2">/{category.slug}</span>
          {category.isActive === false && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-medium">
              Inactive
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onAddChild(category)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            +Child
          </button>
          <button
            onClick={() => onEdit(category)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-300 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div className="ml-4 mt-1">
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              flatParents={flatParents}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryManager = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [formInitial, setFormInitial] = useState<CategoryFormData>(INIT_FORM);
  const [formParentId, setFormParentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const flatParents = useMemo(() => flattenTree(categories), [categories]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await getCategories();
      setCategories(resp.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreate = (parent: Category | null = null) => {
    setFormMode("create");
    setFormParentId(parent?.id ?? null);
    setFormInitial({ ...INIT_FORM, parentId: parent?.id ?? "" });
  };

  const openEdit = (category: Category) => {
    setFormMode("edit");
    setFormParentId(category.parentId ?? null);
    setFormInitial({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? "",
      description: (category as unknown as Record<string, string>).description ?? "",
    });
  };

  const handleCreate = async (data: CategoryFormData) => {
    setSaving(true);
    try {
      await createCategory(data);
      toast.success("Category created.");
      setFormMode(null);
      fetchCategories();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to create category."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: CategoryFormData) => {
    if (!formInitial.id) return;
    setSaving(true);
    try {
      await updateCategory(formInitial.id, data);
      toast.success("Category updated.");
      setFormMode(null);
      fetchCategories();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to update category."),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Deactivate "${category.name}" and all its children?`)) return;
    try {
      await deleteCategory(category.id);
      toast.success("Category deactivated.");
      fetchCategories();
    } catch (err) {
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to deactivate category."),
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 text-sm mb-3">{error}</p>
        <button onClick={fetchCategories} className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Category Manager</h1>
        <button
          onClick={() => openCreate()}
          className="text-sm px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          + Add Root Category
        </button>
      </div>

      {formMode === "create" && !formParentId && (
        <CategoryForm
          initial={INIT_FORM}
          parents={flatParents}
          onSubmit={handleCreate}
          onCancel={() => setFormMode(null)}
          loading={saving}
        />
      )}

      <div className="space-y-1">
        {categories.map((cat) => (
          <div key={cat.id}>
            {formMode === "create" && formParentId === cat.parentId && (
              <CategoryForm
                initial={INIT_FORM}
                parents={flatParents}
                onSubmit={handleCreate}
                onCancel={() => setFormMode(null)}
                loading={saving}
              />
            )}
            <CategoryNode
              category={cat}
              onEdit={openEdit}
              onDelete={handleDelete}
              onAddChild={(parent) => openCreate(parent)}
              flatParents={flatParents}
            />
            {formMode === "edit" && formInitial.id === cat.id && (
              <div className="ml-4">
                <CategoryForm
                  initial={formInitial}
                  parents={flatParents}
                  onSubmit={handleUpdate}
                  onCancel={() => setFormMode(null)}
                  loading={saving}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
