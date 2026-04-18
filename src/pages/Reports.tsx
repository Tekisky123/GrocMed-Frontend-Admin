import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    BarChart3, Download, TrendingUp, TrendingDown, Scale, FileText, ArrowRight, XCircle, Info
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { exportToCSV } from "@/utils/exportUtils";

// Helper to get dates from period selection
const getDatesForPeriod = (period: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const isPastMarch = today.getMonth() >= 3;

    // FY starts April 1, ends March 31
    if (period === "fy-current") {
        const startYear = isPastMarch ? currentYear : currentYear - 1;
        return {
            startDate: new Date(startYear, 3, 1).toISOString(),
            endDate: new Date(startYear + 1, 2, 31).toISOString(),
        };
    } else if (period === "fy-previous") {
        const startYear = isPastMarch ? currentYear - 1 : currentYear - 2;
        return {
            startDate: new Date(startYear, 3, 1).toISOString(),
            endDate: new Date(startYear + 1, 2, 31).toISOString(),
        };
    } else if (period === "q-current") {
        const qStartMonth = Math.floor(today.getMonth() / 3) * 3;
        const startDate = new Date(currentYear, qStartMonth, 1);
        const endDate = new Date(currentYear, qStartMonth + 3, 0);
        return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
    }

    // Default to current FY
    const startYear = isPastMarch ? currentYear : currentYear - 1;
    return {
        startDate: new Date(startYear, 3, 1).toISOString(),
        endDate: new Date(startYear + 1, 2, 31).toISOString(),
    };
};

type ReportView = "pl" | "balance" | "cashflow" | "trial";

const Reports = () => {
    const [view, setView] = useState<ReportView>("pl");
    const [period, setPeriod] = useState("fy-current");

    // API Data state
    const [pnlData, setPnlData] = useState<any>(null);
    const [tbData, setTbData] = useState<any>(null);
    const [bsData, setBsData] = useState<any>(null);
    const [cfData, setCfData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDatesForPeriod(period);
            const [pnlRes, tbRes, bsRes, cfRes] = await Promise.all([
                accountingApi.getPnL(startDate, endDate),
                accountingApi.getTrialBalance(startDate, endDate),
                accountingApi.getBalanceSheet(startDate, endDate),
                accountingApi.getCashFlow(startDate, endDate)
            ]);

            setPnlData(pnlRes.data);
            setTbData(tbRes.data);
            setBsData(bsRes.data);
            setCfData(cfRes.data);
        } catch (error) {
            console.error("Error fetching reports", error);
            toast.error("Failed to generate financial reports");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [period]);

    const EmptyState = ({ message }: { message: string }) => (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-5 ring-8 ring-gray-100/50">
                <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg">{message}</p>
            <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto">Try adjusting your filters or date range to find the records you're looking for.</p>
        </div>
    );

    const handleExportCSV = () => {
        toast.loading(`Extracting ${view.toUpperCase()} data...`, { id: "report-csv" });

        let dataToExport: any[] = [];
        const timestamp = new Date().toISOString().split('T')[0];
        let filename = `Report_${view.toUpperCase()}_${timestamp}`;

        if (view === "pl") {
            dataToExport.push({ Category: "REVENUE AND INCOME", Amount: "" });
            (pnlData?.income || []).forEach((i: any) => dataToExport.push({ Category: `  ${i.ledger}`, Amount: i.amount }));
            dataToExport.push({ Category: "TOTAL REVENUE (A)", Amount: totalRevenue });
            dataToExport.push({ Category: "", Amount: "" });

            dataToExport.push({ Category: "COST OF GOODS SOLD", Amount: "" });
            (pnlData?.cogs || []).forEach((c: any) => dataToExport.push({ Category: `  ${c.ledger}`, Amount: i.amount }));
            dataToExport.push({ Category: "GROSS PROFIT", Amount: grossProfit });
            dataToExport.push({ Category: "", Amount: "" });

            dataToExport.push({ Category: "OPERATING EXPENSES", Amount: "" });
            (pnlData?.expenses || []).forEach((e: any) => dataToExport.push({ Category: `  ${e.ledger}`, Amount: e.amount }));
            dataToExport.push({ Category: "TOTAL EXPENSES (B)", Amount: totalOpex });
            dataToExport.push({ Category: "", Amount: "" });

            dataToExport.push({ Category: "NET PROFIT / LOSS", Amount: totalProfit });

        } else if (view === "balance") {
            dataToExport.push({ Category: "ASSETS", Amount: "" });
            (bsData?.assets || []).forEach((a: any) => dataToExport.push({ Category: `  ${a.ledger}`, Amount: a.amount }));
            dataToExport.push({ Category: "TOTAL ASSETS", Amount: bsData?.totalAssets || 0 });
            dataToExport.push({ Category: "", Amount: "" });

            dataToExport.push({ Category: "LIABILITIES", Amount: "" });
            (bsData?.liabilities || []).forEach((l: any) => dataToExport.push({ Category: `  ${l.ledger}`, Amount: l.amount }));
            dataToExport.push({ Category: "", Amount: "" });

            dataToExport.push({ Category: "EQUITY", Amount: "" });
            (bsData?.equity || []).forEach((e: any) => dataToExport.push({ Category: `  ${e.ledger}`, Amount: e.amount }));
            dataToExport.push({ Category: "TOTAL LIABILITIES & EQUITY", Amount: bsData?.totalLiabilitiesAndEquity || 0 });

        } else if (view === "trial") {
            dataToExport = (tbData?.records || []).map((l: any) => ({
                "Account Name": l.ledgerName,
                "Group": l.group,
                "Debit Balance": l.debit || 0,
                "Credit Balance": l.credit || 0
            }));
            dataToExport.push({ "Account Name": "TOTALS", Group: "", "Debit Balance": tbData?.totalDebit || 0, "Credit Balance": tbData?.totalCredit || 0 });

        } else if (view === "cashflow") {
            dataToExport = [
                { Activity: "Operating Activities", Amount: cfData?.operatingActivities || 0 },
                { Activity: "Investing Activities", Amount: cfData?.investingActivities || 0 },
                { Activity: "Financing Activities", Amount: cfData?.financingActivities || 0 },
                { Activity: "Net Cash Flow", Amount: cfData?.netCashFlow || 0 }
            ];
        }

        exportToCSV(dataToExport, filename);
        toast.success("Report CSV ready for download!", { id: "report-csv" });
    };

    const tabs: [ReportView, string][] = [
        ["pl", "Profit & Loss"],
        ["balance", "Balance Sheet"],
        ["cashflow", "Cash Flow"],
        ["trial", "Trial Balance"],
    ];

    // Safe fallbacks for PnL
    const totalRevenue = pnlData?.revenueTotal || 0;
    const totalCOGS = pnlData?.cogsTotal || 0;
    const totalOpex = pnlData?.expensesTotal || 0;
    const totalProfit = pnlData?.netProfit || 0;
    const grossProfit = pnlData?.grossProfit || 0;

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Financial Reports</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">P&L, Balance Sheet, Cash Flow & Trial Balance dynamically generated.</p>
                </div>
                <div className="flex gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="h-11 w-48 rounded-2xl border-gray-200 text-sm bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fy-current">Current Financial Year</SelectItem>
                            <SelectItem value="fy-previous">Previous Financial Year</SelectItem>
                            <SelectItem value="q-current">Current Quarter</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleExportCSV} className="h-11 px-5 rounded-2xl bg-gradient-to-r from-primary to-green-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-primary/30 gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Educational Info Banner */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">
                        {view === "pl" && "Profit & Loss (Income Statement)"}
                        {view === "balance" && "Balance Sheet (Financial Position)"}
                        {view === "cashflow" && "Statement of Cash Flows"}
                        {view === "trial" && "Trial Balance (Audit Checklist)"}
                    </p>
                    <p className="text-xs text-blue-700/80 mt-1 leading-relaxed max-w-3xl">
                        {view === "pl" && "Summarizes your revenues, costs, and expenses over the selected period. It shows the net result of your business operations: Profit or Loss."}
                        {view === "balance" && "A snapshot of what your business owns (Assets), what it owes (Liabilities), and the owners' stake (Equity) at a specific point in time."}
                        {view === "cashflow" && "Tracks the actual cash moving in and out of your business across Operating, Investing, and Financing activities. Essential for liquidity tracking."}
                        {view === "trial" && "A bookkeeping worksheet where the balances of all ledgers are compiled into debit and credit columns. It ensures that the accounting system is in balance."}
                    </p>
                </div>
            </div>

            {/* KPI Story Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Revenue", value: `₹${(totalRevenue).toLocaleString()}`, color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                    { label: "Gross Profit", value: `₹${(grossProfit).toLocaleString()}`, color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "Operating Expenses", value: `₹${(totalOpex).toLocaleString()}`, color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                    { label: "Net Profit", value: `₹${(totalProfit).toLocaleString()}`, color: "from-violet-500 to-violet-600", bg: "from-violet-50", ring: "ring-violet-100" },
                ].map(({ label, value, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1 relative overflow-hidden`}>
                        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center animate-pulse" />}
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent truncate`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {tabs.map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setView(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${view === key ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-3xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary">
                    <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900">
                        {view === 'pl' && "Profit & Loss Account"}
                        {view === 'balance' && "Balance Sheet"}
                        {view === 'cashflow' && "Cash Flow Statement"}
                        {view === 'trial' && "Trial Balance"}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {view === 'pl' && "This report shows your income and expenses. It answers the most important question: Are you making a profit?"}
                        {view === 'balance' && "A snapshot of what your business owns (Assets) versus what it owes (Liabilities) as of today."}
                        {view === 'cashflow' && "Shows where your cash is coming from and where it's going. Essential for tracking your actual spending power."}
                        {view === 'trial' && "An internal accounting check to ensure all your Bookkeeping entries are mathematically correct and balanced."}
                    </p>
                </div>
            </div>

            {loading && (
                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-primary animate-spin mb-4" />
                    <p>Crunching the numbers...</p>
                </div>
            )}

            {!loading && (
                <>
                    {/* P&L View */}
                    {view === "pl" && pnlData && (
                        <div className="space-y-6">
                            {/* P&L Statement */}
                            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-50">
                                    <h3 className="font-black text-gray-900">Profit & Loss Statement</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Based on selected period.</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    <div className="px-6 py-2.5 bg-gray-50/50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Income / Revenue</p>
                                    </div>
                                    {(!pnlData.income || pnlData.income.length === 0) ? (
                                        <EmptyState message="No revenue recorded for this period" />
                                    ) : pnlData.income.map((i: any) => (
                                        <div key={i.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{i.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{(i.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center px-6 py-3.5 bg-blue-50/30">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-wide">TOTAL REVENUE (A)</span>
                                        <span className="text-sm font-black text-gray-900">₹{totalRevenue.toLocaleString()}</span>
                                    </div>

                                    <div className="px-6 py-2.5 bg-gray-50/50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cost of Goods Sold (COGS)</p>
                                    </div>
                                    {(pnlData.cogs && pnlData.cogs.length > 0) ? pnlData.cogs.map((c: any) => (
                                        <div key={c.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{c.ledger}</span>
                                            <span className="text-sm font-semibold text-red-500">-₹{(c.amount || 0).toLocaleString()}</span>
                                        </div>
                                    )) : (
                                        <div className="px-12 py-4 text-xs text-gray-400 font-normal italic">No direct COGS entries found.</div>
                                    )}
                                    <div className="flex justify-between items-center px-6 py-3.5 bg-blue-50/30">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-wide">GROSS PROFIT (A - COGS)</span>
                                        <span className="text-sm font-black text-gray-900">₹{grossProfit.toLocaleString()}</span>
                                    </div>

                                    <div className="px-6 py-2.5 bg-gray-50/50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Operating Expenses</p>
                                    </div>
                                    {(pnlData.expenses && pnlData.expenses.length > 0) ? pnlData.expenses.map((e: any) => (
                                        <div key={e.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{e.ledger}</span>
                                            <span className="text-sm font-semibold text-red-500">-₹{(e.amount || 0).toLocaleString()}</span>
                                        </div>
                                    )) : (
                                        <div className="px-12 py-4 text-xs text-gray-400 font-normal italic">No operating expenses recorded.</div>
                                    )}

                                    <div className="flex justify-between items-center px-6 py-5 bg-green-50/50">
                                        <span className="text-sm font-black text-primary uppercase">NET PROFIT / LOSS</span>
                                        <span className={`text-lg font-black ${totalProfit >= 0 ? "text-primary" : "text-red-500"}`}>
                                            ₹{totalProfit.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Balance Sheet */}
                    {view === "balance" && bsData && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Assets */}
                            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-blue-50 to-white">
                                    <h3 className="font-black text-gray-900">Assets</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Debit balances</p>
                                </div>
                                <div className="divide-y divide-gray-50">
                                    {(!bsData.assets || bsData.assets.length === 0) ? (
                                        <EmptyState message="No Assets recorded" />
                                    ) : bsData.assets.map((a: any) => (
                                        <div key={a.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-3">{a.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{(a.amount || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between px-6 py-4 bg-blue-50/50 mt-auto">
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Assets</span>
                                        <span className="text-lg font-black text-blue-600">₹{(bsData.totalAssets || 0).toLocaleString()}</span>
                                    </div>
                                </div>
                            </Card>

                            {/* Liabilities & Equity */}
                            <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden flex flex-col">
                                <div className="px-6 py-5 border-b border-gray-50 bg-gradient-to-r from-green-50 to-white">
                                    <h3 className="font-black text-gray-900">Liabilities & Equity</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Credit balances</p>
                                </div>
                                <div className="divide-y divide-gray-50 flex-1">
                                    {(!bsData.liabilities?.length && !bsData.equity?.length) ? (
                                        <EmptyState message="No Liabilities or Equity recorded" />
                                    ) : (
                                        <>
                                            {bsData.liabilities?.map((l: any) => (
                                                <div key={l.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                                    <span className="text-sm text-gray-700 pl-3">{l.ledger}</span>
                                                    <span className="text-sm font-semibold text-gray-900">₹{(l.amount || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                            {bsData.equity?.map((e: any) => (
                                                <div key={e.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                                    <span className="text-sm text-gray-700 pl-3">{e.ledger}</span>
                                                    <span className="text-sm font-semibold text-gray-900">₹{(e.amount || 0).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                                <div className="flex justify-between px-6 py-4 bg-green-50/50 mt-auto">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Total Liab. & Equity</span>
                                    <span className="text-lg font-black text-green-600">₹{(bsData.totalLiabilitiesAndEquity || 0).toLocaleString()}</span>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Cash Flow */}
                    {view === "cashflow" && cfData && (
                        <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-gray-900">Cash Flow Statement</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Approximate Direct & Indirect analysis.</p>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                <div className="px-6 py-2.5 bg-gray-50/50">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Operating Activities</p>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/20">
                                    <span className="text-sm font-semibold text-gray-700 pl-6">Net Cash from Operating Activities</span>
                                    <span className={`text-sm font-bold ${(cfData.operatingActivities || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {(cfData.operatingActivities || 0) >= 0 ? '+' : ''}₹{(cfData.operatingActivities || 0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="px-6 py-2.5 bg-gray-50/50">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Investing Activities</p>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/20">
                                    <span className="text-sm font-semibold text-gray-700 pl-6">Net Cash from Investing Activities</span>
                                    <span className={`text-sm font-bold ${(cfData.investingActivities || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {(cfData.investingActivities || 0) >= 0 ? '+' : ''}₹{(cfData.investingActivities || 0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="px-6 py-2.5 bg-gray-50/50">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Financing Activities</p>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/20">
                                    <span className="text-sm font-semibold text-gray-700 pl-6">Net Cash from Financing Activities</span>
                                    <span className={`text-sm font-bold ${(cfData.financingActivities || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {(cfData.financingActivities || 0) >= 0 ? '+' : ''}₹{(cfData.financingActivities || 0).toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-t-2 border-blue-100">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Net Change in Cash</span>
                                    <span className={`text-lg font-black ${(cfData.netCashFlow || 0) >= 0 ? "text-blue-600" : "text-red-500"}`}>
                                        {(cfData.netCashFlow || 0) >= 0 ? '+' : ''}₹{(cfData.netCashFlow || 0).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Trial Balance */}
                    {view === "trial" && tbData && (
                        <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-gray-900">Trial Balance</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Dynamic calculation based on selected period.</p>
                                </div>
                                {tbData.isBalanced ? (
                                    <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5 rounded-xl font-semibold text-xs">Balanced ✓</Badge>
                                ) : (
                                    <Badge className="bg-red-50 text-red-700 border-red-200 px-3 py-1.5 rounded-xl font-semibold text-xs">Unbalanced ✗</Badge>
                                )}
                            </div>
                            <div className="rtable-wrap">
                                <table className="rtable">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-50">
                                            {["Account Name", "Group", "Debit (₹)", "Credit (₹)"].map(h => (
                                                <th key={h} className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {(!tbData.records || tbData.records.length === 0) ? (
                                            <tr>
                                                <td colSpan={4}><EmptyState message="The Trial Balance is currently empty" /></td>
                                            </tr>
                                        ) : tbData.records.map((row: any) => (
                                            <tr key={row.ledgerId} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-3.5 text-sm font-medium text-gray-800">{row.ledgerName}</td>
                                                <td className="px-6 py-3.5 text-xs text-gray-500">{row.group}</td>
                                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "—"}</td>
                                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {tbData.records && tbData.records.length > 0 && (
                                        <tfoot>
                                            <tr className={`bg-gray-50/50 border-t-2 ${tbData.isBalanced ? 'border-green-200' : 'border-red-200'}`}>
                                                <td colSpan={2} className="px-6 py-4 text-sm font-black text-gray-900 uppercase tracking-widest">TOTALS</td>
                                                <td className={`px-6 py-4 text-sm font-black ${tbData.isBalanced ? 'text-green-700' : 'text-red-600'}`}>₹{(tbData.totalDebit || 0).toLocaleString()}</td>
                                                <td className={`px-6 py-4 text-sm font-black ${tbData.isBalanced ? 'text-green-700' : 'text-red-600'}`}>₹{(tbData.totalCredit || 0).toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
