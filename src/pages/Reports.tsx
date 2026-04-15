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
    BarChart3, Download, TrendingUp, TrendingDown, Scale, FileText, ArrowRight, XCircle
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

    const handleExportCSV = () => {
        toast.loading(`Extracting ${view.toUpperCase()} data...`, { id: "report-csv" });

        let dataToExport: any[] = [];
        if (view === "pl") {
            dataToExport = [
                { Category: "Total Revenue", Amount: pnlData?.revenueTotal || 0 },
                { Category: "Cost of Goods Sold", Amount: pnlData?.cogsTotal || 0 },
                { Category: "Gross Profit", Amount: pnlData?.grossProfit || 0 },
                { Category: "Total Expenses", Amount: pnlData?.expensesTotal || 0 },
                { Category: "Net Profit", Amount: pnlData?.netProfit || 0 }
            ];
            if (pnlData?.revenueBreakdown) {
                dataToExport.push({ Category: "--- REVENUE BREAKDOWN ---", Amount: "---" });
                dataToExport = dataToExport.concat(pnlData.revenueBreakdown.map((i: any) => ({ Category: i.item, Amount: i.amount })));
            }
            if (pnlData?.expenseBreakdown) {
                dataToExport.push({ Category: "--- EXPENSE BREAKDOWN ---", Amount: "---" });
                dataToExport = dataToExport.concat(pnlData.expenseBreakdown.map((i: any) => ({ Category: i.item, Amount: i.amount })));
            }
        } else if (view === "balance") {
            dataToExport = [
                { Category: "Total Assets", Amount: bsData?.assetsTotal || 0 },
                { Category: "Current Assets", Amount: bsData?.currentAssets || 0 },
                { Category: "Fixed Assets", Amount: bsData?.fixedAssets || 0 },
                { Category: "Total Liabilities", Amount: bsData?.liabilitiesTotal || 0 },
                { Category: "Current Liabilities", Amount: bsData?.currentLiabilities || 0 },
                { Category: "Long Term Liabilities", Amount: bsData?.longTermLiabilities || 0 },
                { Category: "Total Equity", Amount: bsData?.equityTotal || 0 },
                { Category: "Retained Earnings", Amount: bsData?.retainedEarnings || 0 }
            ];
        } else if (view === "trial") {
            // handle empty data safely
            dataToExport = (tbData || []).map((l: any) => ({
                "Ledger Code": l.code || "—",
                "Ledger Name": l.name,
                "Group": l.group,
                "Debit Balance": l.debit > 0 ? l.debit : "-",
                "Credit Balance": l.credit > 0 ? l.credit : "-"
            }));
        } else if (view === "cashflow") {
            dataToExport = [
                { Category: "Operating Activities", Amount: cfData?.operatingActivities || 0 },
                { Category: "Investing Activities", Amount: cfData?.investingActivities || 0 },
                { Category: "Financing Activities", Amount: cfData?.financingActivities || 0 },
                { Category: "Net Cash Flow", Amount: cfData?.netCashFlow || 0 }
            ];
        }

        exportToCSV(dataToExport, `Financial_Report_${view}_${period}`);
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
                                    {pnlData.income?.map((i: any) => (
                                        <div key={i.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{i.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{i.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center px-6 py-3.5 bg-blue-50/30">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-wide">TOTAL REVENUE (A)</span>
                                        <span className="text-sm font-black text-gray-900">₹{totalRevenue.toLocaleString()}</span>
                                    </div>

                                    <div className="px-6 py-2.5 bg-gray-50/50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Cost of Goods Sold (COGS)</p>
                                    </div>
                                    {pnlData.cogs?.map((c: any) => (
                                        <div key={c.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{c.ledger}</span>
                                            <span className="text-sm font-semibold text-red-500">-₹{c.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center px-6 py-3.5 bg-blue-50/30">
                                        <span className="text-xs font-black text-gray-900 uppercase tracking-wide">GROSS PROFIT (A - COGS)</span>
                                        <span className="text-sm font-black text-gray-900">₹{grossProfit.toLocaleString()}</span>
                                    </div>

                                    <div className="px-6 py-2.5 bg-gray-50/50">
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Operating Expenses</p>
                                    </div>
                                    {pnlData.expenses?.map((e: any) => (
                                        <div key={e.ledger} className="flex justify-between items-center px-6 py-3.5 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-6">{e.ledger}</span>
                                            <span className="text-sm font-semibold text-red-500">-₹{e.amount.toLocaleString()}</span>
                                        </div>
                                    ))}

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
                                    {bsData.assets?.map((a: any) => (
                                        <div key={a.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-3">{a.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{a.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {(!bsData.assets || bsData.assets.length === 0) && (
                                        <div className="px-6 py-8 text-center text-gray-400 text-sm">No Asset balances found.</div>
                                    )}
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
                                    {bsData.liabilities?.map((l: any) => (
                                        <div key={l.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-3">{l.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{l.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {bsData.equity?.map((e: any) => (
                                        <div key={e.ledger} className="flex justify-between px-6 py-3 hover:bg-gray-50/20">
                                            <span className="text-sm text-gray-700 pl-3">{e.ledger}</span>
                                            <span className="text-sm font-semibold text-gray-900">₹{e.amount.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    {(!bsData.liabilities?.length && !bsData.equity?.length) && (
                                        <div className="px-6 py-8 text-center text-gray-400 text-sm">No Liability or Equity balances found.</div>
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
                                    <span className={`text-sm font-bold ${cfData.operatingActivities >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {cfData.operatingActivities >= 0 ? '+' : ''}₹{cfData.operatingActivities.toLocaleString()}
                                    </span>
                                </div>

                                <div className="px-6 py-2.5 bg-gray-50/50">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Investing Activities</p>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/20">
                                    <span className="text-sm font-semibold text-gray-700 pl-6">Net Cash from Investing Activities</span>
                                    <span className={`text-sm font-bold ${cfData.investingActivities >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {cfData.investingActivities >= 0 ? '+' : ''}₹{cfData.investingActivities.toLocaleString()}
                                    </span>
                                </div>

                                <div className="px-6 py-2.5 bg-gray-50/50">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Financing Activities</p>
                                </div>
                                <div className="flex justify-between items-center px-6 py-4 hover:bg-gray-50/20">
                                    <span className="text-sm font-semibold text-gray-700 pl-6">Net Cash from Financing Activities</span>
                                    <span className={`text-sm font-bold ${cfData.financingActivities >= 0 ? "text-green-600" : "text-red-500"}`}>
                                        {cfData.financingActivities >= 0 ? '+' : ''}₹{cfData.financingActivities.toLocaleString()}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center px-6 py-5 bg-gradient-to-r from-blue-50 to-white border-t-2 border-blue-100">
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-wide">Net Change in Cash</span>
                                    <span className={`text-lg font-black ${cfData.netCashFlow >= 0 ? "text-blue-600" : "text-red-500"}`}>
                                        {cfData.netCashFlow >= 0 ? '+' : ''}₹{cfData.netCashFlow.toLocaleString()}
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
                                        {tbData.records?.map((row: any) => (
                                            <tr key={row.ledgerId} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-6 py-3.5 text-sm font-medium text-gray-800">{row.ledgerName}</td>
                                                <td className="px-6 py-3.5 text-xs text-gray-500">{row.group}</td>
                                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.debit > 0 ? `₹${row.debit.toLocaleString()}` : "—"}</td>
                                                <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">{row.credit > 0 ? `₹${row.credit.toLocaleString()}` : "—"}</td>
                                            </tr>
                                        ))}
                                        {(!tbData.records || tbData.records.length === 0) && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-gray-400">No journal entries found for this period. trial balance empty.</td>
                                            </tr>
                                        )}
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
