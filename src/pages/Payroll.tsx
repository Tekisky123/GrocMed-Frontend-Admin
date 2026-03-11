import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
    Download, FileText, CheckCircle2, Shield, Plus,
} from "lucide-react";
import { accountingApi } from "@/api/accountingApi";
import { downloadPayslipPDF } from "@/utils/exportPayslipPdfUtils";

type PayrollView = "employees" | "processing" | "compliance";

const Payroll = () => {
    const [view, setView] = useState<PayrollView>("employees");
    const [month, setMonth] = useState(() => {
        const d = new Date();
        return `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    });
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [showSlip, setShowSlip] = useState(false);
    const [showAddEmployee, setShowAddEmployee] = useState(false);

    // Dynamic State
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessed, setIsProcessed] = useState(false);

    // Add Employee Form State
    const [empId, setEmpId] = useState("");
    const [empName, setEmpName] = useState("");
    const [designation, setDesignation] = useState("");
    const [department, setDepartment] = useState("");
    const [basic, setBasic] = useState("");
    const [hra, setHra] = useState("");
    const [allowances, setAllowances] = useState("");
    const [tds, setTds] = useState("0");
    const [pf, setPf] = useState("0");
    const [esic, setEsic] = useState("0");

    const fetchData = async () => {
        setLoading(true);
        try {
            // Check if slips exist for this month
            const slipRes = await accountingApi.getSalarySlips(month);

            if (slipRes?.data && slipRes.data.length > 0) {
                // Payroll already processed for this month
                setEmployees(slipRes.data);
                setIsProcessed(slipRes.data.every((s: any) => s.status === "Posted" || s.status === "Generated" || s.status === "Paid"));
            } else {
                // Not processed. Fetch Master Employees to show the pending register.
                const empRes = await accountingApi.getEmployees();
                const activeEmployees = (empRes?.data || []).map((e: any) => {
                    const gross = e.basicSalary + e.hra + e.otherAllowances;
                    const totalDed = e.deductions.tds + e.deductions.pf + e.deductions.esic;
                    return { ...e, grossSalary: gross, netSalary: gross - totalDed, status: "Pending" };
                });
                setEmployees(activeEmployees);
                setIsProcessed(false);
            }
        } catch (error) {
            console.error("Failed to load payroll data", error);
            toast.error("Failed to load payroll data");
            setEmployees([]);
            setIsProcessed(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [month]);

    const handleAddEmployee = async () => {
        if (!empId || !empName || !designation || !department || !basic || !hra) {
            return toast.error("Please fill all required basic fields.");
        }
        toast.loading("Adding employee...", { id: "add-emp" });
        try {
            await accountingApi.createEmployee({
                employeeId: empId,
                employeeName: empName,
                designation,
                department,
                basicSalary: Number(basic),
                hra: Number(hra),
                otherAllowances: Number(allowances || 0),
                deductions: {
                    tds: Number(tds || 0),
                    pf: Number(pf || 0),
                    esic: Number(esic || 0)
                }
            });
            toast.success("Employee added successfully!", { id: "add-emp" });
            setShowAddEmployee(false);
            // Reset form
            setEmpId(""); setEmpName(""); setDesignation(""); setDepartment("");
            setBasic(""); setHra(""); setAllowances(""); setTds("0"); setPf("0"); setEsic("0");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add employee", { id: "add-emp" });
        }
    };

    const handleProcessPayroll = async () => {
        if (employees.length === 0) return toast.error("No employees found to process!");

        toast.loading(`Processing payroll for ${month}...`, { id: "payroll-proc" });
        try {
            // Transform Master Employee records to Slip payload format
            const slips = employees.map(e => ({
                employeeId: e.employeeId,
                employeeName: e.employeeName,
                designation: e.designation,
                department: e.department,
                monthYear: month,
                earnings: {
                    basic: e.basicSalary || e.earnings?.basic,
                    hra: e.hra || e.earnings?.hra,
                    allowances: e.otherAllowances || e.earnings?.allowances,
                    grossPay: e.grossSalary || e.earnings?.grossPay,
                },
                deductions: {
                    tds: e.deductions?.tds,
                    pf: e.deductions?.pf,
                    esic: e.deductions?.esic,
                    totalDeductions: e.deductions?.tds + e.deductions?.pf + e.deductions?.esic
                },
                netPay: e.netSalary || e.netPay,
                status: 'Generated'
            }));

            await accountingApi.processPayroll({ monthYear: month, slips });
            toast.success("Payroll processed & salary credits initiated! Journal entry posted.", { id: "payroll-proc" });
            fetchData(); // Refresh to get processed status
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to process payroll", { id: "payroll-proc" });
        }
    };

    const handleViewSlip = (emp: any) => {
        setSelectedEmployee(emp);
        setShowSlip(true);
    };

    const handlePayNow = (taskName: string) => {
        toast.loading(`Processing payment for ${taskName}...`, { id: `pay-${taskName}` });
        setTimeout(() => toast.success(`Payment initiated!`, { id: `pay-${taskName}`, description: "Will reflect in bank within 2 hours." }), 1500);
    };

    const totalGross = employees.reduce((a, e) => a + (e.grossSalary || e.earnings?.grossPay || 0), 0);
    const totalNet = employees.reduce((a, e) => a + (e.netSalary || e.netPay || 0), 0);
    const totalPF = employees.reduce((a, e) => a + (e.deductions?.pf || 0), 0);
    const totalTDS = employees.reduce((a, e) => a + (e.deductions?.tds || 0), 0);
    const totalESIC = employees.reduce((a, e) => a + (e.deductions?.esic || 0), 0);

    const compliance = [
        { task: "PF Challan", dueDate: "15th of next month", status: "Pending", amount: totalPF },
        { task: "ESIC Contribution", dueDate: "15th of next month", status: "Pending", amount: totalESIC },
        { task: "TDS Deposit", dueDate: "7th of next month", status: "Pending", amount: totalTDS },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Payroll</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Salary Register, TDS & Statutory Compliance</p>
                </div>
                <div className="flex gap-3">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="h-11 w-44 rounded-2xl border-gray-200 text-sm bg-white">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="03-2026">March 2026</SelectItem>
                            <SelectItem value="02-2026">February 2026</SelectItem>
                            <SelectItem value="01-2026">January 2026</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        onClick={() => setShowAddEmployee(true)}
                        className="h-11 px-5 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest gap-2 bg-white text-gray-700 hover:bg-gray-50"
                        variant="outline"
                    >
                        <Plus className="w-4 h-4" /> New Employee
                    </Button>
                    <Button
                        onClick={handleProcessPayroll}
                        disabled={isProcessed || loading || employees.length === 0}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-violet-500/30 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> {isProcessed ? "Already Processed" : "Run Payroll"}
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Gross Payroll", value: `₹${(totalGross / 1000).toFixed(1)}k`, color: "from-violet-500 to-violet-600", bg: "from-violet-50", ring: "ring-violet-100" },
                    { label: "Net Disbursement", value: `₹${(totalNet / 1000).toFixed(1)}k`, color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                    { label: "PF Contribution", value: `₹${totalPF.toLocaleString()}`, color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "TDS Deducted", value: `₹${totalTDS.toLocaleString()}`, color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                ].map(({ label, value, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["employees", "Salary Register"], ["processing", "Salary Slips"], ["compliance", "Compliance"]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setView(key)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${view === key ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Salary Register */}
            {view === "employees" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-gray-900">Salary Register — {month}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{employees.length} employees</p>
                        </div>
                        {isProcessed ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 px-3 py-1.5 rounded-xl text-xs font-semibold">Processed ✓</Badge>
                        ) : employees.length === 0 ? (
                            <Badge className="bg-gray-50 text-gray-700 border-gray-200 px-3 py-1.5 rounded-xl text-xs font-semibold">No Employees Found</Badge>
                        ) : (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1.5 rounded-xl text-xs font-semibold">Pending Processing</Badge>
                        )}
                    </div>
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["Emp ID", "Name", "Designation", "Basic", "HRA", "Allowances", "Gross", "TDS", "PF (12%)", "ESIC", "Net Pay"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={11} className="text-center py-8 text-gray-400">Loading payroll data...</td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan={11} className="text-center py-8 text-gray-400">No employees available. Click "New Employee" to add staff.</td></tr>
                                ) : employees.map((e, idx) => {
                                    const basic = e.basicSalary || e.earnings?.basic || 0;
                                    const hra = e.hra || e.earnings?.hra || 0;
                                    const allowances = e.otherAllowances || e.earnings?.allowances || 0;
                                    const gross = e.grossSalary || e.earnings?.grossPay || 0;
                                    const net = e.netSalary || e.netPay || 0;

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">{e.employeeId}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-violet-700 font-bold text-xs border border-violet-100 flex-shrink-0">
                                                        {e.employeeName?.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{e.employeeName}</p>
                                                        <p className="text-xs text-gray-400">{e.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-gray-600">{e.designation}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">₹{basic.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">₹{hra.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-gray-700">₹{allowances.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{gross.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-red-500">-₹{e.deductions?.tds || 0}</td>
                                            <td className="px-5 py-4 text-sm text-red-500">-₹{(e.deductions?.pf || 0).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm text-red-500">-₹{e.deductions?.esic || 0}</td>
                                            <td className="px-5 py-4 text-sm font-black text-gray-900">₹{net.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            {employees.length > 0 && (
                                <tfoot>
                                    <tr className="bg-gray-50/50 border-t border-gray-100">
                                        <td colSpan={6} className="px-5 py-4 text-sm font-black text-gray-900 uppercase">Totals</td>
                                        <td className="px-5 py-4 text-sm font-black text-gray-900">₹{totalGross.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-red-500">-₹{totalTDS.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-red-500">-₹{totalPF.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-red-500">-₹{totalESIC.toLocaleString()}</td>
                                        <td className="px-5 py-4 text-sm font-black text-violet-600">₹{totalNet.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </Card>
            )}

            {/* Salary Slips */}
            {view === "processing" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {loading ? (
                        <div className="col-span-full text-center py-8 text-gray-400">Loading slips...</div>
                    ) : employees.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-400">No slips available yet.</div>
                    ) : employees.map((e, idx) => {
                        const gross = e.grossSalary || e.earnings?.grossPay || 0;
                        const net = e.netSalary || e.netPay || 0;

                        return (
                            <Card key={idx} className="p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 hover:shadow-md transition-all">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-violet-700 font-black text-lg border border-violet-100 flex-shrink-0">
                                        {e.employeeName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">{e.employeeName}</p>
                                        <p className="text-xs text-gray-400">{e.designation}</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Gross Pay</span>
                                        <span className="text-xs font-semibold text-gray-900">₹{gross.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Total Deductions</span>
                                        <span className="text-xs font-semibold text-red-500">-₹{((e.deductions?.tds || 0) + (e.deductions?.pf || 0) + (e.deductions?.esic || 0)).toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-2 flex justify-between">
                                        <span className="text-xs font-bold text-gray-900">Net Pay</span>
                                        <span className="text-sm font-black text-violet-600">₹{net.toLocaleString()}</span>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => handleViewSlip(e)} className="w-full h-9 rounded-xl text-xs font-normal gap-1.5 border-violet-100 text-violet-600 hover:bg-violet-50">
                                    <FileText className="w-3.5 h-3.5" /> View Salary Slip
                                </Button>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Compliance */}
            {view === "compliance" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50">
                        <h3 className="font-black text-gray-900">Statutory Compliance Tracker</h3>
                        <p className="text-xs text-gray-400 mt-0.5">PF, ESIC, TDS filing deadlines</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {compliance.map((c, i) => (
                            <div key={i} className="flex items-center justify-between px-6 py-5 hover:bg-gray-50/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isProcessed ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                                        {isProcessed ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{c.task} — {month}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Due: {c.dueDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-sm font-bold text-gray-900">
                                        ₹{c.amount.toLocaleString()}
                                    </p>
                                    <Badge className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${isProcessed ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                                        {isProcessed ? "Ready to Pay" : "Pending Payroll"}
                                    </Badge>
                                    {isProcessed && (
                                        <Button size="sm" onClick={() => handlePayNow(c.task)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white text-xs font-normal">Pay Now</Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Salary Slip Modal */}
            {selectedEmployee && (
                <Dialog open={showSlip} onOpenChange={setShowSlip}>
                    <DialogContent className="max-w-md rounded-[32px] p-0 border-none shadow-2xl overflow-hidden">
                        <DialogHeader className="hidden">
                            <DialogTitle>Salary Slip</DialogTitle>
                        </DialogHeader>
                        <div className="bg-gradient-to-r from-violet-500 to-violet-600 px-8 pt-8 pb-6 text-white">
                            <h2 className="text-xl font-black text-white">Salary Slip</h2>
                            <p className="text-violet-200 text-sm mt-1">{selectedEmployee.employeeName} — {month}</p>
                            <p className="text-violet-200 text-xs mt-0.5">{selectedEmployee.designation} · {selectedEmployee.department}</p>
                            <Badge className={`mt-2 ${selectedEmployee.status === "Generated" || selectedEmployee.status === "Posted" ? "bg-green-500/20 text-green-100" : "bg-white/20 text-white"} border-white/10`}>
                                {selectedEmployee.status}
                            </Badge>
                        </div>
                        <div className="p-8 space-y-3">
                            {[
                                { label: "Basic Salary", value: selectedEmployee.basicSalary || selectedEmployee.earnings?.basic, positive: true },
                                { label: "HRA", value: selectedEmployee.hra || selectedEmployee.earnings?.hra, positive: true },
                                { label: "Other Allowances", value: selectedEmployee.otherAllowances || selectedEmployee.earnings?.allowances, positive: true },
                                { label: "Gross Pay", value: selectedEmployee.grossSalary || selectedEmployee.earnings?.grossPay, positive: true, total: true },
                                { label: "TDS Deduction", value: -(selectedEmployee.deductions?.tds || 0), positive: false },
                                { label: "PF (12%)", value: -(selectedEmployee.deductions?.pf || 0), positive: false },
                                { label: "ESIC (0.75%)", value: -(selectedEmployee.deductions?.esic || 0), positive: false },
                            ].map(({ label, value, positive, total }) => (
                                <div key={label} className={`flex justify-between items-center py-2 ${total ? "border-t border-gray-200 pt-3" : ""}`}>
                                    <span className={`text-sm ${total ? "font-bold text-gray-900" : "text-gray-600"}`}>{label}</span>
                                    <span className={`text-sm font-bold ${total ? "text-gray-900" : positive ? "text-green-600" : "text-red-500"}`}>
                                        {value < 0 ? "-" : "+"}₹{Math.abs(value).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                            <div className="bg-violet-50 border border-violet-100 rounded-2xl p-4 flex justify-between items-center mt-2">
                                <span className="font-black text-gray-900 uppercase tracking-wider text-sm">Net Pay</span>
                                <span className="text-2xl font-black text-violet-600">₹{(selectedEmployee.netSalary || selectedEmployee.netPay).toLocaleString()}</span>
                            </div>
                        </div>
                        <DialogFooter className="px-8 pb-8">
                            <Button
                                onClick={() => {
                                    try {
                                        downloadPayslipPDF(selectedEmployee, month);
                                        toast.success("Payslip PDF downloaded successfully!");
                                    } catch (err) {
                                        console.error(err);
                                        toast.error("Failed to generate PDF");
                                    }
                                }}
                                className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-normal text-xs uppercase tracking-widest"
                            >
                                <Download className="w-4 h-4 mr-2" /> Download PDF
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Add Employee Modal */}
            <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-gray-900">Add Employee</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-1">Register staff to process their payroll.</p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Emp ID *</p>
                                <Input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="EMP001" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Full Name *</p>
                                <Input value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Name" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Designation *</p>
                                <Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. Accountant" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Department *</p>
                                <Select value={department} onValueChange={setDepartment}>
                                    <SelectTrigger className="h-11 rounded-2xl border-gray-100 bg-gray-50/50">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Operations">Operations</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Technology">Technology</SelectItem>
                                        <SelectItem value="Logistics">Logistics</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <hr className="border-gray-100 !my-6" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Basic Salary *</p>
                                <Input type="number" value={basic} onChange={e => setBasic(e.target.value)} placeholder="₹" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">HRA *</p>
                                <Input type="number" value={hra} onChange={e => setHra(e.target.value)} placeholder="₹" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Other Allowances</p>
                            <Input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} placeholder="0" className="h-11 rounded-2xl border-gray-100 bg-gray-50/50" />
                        </div>

                        <hr className="border-gray-100 !my-6" />

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">TDS</p>
                                <Input type="number" value={tds} onChange={e => setTds(e.target.value)} className="h-11 rounded-2xl border-gray-100 bg-gray-50/50 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">PF</p>
                                <Input type="number" value={pf} onChange={e => setPf(e.target.value)} className="h-11 rounded-2xl border-gray-100 bg-gray-50/50 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">ESIC</p>
                                <Input type="number" value={esic} onChange={e => setEsic(e.target.value)} className="h-11 rounded-2xl border-gray-100 bg-gray-50/50 text-red-500" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="outline" onClick={() => setShowAddEmployee(false)} className="flex-1 h-12 rounded-2xl border-gray-100 font-normal text-xs uppercase tracking-widest">Cancel</Button>
                        <Button onClick={handleAddEmployee} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-normal text-xs uppercase tracking-widest">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Payroll;
