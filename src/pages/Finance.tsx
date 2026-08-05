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
    ArrowUpRight, ArrowDownLeft, Download, Info
} from "lucide-react";
import { accountingApi, Ledger, JournalEntry } from "@/api/accountingApi";
import { orderApi } from "@/api/orderApi";
import { exportToCSV } from "@/utils/exportUtils";
import { formatDateDDMMYYYY } from "@/utils/dateUtils";
import { ReportDownloadModal, DateRangeFilter } from "@/components/ui/ReportDownloadModal";

type ActiveTab = "cash" | "bank" | "journal";

const Finance = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>("cash");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showJournalModal, setShowJournalModal] = useState(false);
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [orderMap, setOrderMap] = useState<Record<string, { shopName: string, customerName: string }>>({});

    // --- Dynamic State ---
    const [ledgers, setLedgers] = useState<Ledger[]>([]);
    const [journals, setJournals] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State: Cash Entry
    const [cashType, setCashType] = useState<"Receipt" | "Payment" | "Journal" | "Contra">("Receipt");
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
    const [ledgerGroup, setLedgerGroup] = useState<Ledger["group"]>("Asset");
    const [ledgerSubGroup, setLedgerSubGroup] = useState("");
    const [openingBalance, setOpeningBalance] = useState("0");
    const [openingBalanceType, setOpeningBalanceType] = useState<Ledger["openingBalanceType"]>("Dr");

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            const [ledgerRes, journalRes, ordersRes] = await Promise.all([
                accountingApi.getLedgers(),
                accountingApi.getJournals(1, 100),
                orderApi.getAllOrders().catch(() => null)
            ]);

            // Map order short ID to customer shop name & name
            const map: Record<string, { shopName: string, customerName: string }> = {};
            if (ordersRes?.orders || ordersRes?.data) {
                const ordersList = ordersRes.orders || ordersRes.data || [];
                ordersList.forEach((o: any) => {
                    const shortId = o._id.substring(o._id.length - 8).toUpperCase();
                    map[shortId] = {
                        shopName: o.customer?.shopName || "No Shop Name",
                        customerName: o.customer?.name || "Customer"
                    };
                });
            }
            setOrderMap(map);

            // Flatten the grouped ledgers for simple dropdown use
            const flatLedgers: Ledger[] = [];
            if (ledgerRes?.data) {
                Object.values(ledgerRes.data).forEach((groupArray: Ledger[]) => {
                    flatLedgers.push(...groupArray);
                });
            }
            setLedgers(flatLedgers);
            setJournals(journalRes?.data || []);
        } catch (error) {
            console.error("Failed to load finance data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, []);

    const handleGenerateReport = ({ startDate, endDate }: DateRangeFilter) => {
        toast.loading("Preparing export...", { id: "finance-export" });

        let dataToExport = [];
        if (activeTab === 'cash') dataToExport = cashData;
        else if (activeTab === 'bank') dataToExport = bankData;
        else dataToExport = journals;

        if (startDate || endDate) {
            dataToExport = dataToExport.filter(j => {
                const itemDate = new Date(j.date);
                if (isNaN(itemDate.getTime())) return false;
                if (startDate && itemDate < startDate) return false;
                if (endDate && itemDate > endDate) return false;
                return true;
            });
        }

        const csvData = dataToExport.map(j => ({
            Date: formatDateDDMMYYYY(j.date),
            "Voucher No": j.voucherNo,
            Type: j.type,
            Narration: j.narration,
            Amount: j.totalAmount
        }));

        exportToCSV(csvData, `Finance_Export_${activeTab}`);
        toast.success(`Finance report exported (${csvData.length} records)!`, { id: "finance-export" });
    };

    const handleSaveEntry = async () => {
        if (!cashAmount || Number(cashAmount) <= 0) return toast.error("Please enter a valid amount");
        if (!cashCategory) return toast.error("Please select a category/account");
        if (!cashNarration) return toast.error("Please enter a narration");

        try {
            // Find "Cash" Ledger. If it doesn't exist, we fallback
            const cashLedger = ledgers.find(l => (l.name || '').toLowerCase().includes('cash')) || ledgers[0];

            if (!cashLedger) return toast.error("No Cash Ledger found in system!");

            const debitLedger = cashType === "Receipt" ? cashLedger._id : cashCategory;
            const creditLedger = cashType === "Receipt" ? cashCategory : cashLedger._id;

            const payload: Partial<JournalEntry> = {
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
            const payload: Partial<JournalEntry> = {
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
    const cashLedgerIds = ledgers.filter(l => (l.name || '').toLowerCase().includes('cash')).map(l => l._id);
    const bankLedgerIds = ledgers.filter(l => (l.name || '').toLowerCase().includes('bank') || l.subGroup === 'Bank').map(l => l._id);

    // Extract Shop Name vs Customer Name from Order Map / Ledger Name
    const getAccountDetails = (row: JournalEntry) => {
        // 1. Match order short ID from voucherNo (e.g. SAL/55111518) or narration (Order #55111518)
        let shortId = "";
        if (row.voucherNo && row.voucherNo.includes('/')) {
            shortId = row.voucherNo.split('/')[1].trim().toUpperCase();
        } else if (row.narration && row.narration.includes('Order #')) {
            const match = row.narration.match(/Order #([A-Za-z0-9]+)/);
            if (match) shortId = match[1].trim().toUpperCase();
        }

        if (shortId && orderMap[shortId]) {
            const ord = orderMap[shortId];
            return {
                shopName: ord.shopName || "No Shop Name",
                customerName: ord.customerName
            };
        }

        // 2. Parse narration if it contains Customer: ...
        if (row.narration && row.narration.includes('Customer:')) {
            const customerStr = row.narration.split('Customer:')[1].trim();
            if (customerStr.includes(' (')) {
                const parts = customerStr.split(' (');
                return {
                    shopName: parts[0].trim(),
                    customerName: parts[1].replace(')', '').trim()
                };
            }
            return {
                shopName: "No Shop Name",
                customerName: customerStr
            };
        }

        // 3. Target entry ledger fallback
        const targetEntry = row.entries?.find((e: any) => {
            const name = (typeof e.ledgerId === 'object' ? e.ledgerId?.name : '') || '';
            return !name.toLowerCase().includes('cash') && !name.toLowerCase().includes('bank');
        }) || row.entries?.[0];

        const ledgerObj = typeof targetEntry?.ledgerId === 'object' ? targetEntry.ledgerId : null;
        const rawName = ledgerObj?.name || 'General Account';

        if (rawName.includes(' - ')) {
            const parts = rawName.split(' - ');
            return { shopName: parts[0], customerName: parts.slice(1).join(' - ') };
        }
        if (rawName.includes(' (')) {
            const parts = rawName.split(' (');
            return { shopName: parts[0], customerName: parts[1].replace(')', '') };
        }
        return { shopName: rawName, customerName: null };
    };

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
        j.entries.forEach((e) => {
            const entryLedgerId = typeof e.ledgerId === 'string' ? e.ledgerId : e.ledgerId._id;
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
        <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Finance</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Cash Book, Bank Book & Journal Entries</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setShowReportModal(true)} className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2 bg-white">
                        <Download className="w-4 h-4 text-primary" /> Export CSV
                    </Button>
                    <Button onClick={() => setShowLedgerModal(true)} className="h-11 px-5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-primary/20 gap-2 p-0 sm:px-5">
                        <Plus className="w-4 h-4 hidden sm:block" /> New Ledger
                    </Button>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30 gap-2 p-0 sm:px-5"
                    >
                        <Plus className="w-4 h-4" /> New Entry
                    </Button>
                </div>
            </div>

            {/* Educational Info Banner */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900">
                        {activeTab === "cash" && "Cash Book Management"}
                        {activeTab === "bank" && "Bank Reconciliation & Records"}
                        {activeTab === "journal" && "Journal Vouchers (JV)"}
                    </p>
                    <p className="text-xs text-blue-700/80 mt-1 leading-relaxed max-w-2xl">
                        {activeTab === "cash" && "Record daily cash receipts and payments. Every transaction here automatically updates your Cash-in-Hand ledger balance."}
                        {activeTab === "bank" && "Track bank transactions, deposits, and electronic transfers. Use this to reconcile your physical bank statements with internal records."}
                        {activeTab === "journal" && "Pass non-cash adjustments, depreciation entries, or corrections. JVs require a balanced Debit (Dr) and Credit (Cr) to maintain accounting integrity."}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-green-50/50 via-white to-green-50/30 ring-1 ring-green-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Cash Balance</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent">₹{cashBalance.toLocaleString()}</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 ring-1 ring-blue-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
                        <Landmark className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Bank Balance</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">₹{bankBalance.toLocaleString()}</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 ring-1 ring-emerald-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Receipts</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">₹{totalReceipts.toLocaleString()}</p>
                </Card>
                <Card className="p-6 border-none shadow-2xl rounded-[32px] bg-gradient-to-br from-red-50/50 via-white to-red-50/30 ring-1 ring-red-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/20">
                        <TrendingDown className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Payments</p>
                    <p className="text-2xl font-black bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">₹{totalPayments.toLocaleString()}</p>
                </Card>
            </div>

            {/* Tab Switcher */}
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                    {([["cash", "Cash in Hand", Wallet], ["bank", "Bank Accounts", Landmark], ["journal", "Adjustments", BookOpen]] as const).map(([key, label, Icon]) => (
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
                
                {activeTab === "cash" && (
                    <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-green-600">
                            <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-green-900">Cash in Hand Ledger</p>
                            <p className="text-xs text-green-700/80 mt-0.5">Track every rupee available as physical cash. Record daily sales receipts or small expenses paid from the cash drawer here.</p>
                        </div>
                    </div>
                )}
                {activeTab === "bank" && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-blue-600">
                            <Landmark className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-blue-900">Bank Transaction Register</p>
                            <p className="text-xs text-blue-700/80 mt-0.5">Summary of all money moving through your bank accounts. Useful for reconciling your bank statements at the end of the month.</p>
                        </div>
                    </div>
                )}
                {activeTab === "journal" && (
                    <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-purple-600">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-purple-900">Accounting Adjustments (Journal)</p>
                            <p className="text-xs text-purple-700/80 mt-0.5">Use this for entries that don't involve cash or bank—like calculating depreciation, correcting errors, or recording non-cash credit notes.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Tabs */}
            {activeTab === "cash" && (
                <Card className="border-none shadow-2xl rounded-[32px] bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900 tracking-tight">Cash Book</h3>
                        <p className="text-xs text-gray-400 font-normal mt-0.5">Recorded cash transactions</p>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Voucher No.</th>
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Date</th>
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Shop / Account</th>
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Narration</th>
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6">Type</th>
                                    <th className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-6 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : cashData.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No cash transactions found</td></tr>
                                ) : cashData.map(row => {
                                    const acc = getAccountDetails(row);
                                    return (
                                        <tr key={row._id} className="hover:bg-gray-50/30 transition-colors border-b border-gray-50/50 last:border-0">
                                            <td className="font-mono font-semibold text-gray-700 px-6 py-4">{row.voucherNo}</td>
                                            <td className="text-gray-600 whitespace-nowrap px-6 py-4">{formatDateDDMMYYYY(row.date)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{acc.shopName}</p>
                                                {acc.customerName && <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{acc.customerName}</p>}
                                            </td>
                                            <td className="font-medium text-gray-900 px-6 py-4">{row.narration}</td>
                                            <td className="px-6 py-4">
                                                {row.type === "Receipt" ? (
                                                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit uppercase">
                                                        <ArrowDownLeft className="w-3 h-3" /> <span className="hidden xs:inline">Receipt</span>
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 w-fit uppercase">
                                                        <ArrowUpRight className="w-3 h-3" /> <span className="hidden xs:inline">Payment</span>
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className={`font-black whitespace-nowrap px-6 py-4 text-right ${row.type === "Receipt" ? "text-green-600" : "text-red-500"}`}>
                                                {row.type === "Receipt" ? "+" : "-"}₹{row.totalAmount?.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
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
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher No.</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop / Account</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Narration</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : bankData.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No bank transactions found</td></tr>
                                ) : bankData.map(row => {
                                    const acc = getAccountDetails(row);
                                    return (
                                        <tr key={row._id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="font-mono font-semibold text-gray-700 px-6 py-4">{row.voucherNo}</td>
                                            <td className="text-gray-600 whitespace-nowrap px-6 py-4">{formatDateDDMMYYYY(row.date)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{acc.shopName}</p>
                                                {acc.customerName && <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{acc.customerName}</p>}
                                            </td>
                                            <td className="font-medium text-gray-900 px-6 py-4">{row.narration}</td>
                                            <td className="font-bold text-gray-900 whitespace-nowrap px-6 py-4">₹{row.totalAmount?.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
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
                        <Button size="sm" onClick={() => setShowJournalModal(true)} className="h-10 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/20 gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> New Voucher
                        </Button>
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Voucher No.</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Shop / Account</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Narration</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
                                ) : nonCashData.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No journal entries found</td></tr>
                                ) : nonCashData.map(row => {
                                    const acc = getAccountDetails(row);
                                    return (
                                        <tr key={row._id} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="font-mono font-semibold text-gray-700 px-6 py-4">{row.voucherNo}</td>
                                            <td className="text-gray-600 whitespace-nowrap px-6 py-4">{formatDateDDMMYYYY(row.date)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-900">{acc.shopName}</p>
                                                {acc.customerName && <p className="text-[11px] font-semibold text-indigo-600 mt-0.5">{acc.customerName}</p>}
                                            </td>
                                            <td className="font-medium text-gray-900 truncate max-w-[200px] px-6 py-4">{row.narration}</td>
                                            <td className="font-bold text-gray-900 whitespace-nowrap px-6 py-4">₹{row.totalAmount?.toLocaleString()}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${row.status === "Posted" ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                                                    {row.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Add Cash Entry Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="max-w-md rounded-[40px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black bg-gradient-to-r from-orange-500 to-accent bg-clip-text text-transparent tracking-tight text-center">New Cash Entry</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1 text-center">Record a daily cash transaction</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Transaction Type</p>
                            <Select value={cashType} onValueChange={(val) => setCashType(val as any)}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Receipt">Money In (Receipt)</SelectItem>
                                    <SelectItem value="Payment">Money Out (Payment)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Narration / Remarks</p>
                            <Input value={cashNarration} onChange={(e) => setCashNarration(e.target.value)} placeholder="Reason for entry..." required className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount (₹)</p>
                            <Input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} placeholder="0.00" min="0.01" required className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category (Income or Expense Side)</p>
                            <Select value={cashCategory} onValueChange={setCashCategory}>
                                <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50">
                                    <SelectValue placeholder="Where did this money come from / go to?" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ledgers.map(l => (
                                        <SelectItem key={l._id} value={l._id}>{l.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 sm:flex-row flex-col">
                        <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleSaveEntry} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-accent text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-accent/30">Save Entry</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Journal Voucher Modal */}
            <Dialog open={showJournalModal} onOpenChange={setShowJournalModal}>
                <DialogContent className="max-w-md rounded-[40px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight text-center">New Voucher</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1 text-center">Record a non-cash accounting entry</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Voucher Date</p>
                            <Input type="date" value={jvDate} onChange={(e) => setJvDate(e.target.value)} required className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
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
                            <Input type="number" value={jvAmount} onChange={(e) => setJvAmount(e.target.value)} placeholder="0.00" min="0.01" required className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Narration</p>
                            <Input value={jvNarration} onChange={(e) => setJvNarration(e.target.value)} placeholder="Reason..." required className="h-12 rounded-2xl border-gray-100 bg-gray-50/50" />
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
                            <Select value={ledgerGroup} onValueChange={(val) => setLedgerGroup(val as Ledger["group"])}>
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
                                <Select value={openingBalanceType} onValueChange={(val) => setOpeningBalanceType(val as Ledger["openingBalanceType"])}>
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
            <ReportDownloadModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                title={`Export ${activeTab.toUpperCase()} Ledger`}
                description="Select date range (Daily, Weekly, Monthly, Yearly, All or Custom) to export ledger entries."
                onGenerate={handleGenerateReport}
            />
        </div>
    );
};

export default Finance;
