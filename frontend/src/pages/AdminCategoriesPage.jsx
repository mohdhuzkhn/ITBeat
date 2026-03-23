import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../services/api";

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => adminService.getCategories().then((r) => r.data),
  });

  const addCategory = useMutation({
    mutationFn: () => adminService.addCategory({ name, slug }),
    onSuccess: () => {
      setName("");
      setSlug("");
      setError("");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (err) =>
      setError(err.response?.data?.error || "Failed to add category."),
  });

  const deleteCategory = useMutation({
    mutationFn: adminService.deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    addCategory.mutate();
  }

  function autoSlug(value) {
    setName(value);
    setSlug(
      value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, ""),
    );
  }

  const categories = data?.categories || [];

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Manage Categories
      </h1>

      {/* Add new category form */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Add New Category
        </h2>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              value={name}
              onChange={(e) => autoSlug(e.target.value)}
              className="input"
              placeholder="e.g. Cybersecurity"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (auto-generated)
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="input"
              placeholder="e.g. cybersecurity"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Used in URLs — lowercase, hyphens only
            </p>
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={addCategory.isPending}
          >
            {addCategory.isPending ? "Adding..." : "+ Add Category"}
          </button>
        </form>
      </div>

      {/* Existing categories */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Existing Categories ({categories.length})
        </h2>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        )}
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                <p className="text-xs text-gray-400">/category/{cat.slug}</p>
              </div>
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete "${cat.name}"? Posts in this category will be affected.`,
                    )
                  ) {
                    deleteCategory.mutate(cat.id);
                  }
                }}
                className="text-xs text-red-500 hover:bg-red-50 px-3 py-1 rounded-lg transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
