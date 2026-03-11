import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Scale, Users, UserCheck, ArrowLeftRight, Link2, Plus, Download, Building2,
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";

type StatView = "members" | "directors" | "transfers" | "charges";

const StatutoryRegisters = () => {
    const [view, setView] = useState<StatView>("members");
    const [showAddMember, setShowAddMember] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showAddDirector, setShowAddDirector] = useState(false);
    const [showAddCharge, setShowAddCharge] = useState(false);

    // Dynamic State
    const [members, setMembers] = useState<any[]>([]);
    const [directors, setDirectors] = useState<any[]>([]);
    const [charges, setCharges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Member Form
    const [name, setName] = useState("");
    const [pan, setPan] = useState("");
    const [sharesHeld, setSharesHeld] = useState("");
    const [shareClass, setShareClass] = useState("Equity");
    const [allotmentDate, setAllotmentDate] = useState("");

    // Transfer Form
    const [fromMember, setFromMember] = useState("");
    const [toMember, setToMember] = useState("");
    const [transferShares, setTransferShares] = useState("");

    // Add Director Form
    const [din, setDin] = useState("");
    const [dirName, setDirName] = useState("");
    const [designation, setDesignation] = useState("Director");
    const [appointed, setAppointed] = useState("");
    const [shareholding, setShareholding] = useState("0%");

    // Add Charge Form
    const [chargeId, setChargeId] = useState("");
    const [lender, setLender] = useState("");
    const [chargeType, setChargeType] = useState("Hypothecation");
    const [amount, setAmount] = useState("");
    const [rocId, setRocId] = useState("");
    const [createdDate, setCreatedDate] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [memRes, dirRes, chargeRes] = await Promise.all([
                accountingApi.getShareholders(),
                accountingApi.getDirectors(),
                accountingApi.getCharges(),
            ]);
            setMembers(memRes?.data || []);
            setDirectors(dirRes?.data || []);
            setCharges(chargeRes?.data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load statutory records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExportROC = () => {
        toast.loading("Generating ROC report...", { id: "roc-export" });

        let dataToExport = [];
        let filename = `Statutory_Register_${view}`;

        if (view === "members" || view === "transfers") {
            dataToExport = members.map(s => ({
                "Folio No": s.folioNumber,
                Name: s.name,
                PAN: s.pan,
                "Date of Allotment": new Date(s.allotmentDate).toLocaleDateString(),
                "Shares Held": s.sharesHeld,
                "Value (₹10/share)": s.sharesHeld * 10
            }));
        } else if (view === "directors") {
            dataToExport = directors.map(d => ({
                DIN: d.din,
                Name: d.name,
                Designation: d.designation,
                "Date of Appointment": new Date(d.appointmentDate).toLocaleDateString(),
                PAN: d.pan
            }));
        } else if (view === "charges") {
            dataToExport = charges.map(c => ({
                "Charge ID": c.chargeId,
                "Charge Holder": c.chargeHolder,
                Amount: c.amount,
                "Creation Date": new Date(c.creationDate).toLocaleDateString(),
                Status: c.status
            }));
        }

        exportToCSV(dataToExport, filename);
        toast.success("ROC register exported successfully!", { id: "roc-export" });
    };

    // --- Save Handlers ---
    const handleSaveMember = async () => {
        if (!name || !pan || !sharesHeld || !allotmentDate) return toast.error("Please fill all fields");
        toast.loading("Adding shareholder...", { id: "add-member" });
        try {
            await accountingApi.createShareholder({
                name, pan, sharesHeld: Number(sharesHeld), class: shareClass, allotmentDate: new Date(allotmentDate).toISOString()
            });
            toast.success("Shareholder added to register!", { id: "add-member" });
            setShowAddMember(false);
            setName(""); setPan(""); setSharesHeld(""); setAllotmentDate("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add shareholder", { id: "add-member" });
        }
    };

    const handleSaveTransfer = async () => {
        if (!fromMember || !toMember || !transferShares) return toast.error("Please fill all fields");
        if (fromMember === toMember) return toast.error("Sender and Receiver cannot be the same");

        toast.loading("Processing share transfer...", { id: "transfer-shares" });
        try {
            await accountingApi.transferShares({
                fromFolio: members.find(m => m._id === fromMember)?.folio, // Folio string is required by backend
                toFolio: members.find(m => m._id === toMember)?.folio,
                noOfShares: Number(transferShares)
            });
            toast.success("Share transfer recorded!", { id: "transfer-shares" });
            setShowTransfer(false);
            setFromMember(""); setToMember(""); setTransferShares("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to record share transfer", { id: "transfer-shares" });
        }
    };

    const handleSaveDirector = async () => {
        if (!din || !dirName || !appointed) return toast.error("Please fill required fields (DIN, Name, Date)");
        toast.loading("Recording Director...", { id: "add-dir" });
        try {
            await accountingApi.createDirector({
                din, name: dirName, designation, appointed: new Date(appointed).toISOString(), shareholding
            });
            toast.success("Director added to register!", { id: "add-dir" });
            setShowAddDirector(false);
            setDin(""); setDirName(""); setAppointed(""); setShareholding("0%");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add director", { id: "add-dir" });
        }
    };

    const handleSaveCharge = async () => {
        if (!chargeId || !lender || !amount || !rocId || !createdDate) return toast.error("Please fill all fields");
        toast.loading("Registering Charge...", { id: "add-charge" });
        try {
            await accountingApi.createCharge({
                chargeId, lender, type: chargeType, amount: Number(amount), rocId, createdDate: new Date(createdDate).toISOString()
            });
            toast.success("Charge registered successfully!", { id: "add-charge" });
            setShowAddCharge(false);
            setChargeId(""); setLender(""); setAmount(""); setRocId(""); setCreatedDate("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to register charge", { id: "add-charge" });
        }
    };


    const totalCapital = members.reduce((a, m) => a + (m.totalValue || 0), 0);
    const totalShares = members.reduce((a, m) => a + (m.sharesHeld || 0), 0);

    const tabs: [StatView, string, any][] = [
        ["members", "Register of Members", Users],
        ["directors", "Register of Directors", UserCheck],
        ["transfers", "Share Transfers", ArrowLeftRight],
        ["charges", "Register of Charges", Link2],
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Statutory Registers</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Companies Act Mandatory Registers — GrocMed Pvt Ltd</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExportROC} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> Export ROC Report
                    </Button>
                </div>
            </div>

            {/* Company Info Card */}
            <Card className="p-6 border-none shadow-lg rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-white">GrocMed Private Limited</h3>
                        <p className="text-slate-300 text-sm font-normal mt-0.5">CIN: U51909MH2023PTC389012 | Incorporated: 01 Jan 2023</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {[
                        { label: "Authorized Capital", value: "₹10,00,000" },
                        { label: "Paid-up Capital", value: `₹${totalCapital.toLocaleString()}` },
                        { label: "Total Shareholders", value: members.length.toString() },
                        { label: "Total Shares Issued", value: totalShares.toLocaleString() },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-white/10 rounded-2xl p-3">
                            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">{label}</p>
                            <p className="text-white font-black text-lg mt-1">{value}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {tabs.map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setView(key)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${view === key ? "bg-white text-slate-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Register of Members */}
            {view === "members" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-black text-gray-900">Register of Members (Shareholders)</h3>
                        <Button size="sm" onClick={() => setShowAddMember(true)} className="h-9 px-4 rounded-xl bg-slate-800 text-white text-xs font-normal gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Member
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Folio No.", "Name", "PAN", "Shares Held", "Class", "Allotment Date", "Value", "Status"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading shareholders...</td></tr>
                                ) : members.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">No shareholders found.</td></tr>
                                ) : members.map(m => (
                                    <tr key={m.folio} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono font-bold text-gray-700">{m.folio}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-slate-700 font-bold text-sm border border-slate-100 flex-shrink-0">
                                                    {m.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">{m.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{m.pan}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{m.sharesHeld?.toLocaleString()}</td>
                                        <td className="px-6 py-4"><Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs font-normal px-2 py-0.5 rounded-lg">{m.class}</Badge></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(m.allotmentDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">₹{m.totalValue?.toLocaleString()}</td>
                                        <td className="px-6 py-4"><Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold px-2.5 py-1 rounded-lg">{m.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Register of Directors */}
            {view === "directors" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <h3 className="font-black text-gray-900">Register of Directors & Key Managerial Personnel</h3>
                        <Button size="sm" onClick={() => setShowAddDirector(true)} className="h-9 px-4 rounded-xl bg-blue-600 text-white text-xs font-normal gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Director
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["DIN", "Name", "Designation", "Date of Appointment", "Nationality", "Shareholding", "Status"].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">Loading directors...</td></tr>
                                ) : directors.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No directors found on register.</td></tr>
                                ) : directors.map(d => (
                                    <tr key={d.din} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono font-bold text-gray-700">{d.din}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm border border-blue-100">
                                                    {d.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900">{d.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{d.designation}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(d.appointed).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{d.nationality}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{d.shareholding}</td>
                                        <td className="px-6 py-4"><Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold px-2.5 py-1 rounded-lg">{d.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Share Transfers */}
            {view === "transfers" && (
                <Card className="p-8 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <ArrowLeftRight className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-black text-gray-900 text-xl mb-2">Record Share Transfers</h3>
                    <p className="text-gray-500 text-sm font-normal max-w-sm mx-auto">Track the transfer of shares between existing members. Both folios will automatically reflect the updated balance.</p>
                    <div className="mt-8 flex justify-center">
                        <Button className="h-11 px-8 rounded-2xl bg-slate-800 text-white font-normal text-xs uppercase tracking-widest gap-2" onClick={() => setShowTransfer(true)}>
                            <Plus className="w-4 h-4" /> Initiate Transfer
                        </Button>
                    </div>
                </Card>
            )}

            {/* Register of Charges */}
            {view === "charges" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="font-black text-gray-900">Register of Charges (Loans & Mortgages)</h3>
                            <p className="text-xs text-gray-400 mt-0.5">Filed with ROC under MCA</p>
                        </div>
                        <Button size="sm" onClick={() => setShowAddCharge(true)} className="h-9 px-4 rounded-xl bg-orange-600 text-white text-xs font-normal gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Charge
                        </Button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Loading charges...</div>
                        ) : charges.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No active charges found.</div>
                        ) : charges.map(c => (
                            <div key={c.chargeId} className="px-6 py-5 hover:bg-gray-50/30 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center border border-blue-100">
                                            <Link2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{c.lender}</p>
                                            <p className="text-sm text-gray-600 mt-0.5">{c.type}</p>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-xs text-gray-400">Charge ID: <span className="font-mono font-semibold text-gray-600">{c.chargeId}</span></span>
                                                <span className="text-xs text-gray-400">ROC: <span className="font-mono font-semibold text-gray-600">{c.rocId}</span></span>
                                                <span className="text-xs text-gray-400">Created: {new Date(c.createdDate).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <p className="text-lg font-black text-gray-900">₹{c.amount?.toLocaleString()}</p>
                                        <Badge className="bg-orange-50 text-orange-700 border-orange-200 text-xs font-semibold px-2.5 py-1 rounded-lg mt-2 w-fit">{c.status}</Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modal: Add Member */}
            <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Add Shareholder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</p>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">PAN Number</p>
                            <Input value={pan} onChange={e => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 uppercase" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">No. of Shares</p>
                                <Input type="number" value={sharesHeld} onChange={e => setSharesHeld(e.target.value)} placeholder="0" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Class</p>
                                <Select value={shareClass} onValueChange={setShareClass}>
                                    <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Equity">Equity</SelectItem>
                                        <SelectItem value="Preference">Preference</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Allotment Date</p>
                            <Input type="date" value={allotmentDate} onChange={e => setAllotmentDate(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddMember(false)} className="flex-1 h-12 rounded-2xl border-gray-100">Cancel</Button>
                        <Button onClick={handleSaveMember} className="flex-1 h-12 rounded-2xl bg-slate-800 text-white font-normal text-xs uppercase tracking-widest">Save Member</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Transfer */}
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Record Transfer</DialogTitle>
                    </DialogHeader>
                    {/* Input logic simplified */}
                    <div className="space-y-4 py-4">
                        <Select value={fromMember} onValueChange={setFromMember}>
                            <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="From Folio" /></SelectTrigger>
                            <SelectContent>{members.filter(m => m.sharesHeld > 0).map(m => (<SelectItem key={m._id} value={m._id}>{m.folio}</SelectItem>))}</SelectContent>
                        </Select>
                        <Select value={toMember} onValueChange={setToMember}>
                            <SelectTrigger className="h-12 rounded-2xl"><SelectValue placeholder="To Folio" /></SelectTrigger>
                            <SelectContent>{members.map(m => (<SelectItem key={m._id} value={m._id}>{m.folio}</SelectItem>))}</SelectContent>
                        </Select>
                        <Input type="number" value={transferShares} onChange={e => setTransferShares(e.target.value)} placeholder="Shares" className="h-12 rounded-2xl" />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button onClick={handleSaveTransfer} className="flex-1 h-12 rounded-2xl bg-slate-800 text-white">Record</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Add Director */}
            <Dialog open={showAddDirector} onOpenChange={setShowAddDirector}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Record Director</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input value={din} onChange={e => setDin(e.target.value)} placeholder="DIN" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input value={dirName} onChange={e => setDirName(e.target.value)} placeholder="Director Name" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Select value={designation} onValueChange={setDesignation}>
                            <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Managing Director">Managing Director</SelectItem>
                                <SelectItem value="Director">Director</SelectItem>
                                <SelectItem value="Independent Director">Independent Director</SelectItem>
                                <SelectItem value="Additional Director">Additional Director</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input type="date" value={appointed} onChange={e => setAppointed(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input value={shareholding} onChange={e => setShareholding(e.target.value)} placeholder="Shareholding %" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddDirector(false)} className="flex-1 h-12 rounded-2xl border-gray-100">Cancel</Button>
                        <Button onClick={handleSaveDirector} className="flex-1 h-12 rounded-2xl bg-blue-600 text-white font-normal text-xs uppercase tracking-widest">Save Director</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Add Charge */}
            <Dialog open={showAddCharge} onOpenChange={setShowAddCharge}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Record Charge</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Input value={chargeId} onChange={e => setChargeId(e.target.value)} placeholder="Bank Charge ID" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input value={lender} onChange={e => setLender(e.target.value)} placeholder="Lender Name" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input value={chargeType} onChange={e => setChargeType(e.target.value)} placeholder="Charge Type" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Charge Amount" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input value={rocId} onChange={e => setRocId(e.target.value)} placeholder="ROC Filing ID" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        <Input type="date" value={createdDate} onChange={e => setCreatedDate(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddCharge(false)} className="flex-1 h-12 rounded-2xl border-gray-100">Cancel</Button>
                        <Button onClick={handleSaveCharge} className="flex-1 h-12 rounded-2xl bg-orange-600 text-white font-normal text-xs uppercase tracking-widest">Register Charge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default StatutoryRegisters;
