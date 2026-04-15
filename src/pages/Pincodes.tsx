import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    MapPin, Plus, Search, Pencil, Trash2, Loader2,
    RefreshCw, Download, Upload, X,
    CheckCircle2, AlertCircle, Info,
} from "lucide-react";

interface Pincode {
    _id: string;
    pincode: string;
    deliveryNote?: string;
    isActive: boolean;
    createdAt: string;
}

const emptyForm = { pincode: "", deliveryNote: "", isActive: true };

type FilterStatus = "all" | "active" | "inactive";

const Pincodes = () => {
    const [pincodes, setPincodes] = useState<Pincode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [bulkLoading, setBulkLoading] = useState(false);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchPincodes = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const res = await adminApi.getAllPincodes({ limit: 500 });
            setPincodes(res?.data || []);
        } catch {
            // axiosConfig interceptor already shows the error toast
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchPincodes(); }, [fetchPincodes]);

    // ── Filtered ───────────────────────────────────────────────────────────────
    const filtered = pincodes.filter((p) => {
        const matchesSearch = !search || p.pincode.includes(search) ||
            (p.deliveryNote || "").toLowerCase().includes(search.toLowerCase());
        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "active" && p.isActive) ||
            (filterStatus === "inactive" && !p.isActive);
        return matchesSearch && matchesStatus;
    });

    const activePincodes = pincodes.filter((p) => p.isActive).length;

    // ── Modals ────────────────────────────────────────────────────────────────
    const openCreate = () => { setEditId(null); setForm({ ...emptyForm }); setShowModal(true); };
    const openEdit = (p: Pincode) => {
        setEditId(p._id);
        setForm({ pincode: p.pincode, deliveryNote: p.deliveryNote || "", isActive: p.isActive });
        setShowModal(true);
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.pincode) { toast.error("Pincode is required"); return; }
        if (!/^\d{6}$/.test(form.pincode)) { toast.error("Pincode must be exactly 6 digits"); return; }
        setSaving(true);
        try {
            if (editId) {
                await adminApi.updatePincode(editId, form);
                toast.success("Pincode updated");
            } else {
                await adminApi.createPincode(form);
                toast.success("Pincode added");
            }
            setShowModal(false);
            fetchPincodes(true);
        } catch {
            // axiosConfig interceptor already shows the error toast
        } finally {
            setSaving(false);
        }
    };

    // ── Toggle ────────────────────────────────────────────────────────────────
    const handleToggle = async (id: string) => {
        // Optimistic UI update
        setPincodes((prev) => prev.map((p) => p._id === id ? { ...p, isActive: !p.isActive } : p));
        try {
            const res = await adminApi.togglePincode(id);
            toast.success(res?.message || "Status updated");
        } catch {
            // Rollback — axiosConfig interceptor already shows the error toast
            setPincodes((prev) => prev.map((p) => p._id === id ? { ...p, isActive: !p.isActive } : p));
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await adminApi.deletePincode(deleteId);
            toast.success("Pincode deleted");
            setPincodes((prev) => prev.filter((p) => p._id !== deleteId));
            setDeleteId(null);
        } catch {
            // axiosConfig interceptor already shows the error toast
        }
    };

    // ── Bulk Import ───────────────────────────────────────────────────────────
    const handleBulkImport = async () => {
        const lines = bulkText.split("\n").map((l) => l.trim())
            .filter((l) => l && !l.startsWith("#"));
        if (lines.length === 0) { toast.error("No valid lines found"); return; }

        const items = lines.map((line) => {
            const parts = line.split(",").map((p) => p.trim());
            return { pincode: parts[0] || "", deliveryNote: parts[1] || "", isActive: true };
        });

        const invalid = items.filter((i) => !/^\d{6}$/.test(i.pincode));
        if (invalid.length > 0) {
            toast.error(`${invalid.length} invalid rows. Format: pincode[,delivery_note]`);
            return;
        }

        setBulkLoading(true);
        let success = 0, failed = 0;
        for (const item of items) {
            try { await adminApi.createPincode(item); success++; }
            catch { failed++; }
        }
        setBulkLoading(false);
        toast.success(`Imported ${success} pincodes${failed > 0 ? ` (${failed} duplicate/failed)` : ""}`);
        setShowBulkModal(false);
        setBulkText("");
        fetchPincodes(true);
    };

    // ── Export CSV ────────────────────────────────────────────────────────────
    const handleExport = () => {
        const rows = [["Pincode", "Status", "Delivery Note"]];
        filtered.forEach((p) => rows.push([p.pincode, p.isActive ? "Active" : "Inactive", p.deliveryNote || ""]));
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pincodes_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${filtered.length} pincodes`);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Delivery Pincodes</h1>
                        <p className="text-sm text-gray-400 font-normal">
                            Customers can only order to active pincodes
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => fetchPincodes(true)} disabled={refreshing}
                        className="h-9 rounded-xl border-gray-200 text-gray-600 gap-1.5 text-xs">
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}
                        className="h-9 rounded-xl border-gray-200 text-gray-600 gap-1.5 text-xs">
                        <Download className="w-3.5 h-3.5" />Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowBulkModal(true)}
                        className="h-9 rounded-xl border-gray-200 text-gray-600 gap-1.5 text-xs">
                        <Upload className="w-3.5 h-3.5" />Bulk Import
                    </Button>
                    <Button onClick={openCreate}
                        className="h-9 px-4 rounded-xl bg-gradient-to-r from-primary to-green-600 text-white font-semibold text-xs shadow-lg shadow-primary/30 gap-2">
                        <Plus className="w-3.5 h-3.5" />Add Pincode
                    </Button>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Total", value: pincodes.length, icon: MapPin, color: "text-primary", bg: "from-primary/8 to-green-50" },
                    { label: "Active", value: activePincodes, icon: CheckCircle2, color: "text-green-600", bg: "from-green-50 to-emerald-50" },
                    { label: "Inactive", value: pincodes.length - activePincodes, icon: AlertCircle, color: "text-orange-400", bg: "from-orange-50 to-amber-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <Card key={label} className={`p-5 border-none shadow-sm rounded-3xl bg-gradient-to-br ${bg} ring-1 ring-gray-100`}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                            <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                        <p className={`text-3xl font-black ${color}`}>{loading ? "—" : value}</p>
                    </Card>
                ))}
            </div>

            {/* ── Filters ── */}
            <Card className="p-4 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search pincode or delivery note..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 pl-10 pr-8 rounded-2xl border-gray-100 bg-gray-50/50 text-sm"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-700" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                        {(["all", "active", "inactive"] as FilterStatus[]).map((s) => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filterStatus === s ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                                {s === "all" ? "All" : s === "active" ? "✓ Active" : "✗ Inactive"}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* ── Table ── */}
            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/40">
                                {["#", "Pincode", "Delivery Note", "Status", "Added On", "Actions"].map((h) => (
                                    <th key={h} className="px-5 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/80">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-16 text-gray-400">
                                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-3 text-primary/40" />
                                    <p className="text-sm font-medium">Loading pincodes...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-20">
                                    <div className="w-14 h-14 rounded-3xl bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="w-7 h-7 text-gray-300" />
                                    </div>
                                    <p className="text-base font-bold text-gray-400">No pincodes found</p>
                                    <p className="text-sm text-gray-300 mt-1">
                                        {pincodes.length === 0 ? "Add your first deliverable pincode" : "Try adjusting filters"}
                                    </p>
                                    {pincodes.length === 0 && (
                                        <Button onClick={openCreate}
                                            className="mt-5 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white text-xs px-6">
                                            <Plus className="w-3.5 h-3.5 mr-2" />Add First Pincode
                                        </Button>
                                    )}
                                </td></tr>
                            ) : filtered.map((p, idx) => (
                                <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-4 text-xs text-gray-300 font-mono">{idx + 1}</td>
                                    <td className="px-5 py-4">
                                        <span className="font-mono font-black text-gray-900 text-base tracking-[0.2em]">
                                            {p.pincode}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 max-w-[260px]">
                                        {p.deliveryNote ? (
                                            <div className="flex items-start gap-1.5">
                                                <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-gray-600 leading-snug">{p.deliveryNote}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-200 text-sm">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <Badge className={`text-[11px] font-bold px-2.5 py-0.5 rounded-xl border ${p.isActive ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-400 border-gray-100"}`}>
                                            {p.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEdit(p)}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-blue-50 transition-colors">
                                                <Pencil className="w-3.5 h-3.5 text-blue-500" />
                                            </button>
                                            <button onClick={() => setDeleteId(p._id)}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                            {filtered.length} pincode{filtered.length !== 1 ? "s" : ""}
                            {(search || filterStatus !== "all") ? ` (of ${pincodes.length} total)` : ""}
                        </span>
                        <span className="text-xs text-gray-300">{activePincodes} active · {pincodes.length - activePincodes} inactive</span>
                    </div>
                )}
            </Card>

            {/* ── Add / Edit Modal ── */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-sm rounded-[28px] p-0 border-none shadow-2xl overflow-hidden">
                    <div className={`px-8 pt-8 pb-5 ${editId ? "bg-blue-50" : "bg-gradient-to-br from-primary/5 to-green-50"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${editId ? "bg-blue-500" : "bg-gradient-to-br from-primary to-green-600"}`}>
                                {editId ? <Pencil className="w-4 h-4 text-white" /> : <Plus className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-gray-900">
                                    {editId ? "Edit Pincode" : "Add Pincode"}
                                </DialogTitle>
                                <p className="text-xs text-gray-500 font-normal mt-0.5">
                                    {editId ? "Update pincode details" : "Add a new deliverable pincode"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-7 pt-5 bg-white space-y-4">
                        {/* Pincode */}
                        <div>
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                                Pincode <span className="text-red-400">*</span>
                            </Label>
                            <Input
                                value={form.pincode}
                                onChange={(e) => setForm((prev) => ({
                                    ...prev,
                                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                                }))}
                                placeholder="e.g. 400001"
                                maxLength={6}
                                disabled={!!editId}
                                className="h-12 rounded-2xl border-gray-100 bg-gray-50/60 font-mono text-xl tracking-[0.4em] text-center focus:bg-white disabled:opacity-60"
                            />
                            {form.pincode && form.pincode.length < 6 && (
                                <p className="text-[10px] text-orange-400 mt-1 font-medium text-center">
                                    {6 - form.pincode.length} digit{6 - form.pincode.length !== 1 ? "s" : ""} remaining
                                </p>
                            )}
                            {form.pincode.length === 6 && (
                                <p className="text-[10px] text-green-500 mt-1 font-medium text-center">✓ Valid pincode</p>
                            )}
                        </div>

                        {/* Delivery Note */}
                        <div>
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                                Delivery Note <span className="text-gray-300 font-normal normal-case">(Shown to customers)</span>
                            </Label>
                            <Input
                                value={form.deliveryNote}
                                onChange={(e) => setForm((prev) => ({ ...prev, deliveryNote: e.target.value }))}
                                placeholder="e.g. Next-day delivery available, Same-day by 6 PM"
                                className="h-11 rounded-2xl border-gray-100 bg-gray-50/60 focus:bg-white"
                            />
                            <p className="text-[10px] text-gray-300 mt-1 font-medium">
                                Optional. Shown below the pincode in customer checkout.
                            </p>
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50/60 rounded-2xl border border-gray-100">
                            <div>
                                <p className="text-sm font-bold text-gray-800">Serviceable</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {form.isActive ? "Customers can order to this pincode" : "Orders paused for this pincode"}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                                style={{
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: 48,
                                    height: 26,
                                    borderRadius: 13,
                                    padding: 2,
                                    backgroundColor: form.isActive ? '#22c55e' : '#d1d5db',
                                    transition: 'background-color 0.2s',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'block',
                                        width: 22,
                                        height: 22,
                                        borderRadius: '50%',
                                        backgroundColor: '#fff',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                        transform: form.isActive ? 'translateX(22px)' : 'translateX(0)',
                                        transition: 'transform 0.2s',
                                    }}
                                />
                            </button>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <Button variant="outline" onClick={() => setShowModal(false)}
                                className="flex-1 h-11 rounded-2xl border-gray-100 text-gray-600 font-semibold">
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={saving}
                                className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-bold shadow-lg shadow-primary/25">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? "Save Changes" : "Add Pincode"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirm ── */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="max-w-sm rounded-[28px] p-8 border-none shadow-2xl">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-3xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4">
                            <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <DialogTitle className="text-xl font-black text-gray-900 mb-2">Delete Pincode?</DialogTitle>
                        <p className="text-sm text-gray-400 font-normal">
                            Customers won't be able to order to{" "}
                            <span className="font-mono font-bold text-gray-700">
                                {pincodes.find(p => p._id === deleteId)?.pincode}
                            </span>{" "}after this.
                        </p>
                    </div>
                    <DialogFooter className="flex gap-3 mt-6">
                        <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1 h-11 rounded-2xl border-gray-100">Cancel</Button>
                        <Button onClick={handleDelete} className="flex-1 h-11 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20">
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Bulk Import ── */}
            <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
                <DialogContent className="max-w-md rounded-[28px] p-0 border-none shadow-2xl overflow-hidden">
                    <div className="px-8 pt-8 pb-5 bg-gradient-to-br from-violet-50 to-purple-50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-violet-500 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-gray-900">Bulk Import</DialogTitle>
                                <p className="text-xs text-gray-500 mt-0.5">Paste CSV to add multiple pincodes at once</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-8 pb-8 pt-5 bg-white space-y-4">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Format</p>
                            <code className="text-xs text-gray-600 font-mono block leading-loose whitespace-pre">{`pincode[,delivery_note]

# Examples:
400001
560001,Next-day delivery by 6 PM
110001,Same-day available`}</code>
                        </div>
                        <div>
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                                Paste CSV Data
                            </Label>
                            <textarea
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                                placeholder={"400001\n560001,Next-day delivery\n110001"}
                                rows={7}
                                className="w-full p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 text-sm font-mono text-gray-800 placeholder-gray-300 outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white resize-none leading-relaxed"
                            />
                            {bulkText.trim() && (
                                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                                    {bulkText.split("\n").filter((l) => l.trim() && !l.startsWith("#")).length} lines detected
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => { setShowBulkModal(false); setBulkText(""); }}
                                className="flex-1 h-11 rounded-2xl border-gray-100 text-gray-600 font-semibold">
                                Cancel
                            </Button>
                            <Button onClick={handleBulkImport} disabled={bulkLoading || !bulkText.trim()}
                                className="flex-1 h-11 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-500/20">
                                {bulkLoading
                                    ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Importing...</>
                                    : <><Upload className="w-4 h-4 mr-2" />Import</>}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Pincodes;
