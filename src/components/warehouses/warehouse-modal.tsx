"use client";

import { useState } from "react";
import { Building2, Edit2, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteWarehouseAction, setDefaultWarehouse, upsertWarehouse } from "@/app/ecommerce-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Warehouse } from "@/types";

export function WarehouseModal({ warehouse }: { warehouse?: Warehouse }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isEditing = !!warehouse;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const res = await upsertWarehouse(form, warehouse?.id);
    setLoading(false);

    if (res.ok) {
      toast.success(isEditing ? "Warehouse updated!" : "Warehouse added successfully!");
      setOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleSetDefault() {
    if (!warehouse) return;
    setLoading(true);
    const res = await setDefaultWarehouse(warehouse.id);
    setLoading(false);

    if (res.ok) {
      toast.success(`${warehouse.warehouseName} is now default.`);
      setOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  async function handleDelete() {
    if (!warehouse) return;
    setLoading(true);
    const res = await deleteWarehouseAction(warehouse.id);
    setLoading(false);

    if (res.ok) {
      toast.success("Warehouse deleted successfully!");
      setOpen(false);
      setConfirmDelete(false);
    } else {
      toast.error(res.message || "Could not delete warehouse.");
    }
  }

  return (
    <>
      {isEditing ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
        >
          <Edit2 size={13} /> Edit
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} /> Add New Warehouse
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <Building2 size={18} />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {isEditing ? "Edit Warehouse Hub" : "Add Pickup Location"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirmDelete(false);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <Label htmlFor="warehouseName">Warehouse Hub Name *</Label>
                <Input
                  id="warehouseName"
                  name="warehouseName"
                  required
                  defaultValue={warehouse?.warehouseName}
                  placeholder="e.g. Okhla Central Fulfillment Center"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    required
                    defaultValue={warehouse?.contactPerson}
                    placeholder="e.g. Rajesh Sharma"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Mobile Number (10 digits) *</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    required
                    maxLength={10}
                    defaultValue={warehouse?.contactPhone}
                    placeholder="e.g. 9811223344"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="addressLine1">Complete Address / Street *</Label>
                <Input
                  id="addressLine1"
                  name="addressLine1"
                  required
                  defaultValue={warehouse?.addressLine1}
                  placeholder="Building, Plot No, Industrial Area"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    required
                    defaultValue={warehouse?.city}
                    placeholder="e.g. New Delhi"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    required
                    defaultValue={warehouse?.state}
                    placeholder="e.g. Delhi"
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">PIN Code *</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    required
                    maxLength={6}
                    defaultValue={warehouse?.pincode}
                    placeholder="e.g. 110020"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gstin">GSTIN (Optional)</Label>
                <Input
                  id="gstin"
                  name="gstin"
                  defaultValue={warehouse?.gstin || ""}
                  placeholder="e.g. 07AAACB1234F1Z5"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  name="isDefault"
                  defaultChecked={warehouse?.isDefault}
                  className="size-4 rounded text-indigo-600"
                />
                <label htmlFor="isDefault" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Set as default origin warehouse for new orders
                </label>
              </div>

              {/* Delete Confirmation Box */}
              {confirmDelete && (
                <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 space-y-2 mt-3">
                  <p className="text-xs font-bold text-red-900">
                    Are you sure you want to delete this warehouse hub?
                  </p>
                  <p className="text-[11px] text-red-700">
                    This location will no longer be available for dispatching new orders.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleDelete}
                      className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer"
                    >
                      Yes, Delete Hub
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  {isEditing && !warehouse?.isDefault && (
                    <button
                      type="button"
                      onClick={handleSetDefault}
                      className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Make Default
                    </button>
                  )}

                  {isEditing && !confirmDelete && (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Warehouse</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setConfirmDelete(false);
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs"
                  >
                    {loading && <Loader2 className="size-3.5 animate-spin mr-1" />}
                    {isEditing ? "Save Changes" : "Create Warehouse"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
