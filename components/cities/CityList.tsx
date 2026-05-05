"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Edit2,
  Trash2,
  Plus,
  Loader2,
  X,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { addCity, updateCity, deleteCity } from "@/lib/actions/lead.actions";

interface City {
  id: string;
  name: string;
}

export default function CityList({ initialCities }: { initialCities: City[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [cityToDelete, setCityToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredCities = initialCities.filter((city) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase().trim()),
  );
  const totalPages = Math.ceil(filteredCities.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCities = filteredCities.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newCityName.trim()) return;
    try {
      setLoadingId("add");
      await addCity(newCityName);
      setNewCityName("");
      setIsAdding(false);
    } catch (error: any) {
      alert(error.message || "Failed to add city");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    try {
      setLoadingId(id);
      await updateCity(id, editName);
      setEditingId(null);
    } catch (error: any) {
      alert(error.message || "Failed to update city");
    } finally {
      setLoadingId(null);
    }
  }

  async function confirmDelete() {
    if (!cityToDelete) return;
    try {
      setLoadingId(cityToDelete.id);
      setDeleteError(null);
      await deleteCity(cityToDelete.id);
      setCityToDelete(null);

      if (currentCities.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete city");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      <div className="saas-card bg-white flex flex-col h-full border-t-4 border-t-[#3da9d4] relative z-0">
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3 bg-slate-50/50 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-primary pl-9 py-2 text-sm w-64 bg-white shadow-sm"
            />
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="btn-brand flex items-center justify-center gap-2 py-2 px-4 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" /> Add City
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
          {isAdding && (
            <form
              onSubmit={handleAdd}
              className="p-4 border-b border-slate-100 bg-[#3da9d4]/5 flex items-center gap-3 animate-in fade-in slide-in-from-top-2"
            >
              <MapPin className="w-5 h-5 text-[#3da9d4] shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Enter new city name..."
                value={newCityName}
                onChange={(e) => setNewCityName(e.target.value)}
                className="input-primary py-1.5 flex-1"
              />
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  disabled={loadingId === "add"}
                  className="p-2 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-md transition-colors"
                >
                  {loadingId === "add" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {filteredCities.length === 0 && !isAdding ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <MapPin className="w-12 h-12 mb-3 text-slate-200" />
              <p>No cities found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100">
                {currentCities.map((city) => (
                  <tr
                    key={city.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 w-full">
                      {editingId === city.id ? (
                        <div className="flex items-center gap-3 animate-in fade-in">
                          <MapPin className="w-4 h-4 text-[#3da9d4]" />
                          <input
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="input-primary py-1 max-w-[250px]"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 font-medium text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-[#3da9d4] transition-colors" />
                          {city.name}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId === city.id ? (
                          <>
                            <button
                              onClick={() => handleUpdate(city.id)}
                              disabled={loadingId === city.id}
                              className="p-1.5 text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-md"
                            >
                              {loadingId === city.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(city.id);
                                setEditName(city.name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-[#3da9d4] hover:bg-[#3da9d4]/10 rounded-md transition-colors"
                              title="Edit City"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                setCityToDelete({
                                  id: city.id,
                                  name: city.name,
                                })
                              }
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete City"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-sm text-slate-500 font-medium">
            Showing{" "}
            <strong className="text-slate-700">
              {filteredCities.length === 0 ? 0 : startIndex + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-slate-700">
              {Math.min(startIndex + itemsPerPage, filteredCities.length)}
            </strong>{" "}
            of{" "}
            <strong className="text-slate-700">{filteredCities.length}</strong>{" "}
            cities
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <div className="px-4 py-1.5 text-sm font-bold text-[#3da9d4] bg-[#3da9d4]/10 border border-[#3da9d4]/20 rounded-lg shadow-sm">
              {currentPage} / {Math.max(1, totalPages)}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || totalPages === 0}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CUSTOM DELETE MODAL OVERLAY */}
      {cityToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Delete City
              </h3>
              <p className="text-slate-500 text-sm">
                Are you sure you want to delete{" "}
                <strong>"{cityToDelete.name}"</strong>? This will completely
                remove it from the system.
              </p>

              {deleteError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCityToDelete(null);
                  setDeleteError(null);
                }}
                disabled={loadingId === cityToDelete.id}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={loadingId === cityToDelete.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {loadingId === cityToDelete.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Yes, Delete City"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
