import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Landmark, Wallet, BookOpen, Plus, TrendingUp, TrendingDown,
    ArrowUpRight, ArrowDownLeft, Download
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";

type ActiveTab = "cash" | "bank" | "journal";

const Finance = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>("cash");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);

    // --- Dynamic State ---
    const [ledgers, setLedgers] = useState<any[]>([]);
    const [journals, setJournals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State: Cash Entry
    const [cashType, setCashType] = useState("Receipt");
    const [cashNarration, setCashNarration] = useState("");
    const [cashAmount, setCashAmount] = useState("");
    const [cashCategory, setCashCategory] = useState(""); // Ledger ID for the other side

    // Form State: Journal Voucher
    const [jvDate, setJvDate] = useState(new Date().toISOString().split('T')[0]);
    const [jvDebit, setJvDebit] = useState(""); // Ledger ID
    const [jvCredit, setJvCredit] = useState(""); // Ledger ID
    const [jvAmount, setJvAmount] = useState("");
    const [jvNarration, setJvNarration] = useState("");

    // Form State: Ledger
    const [ledgerName, setLedgerName] = useState("");
    const [ledgerGroup, setLedgerGroup] = useState("Asset");
    const [ledgerSubGroup, setLedgerSubGroup] = useState("");
    const [openingBalance, setOpeningBalance] = useState("0");
    const [openingBalanceType, setOpeningBalanceType] = useState("Dr");

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [ledgerRes, journalRes] = await Promise.all([
                accountingApi.getLedgers(),
                accountingApi.getJournals(1, 100)
            ]);

            // Flatten the grouped ledgers for simple dropdown use
            const flatLedgers: any[] = [];
            if (ledgerRes?.data) {
                Object.values(ledgerRes.data).forEach((groupArray: any) => {
                    flatLedgers.push(...groupArray);
                });
            }
            setLedgers(flatLedgers);
            setJournals(journalRes?.data || []);
        } catch (error) {
            console.error("Failed to load finance data", error);
            // toast.error("Failed to load finance data"); // Silent error to not spam if backend empty
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const handleExport = () => {
        toast.loading("Preparing export...", { id: "finance-export" });

        let dataToExport = [];
        if (activeTab === 'cash') dataToExport = cashData;
        else if (activeTab === 'bank') dataToExport = bankData;
        else dataToExport = journals;

        const csvData = dataToExport.map(j => ({
            Date: new Date(j.date).toLocaleDateString(),
            "Voucher No": j.voucherNo,
            Type: j.type,
            Narration: j.narration,
            Amount: j.totalAmount
        }));

        exportToCSV(csvData, `Finance_Export_${activeTab}`);
        toast.success("Finance report exported successfully!", { id: "finance-export" });
    };

    const handleSaveEntry = async () => {
        if (!cashNarration || !cashAmount || !cashCategory) return toast.error("Please fill all fields");

        try {
            // Find "Cash" Ledger. If it doesn't exist, we fallback
            const cashLedger = ledgers.find(l => l.name.toLowerCase().includes('cash')) || ledgers[0];

            if (!cashLedger) return toast.error("No Cash Ledger found in system!");

            const debitLedger = cashType === "Receipt" ? cashLedger._id : cashCategory;
            const creditLedger = cashType === "Receipt" ? cashCategory : cashLedger._id;

            const payload = {
                date: new Date().toISOString(),
                voucherNo: `CSH/${Date.now().toString().slice(-6)}`,
                type: cashType,
                narration: cashNarration,
                entries: [
                    { ledgerId: debitLedger, debit: Number(cashAmount), credit: 0 },
                    { ledgerId: creditLedger, debit: 0, credit: Number(cashAmount) }
                ]
            };

            await accountingApi.createJournalEntry(payload);
            toast.success("Entry recorded successfully!");
            setShowAddModal(false);

            // Reset & Refresh
            setCashNarration(""); setCashAmount("");
            fetchFinanceData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save entry");
        }
    };

    const handleSaveVoucher = async () => {
        if (!jvDebit || !jvCredit || !jvAmount || !jvNarration) return toast.error("Please fill all fields");
        if (jvDebit === jvCredit) return toast.error("Debit and Credit accounts cannot be the same");

        try {
            const payload = {
                date: new Date(jvDate).toISOString(),
                voucherNo: `JV/${Date.now().toString().slice(-6)}`,
                type: "Journal",
                narration: jvNarration,
                entries: [
                    { ledgerId: jvDebit, debit: Number(jvAmount), credit: 0 },
                    { ledgerId: jvCredit, debit: 0, credit: Number(jvAmount) }
                ]
            };

            await accountingApi.createJournalEntry(payload);
            toast.success("Journal voucher saved!");
            setShowJournalModal(false);

            // Reset & Refresh
            setJvAmount(""); setJvNarration(""); setJvDebit(""); setJvCredit("");
            fetchFinanceData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to save journal voucher");
        }
    };

    const handleSaveLedger = async () => {
        if (!ledgerName || !ledgerGroup) return toast.error("Name and Group are required");
        toast.loading("Adding Ledger...", { id: "add-ledger" });
        try {
            await accountingApi.createLedger({
                name: ledgerName, group: ledgerGroup, subGroup: ledgerSubGroup, openingBalance: Number(openingBalance), openingBalanceType
            });
            toast.success("Ledger created successfully!", { id: "add-ledger" });
            setShowLedgerModal(false);
            setLedgerName(""); setLedgerGroup("Asset"); setLedgerSubGroup(""); setOpeningBalance("0"); setOpeningBalanceType("Dr");
            fetchFinanceData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create ledger", { id: "add-ledger" });
        }
    };

    // Strict Ledger Identifiers
    const cashLedgerIds = ledgers.filter(l => l.name.toLowerCase().includes('cash')).map(l => l._id);
    const bankLedgerIds = ledgers.filter(l => l.name.toLowerCase().includes('bank') || l.subGroup === 'Bank').map(l => l._id);

    // Filter Journal Registries
    const cashData = journals.filter(j => j.entries.some((e: any) => cashLedgerIds.includes(e.ledgerId?._id || e.ledgerId)));
    const bankData = journals.filter(j => j.entries.some((e: any) => bankLedgerIds.includes(e.ledgerId?._id || e.ledgerId)));
    const nonCashData = journals.filter(j => j.type === "Journal" || j.type === "Contra");

    // Exact Book Balance Calculations (Double Entry)
    let cashBalance = 0;
    let bankBalance = 0;
    let totalReceipts = 0;
    let totalPayments = 0;

    journals.forEach(j => {
        j.entries.forEach((e: any) => {
            const entryLedgerId = e.ledgerId?._id || e.ledgerId;
            if (cashLedgerIds.includes(entryLedgerId)) {
                cashBalance += (e.debit - e.credit);  // Cash is an Asset (Debit normal)
                if (e.debit > 0) totalReceipts += e.debit;
                if (e.credit > 0) totalPayments += e.credit;
            }
            if (bankLedgerIds.includes(entryLedgerId)) {
                bankBalance += (e.debit - e.credit); // Bank is an Asset (Debit normal)
            }
        });
    });

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Finance</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Cash Book, Bank Book & Journal Entries</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                    <Button onClick={() => setShowLedgerModal(true)} className="h-11 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30 gap-2 p-0 sm:px-5">
                        <Plus className="w-4 h-4 hidden sm:block" /> New Ledger
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-primary/30 gap-2 p-0 sm:px-5"
                    >
                        <Plus className="w-4 h-4" /> New Entry
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-green-50 via-white to-green-50/30 ring-1 ring-green-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Cash Balance</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">₹{cashBalance.toLocaleString()}</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-blue-50 via-white to-blue-50/30 ring-1 ring-blue-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Landmark className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Bank Balance</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">₹{bankBalance.toLocaleString()}</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 ring-1 ring-emerald-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Receipts</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">₹{totalReceipts.toLocaleString()}</p>
                </Card>
                <Card className="p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br from-red-50 via-white to-red-50/30 ring-1 ring-red-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                        <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Total Payments</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">₹{totalPayments.toLocaleString()}</p>
                </Card>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["cash", "Cash Book", Wallet], ["bank", "Bank Book", Landmark], ["journal", "Journal", BookOpen]] as const).map(([key, label, Icon]) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key as ActiveTab)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === key ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content Tabs */}
            {activeTab === "cash" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">Cash Book</h3>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">Recorded cash transactions</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th>Voucher No.</th>
                                    <th>Date</th>
                                    <th>Narration</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : cashData.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No cash transactions found</td></tr>
                                ) : cashData.map(row => (
                                    <tr key={row._id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="font-mono font-semibold text-gray-700">{row.voucherNo}</td>
                                        <td className="text-gray-600 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="font-medium text-gray-900">{row.narration}</td>
                                        <td>
                                            {row.type === "Receipt" ? (
                                                <Badge className="bg-green-50 text-green-700 border-green-200 text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                                    <ArrowDownLeft className="w-3 h-3" /> <span className="hidden xs:inline">Receipt</span>
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-red-50 text-red-600 border-red-200 text-xs font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit">
                                                    <ArrowUpRight className="w-3 h-3" /> <span className="hidden xs:inline">Payment</span>
                                                </Badge>
                                            )}
                                        </td>
                                        <td className={`font-bold whitespace-nowrap ${row.type === "Receipt" ? "text-green-600" : "text-red-500"}`}>
                                            {row.type === "Receipt" ? "+" : "-"}₹{row.totalAmount?.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === "bank" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">Bank Book</h3>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">Recorded bank transactions</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th>Voucher No.</th>
                                    <th>Date</th>
                                    <th>Narration</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : bankData.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No bank transactions found</td></tr>
                                ) : bankData.map(row => (
                                    <tr key={row._id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="font-mono font-semibold text-gray-700">{row.voucherNo}</td>
                                        <td className="text-gray-600 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="font-medium text-gray-900">{row.narration}</td>
                                        <td className="font-bold text-gray-900 whitespace-nowrap">₹{row.totalAmount?.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === "journal" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-gray-900">Journal Register</h3>
                            <p className="text-xs text-gray-400 font-normal mt-0.5">Non-cash adjustment entries</p>
                        </div>
                        <Button size="sm" onClick={() => setShowJournalModal(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> New Voucher
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th>Voucher No.</th>
                                    <th>Date</th>
                                    <th>Narration</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : nonCashData.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No journal entries found</td></tr>
                                ) : nonCashData.map(row => (
                                    <tr key={row._id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="font-mono font-semibold text-gray-700">{row.voucherNo}</td>
                                        <td className="text-gray-600 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                        <td className="font-medium text-gray-900 truncate max-w-[200px] block my-2">{row.narration}</td>
                                        <td className="font-bold text-gray-900 whitespace-nowrap">₹{row.totalAmount?.toLocaleString()}</td>
                                        <td>
                                            <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${row.status === "Posted" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                                                {row.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Add Cash Entry Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">New Cash Entry</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Record a daily cash transaction</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction Type</p>
                            <Select value={cashType} onValueChange={setCashType}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Receipt">Receipt (Inflow)</SelectItem>
                                    <SelectItem value="Payment">Payment (Outflow)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Narration / Description</p>
                            <Input value={cashNarration} onChange={(e) => setCashNarration(e.target.value)} placeholder="e.g. Cash Sales" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount (₹)</p>
                            <Input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Against Ledger (Category)</p>
                            <Select value={cashCategory} onValueChange={setCashCategory}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Select Ledger" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ledgers.map(l => (
                                        <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveEntry} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-primary/30">Save Entry</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Journal Voucher Modal */}
            <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">New Journal Voucher</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Record a non-cash accounting entry</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Voucher Date</p>
                            <Input type="date" value={jvDate} onChange={(e) => setJvDate(e.target.value)} className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Debit Account</p>
                            <Select value={jvDebit} onValueChange={setJvDebit}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Select Ledger to Debit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ledgers.map(l => (
                                        <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Credit Account</p>
                            <Select value={jvCredit} onValueChange={setJvCredit}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Select Ledger to Credit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ledgers.map(l => (
                                        <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount (₹)</p>
                            <Input type="number" value={jvAmount} onChange={(e) => setJvAmount(e.target.value)} placeholder="0.00" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Narration</p>
                            <Input value={jvNarration} onChange={(e) => setJvNarration(e.target.value)} placeholder="e.g. Depreciation adjusting entry" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowJournalModal(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveVoucher} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs uppercase tracking-widest">Save Voucher</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Ledger Modal */}
            <Dialog open={showLedgerModal} onOpenChange={setShowLedgerModal}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">New Chart of Account</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Add a new ledger explicitly</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ledger Name</p>
                            <Input value={ledgerName} onChange={(e) => setLedgerName(e.target.value)} placeholder="e.g. Sales Tax Payable" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Group</p>
                            <Select value={ledgerGroup} onValueChange={setLedgerGroup}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Asset">Asset</SelectItem>
                                    <SelectItem value="Liability">Liability</SelectItem>
                                    <SelectItem value="Equity">Equity</SelectItem>
                                    <SelectItem value="Revenue">Revenue</SelectItem>
                                    <SelectItem value="Expense">Expense</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sub-Group (Optional)</p>
                            <Input value={ledgerSubGroup} onChange={(e) => setLedgerSubGroup(e.target.value)} placeholder="e.g. Current Liabilities" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Opening Bal</p>
                                <Input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)} placeholder="0" className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Type</p>
                                <Select value={openingBalanceType} onValueChange={setOpeningBalanceType}>
                                    <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Dr">Dr (Debit)</SelectItem>
                                        <SelectItem value="Cr">Cr (Credit)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowLedgerModal(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveLedger} className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-normal text-xs uppercase tracking-widest">Save Ledger</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Finance;
