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
    Download, FileText, CheckCircle2, Shield, Plus, Building2, CreditCard, Landmark, Info
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
    const [showProcessConfirm, setShowProcessConfirm] = useState(false);

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
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifsc, setIfsc] = useState("");

    const fetchData = async () => {
        setLoading(true);
        try {
            const slipRes = await accountingApi.getSalarySlips(month);
            if (slipRes?.data && slipRes.data.length > 0) {
                setEmployees(slipRes.data);
                setIsProcessed(slipRes.data.every((s: any) => ["Posted", "Generated", "Paid"].includes(s.status)));
            } else {
                const empRes = await accountingApi.getEmployees();
                const activeEmployees = (empRes?.data || []).map((e: any) => {
                    const gross = (e.basicSalary || 0) + (e.hra || 0) + (e.otherAllowances || 0);
                    const totalDed = (e.deductions?.tds || 0) + (e.deductions?.pf || 0) + (e.deductions?.esic || 0);
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
        if (!empId || !empName || !designation || !department || !basic) {
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
                hra: Number(hra || 0),
                otherAllowances: Number(allowances || 0),
                deductions: {
                    tds: Number(tds || 0),
                    pf: Number(pf || 0),
                    esic: Number(esic || 0)
                },
                bankName,
                accountNumber,
                ifsc: ifsc.toUpperCase()
            });
            toast.success("Employee added successfully!", { id: "add-emp" });
            setShowAddEmployee(false);
            setEmpId(""); setEmpName(""); setDesignation(""); setDepartment("");
            setBasic(""); setHra(""); setAllowances(""); setTds("0"); setPf("0"); setEsic("0");
            setBankName(""); setAccountNumber(""); setIfsc("");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to add employee", { id: "add-emp" });
        }
    };

    const handleProcessPayroll = async () => {
        setShowProcessConfirm(false);
        if (employees.length === 0) return toast.error("No employees found to process!");

        toast.loading(`Processing payroll...`, { id: "payroll-proc" });
        try {
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
                    tds: e.deductions?.tds || 0,
                    pf: e.deductions?.pf || 0,
                    esic: e.deductions?.esic || 0,
                    totalDeductions: (e.deductions?.tds || 0) + (e.deductions?.pf || 0) + (e.deductions?.esic || 0)
                },
                netPay: e.netSalary || e.netPay || 0,
                status: 'Generated',
                bankName: e.bankName,
                accountNumber: e.accountNumber,
                ifsc: e.ifsc
            }));

            await accountingApi.processPayroll({ monthYear: month, slips });
            toast.success("Payroll processed and Journal Entry posted!", { id: "payroll-proc" });
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to process payroll", { id: "payroll-proc" });
        }
    };

    const totalGross = employees.reduce((a, e) => a + (e.grossSalary || e.earnings?.grossPay || 0), 0);
    const totalNet = employees.reduce((a, e) => a + (e.netSalary || e.netPay || 0), 0);
    const totalPF = employees.reduce((a, e) => a + (e.deductions?.pf || 0), 0);
    const totalTDS = employees.reduce((a, e) => a + (e.deductions?.tds || 0), 0);
    const totalESIC = employees.reduce((a, e) => a + (e.deductions?.esic || 0), 0);

    const compliance = [
        { task: "PF Contribution", code: "PF", amount: totalPF, dueDate: "15th" },
        { task: "ESIC Contribution", code: "ESIC", amount: totalESIC, dueDate: "15th" },
        { task: "TDS Filing", code: "TDS", amount: totalTDS, dueDate: "7th" },
    ];

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Payroll</h1>
                    <p className="text-sm sm:text-base text-gray-500 font-normal mt-1">Salary Register & Statutory Compliance</p>
                </div>
                <div className="flex gap-3">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="h-11 w-44 rounded-2xl border-gray-100 bg-white font-semibold">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 6 }).map((_, i) => {
                                const d = new Date();
                                d.setMonth(d.getMonth() - i);
                                const value = `${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                return <SelectItem key={value} value={value}>{d.toLocaleString('default', { month: 'long', year: 'numeric' })}</SelectItem>;
                            })}
                        </SelectContent>
                    </Select>
                    <Button onClick={() => setShowAddEmployee(true)} variant="outline" className="h-11 px-5 rounded-2xl border-gray-100 font-bold text-xs uppercase tracking-widest gap-2 bg-white hover:bg-gray-50">
                        <Plus className="w-4 h-4" /> Add Staff
                    </Button>
                    <Button 
                        onClick={() => setShowProcessConfirm(true)}
                        disabled={isProcessed || loading || employees.length === 0}
                        className="h-11 px-5 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-normal text-xs uppercase tracking-widest shadow-lg shadow-violet-500/30 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" /> {isProcessed ? "Already Processed" : "Run Payroll"}
                    </Button>
                </div>
            </div>

            {/* Educational Info Banner */}
            <div className="bg-violet-50/50 border border-violet-100 rounded-3xl p-5 flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-sm text-violet-600 shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-sm font-bold text-violet-900">
                        {view === "employees" && "Staff Register & Structure"}
                        {view === "processing" && "Slip Generation & Posting"}
                        {view === "compliance" && "Statutory Compliance (PF/ESIC/TDS)"}
                    </p>
                    <p className="text-xs text-violet-700/80 mt-1 leading-relaxed max-w-2xl">
                        {view === "employees" && "Manage your staff database and set up their salary structures (Basic, HRA, Allowances). Ensure all bank details are registered here before running payroll."}
                        {view === "processing" && "View and download monthly salary slips. 'Run Payroll' will create high-fidelity journal entries for Salary Payable and various statutory deductions."}
                        {view === "compliance" && "Track your monthly tax and provident fund liabilities. Ensure payments are made to the respective government departments before the due dates."}
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Gross Salary", value: `₹${totalGross.toLocaleString()}`, color: "from-violet-500 to-violet-600", bg: "from-violet-50", ring: "ring-violet-100" },
                    { label: "Net Payable", value: `₹${totalNet.toLocaleString()}`, color: "from-primary to-green-600", bg: "from-green-50", ring: "ring-green-100" },
                    { label: "PF Liability", value: `₹${totalPF.toLocaleString()}`, color: "from-blue-500 to-blue-600", bg: "from-blue-50", ring: "ring-blue-100" },
                    { label: "TDS Liability", value: `₹${totalTDS.toLocaleString()}`, color: "from-orange-500 to-accent", bg: "from-orange-50", ring: "ring-orange-100" },
                ].map(({ label, value, color, bg, ring }) => (
                    <Card key={label} className={`p-5 border-none shadow-lg rounded-3xl bg-gradient-to-br ${bg} via-white ${ring} ring-1`}>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
                        <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    </Card>
                ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-2 bg-gray-100/60 rounded-2xl p-1.5 w-fit">
                {([["employees", "Register"], ["processing", "Slips"], ["compliance", "Compliance"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setView(key)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${view === key ? "bg-white text-violet-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {view === "employees" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="rtable-wrap">
                        <table className="rtable">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-50">
                                    {["ID", "Employee", "Basic", "HRA", "Allowances", "Gross", "Deductions", "Net Pay"].map(h => (
                                        <th key={h} className="px-5 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading payroll...</td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-12 text-gray-400 italic text-sm font-semibold">No active staff registered in current database.</td></tr>
                                ) : employees.map((e: any) => {
                                    const gross = e.grossSalary || e.earnings?.grossPay || 0;
                                    const deds = (e.deductions?.totalDeductions || (e.deductions?.tds || 0) + (e.deductions?.pf || 0) + (e.deductions?.esic || 0));
                                    const net = e.netSalary || e.netPay || 0;
                                    return (
                                        <tr key={e._id || e.employeeId} className="hover:bg-gray-50/30 transition-colors">
                                            <td className="px-5 py-4 text-xs font-mono font-bold text-gray-500">{e.employeeId}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs uppercase">{e.employeeName?.[0]}</div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{e.employeeName}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{e.designation}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs font-semibold">₹{(e.basicSalary || e.earnings?.basic || 0).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-xs font-semibold">₹{(e.hra || e.earnings?.hra || 0).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-xs font-semibold">₹{(e.otherAllowances || e.earnings?.allowances || 0).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm font-bold">₹{gross.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-xs font-bold text-red-500">-₹{deds.toLocaleString()}</td>
                                            <td className="px-5 py-4 text-sm font-black text-violet-600">₹{net.toLocaleString()}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {view === "processing" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {employees.map(e => (
                        <Card key={e._id || e.employeeId} className="p-5 border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 hover:shadow-md transition-all group">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 flex items-center justify-center text-violet-700 font-black text-base border border-violet-100">{e.employeeName?.[0]}</div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 group-hover:text-violet-600 transition-colors">{e.employeeName}</p>
                                    <p className="text-xs text-gray-400 font-medium">{e.designation}</p>
                                </div>
                                <Badge className="bg-green-50 text-green-700 border-0">{e.status || "Posted"}</Badge>
                            </div>
                            <div className="space-y-2 py-3 border-y border-gray-50 mb-4">
                                <div className="flex justify-between text-xs font-medium text-gray-500"><span>Bank</span><span className="text-gray-900">{e.bankName || "—"}</span></div>
                                <div className="flex justify-between text-xs font-medium text-gray-500"><span>A/C No</span><span className="text-gray-900 font-mono tracking-tighter">{e.accountNumber ? `****${e.accountNumber.slice(-4)}` : "—"}</span></div>
                                <div className="flex justify-between text-xs font-medium text-gray-500"><span>Net Salary</span><span className="text-violet-600 font-bold">₹{(e.netSalary || e.netPay || 0).toLocaleString()}</span></div>
                            </div>
                            <Button size="sm" onClick={() => { setSelectedEmployee(e); setShowSlip(true); }} variant="outline" className="w-full h-10 rounded-xl text-xs font-bold border-violet-100 text-violet-600 hover:bg-violet-50 gap-2">
                                <FileText className="w-4 h-4" /> View Payslip
                            </Button>
                        </Card>
                    ))}
                </div>
            )}

            {view === "compliance" && (
                <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {compliance.map((c, i) => (
                            <div key={i} className="flex items-center justify-between px-8 py-6 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isProcessed ? "bg-green-50 text-green-600" : "bg-violet-50 text-violet-600"}`}>
                                        {isProcessed ? <CheckCircle2 className="w-6 h-6" /> : <Shield className="w-6 h-6 animate-pulse text-violet-300" />}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-gray-900">{c.task} — {month}</p>
                                        <p className="text-xs text-gray-400 font-medium mt-1">Payable on {c.dueDate}th | Total Liability: <span className="text-gray-900 font-bold">₹{c.amount.toLocaleString()}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Badge className={`px-3 py-1.5 rounded-xl border-0 text-xs font-bold ${isProcessed ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{isProcessed ? "Ready to File" : "Draft"}</Badge>
                                    <Button disabled={!isProcessed} className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-200">Pay Now</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Modals */}
            <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                <DialogContent className="max-w-xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader><DialogTitle className="text-2xl font-black text-gray-900">Add Employee</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-4">
                        <section className="col-span-2"><h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Plus className="w-3 h-3" /> Professional Info</h4></section>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Employee ID *</p><Input value={empId} onChange={e => setEmpId(e.target.value)} placeholder="EMP001" className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Full Name *</p><Input value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Full Name" className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Designation *</p><Input value={designation} onChange={e => setDesignation(e.target.value)} placeholder="e.g. SDE-2" className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Department *</p>
                            <Select onValueChange={setDepartment}><SelectTrigger className="h-11 rounded-2xl border-gray-100"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Operations">Operations</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Technology">Technology</SelectItem></SelectContent></Select>
                        </div>
                        <section className="col-span-2 pt-4"><h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Salary Structure (Monthly)</h4></section>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Basic Salary *</p><Input type="number" value={basic} onChange={e => setBasic(e.target.value)} className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">HRA</p><Input type="number" value={hra} onChange={e => setHra(e.target.value)} className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Deductions (TDS/PF)</p><Input type="number" value={tds} onChange={e => setTds(e.target.value)} className="h-11 rounded-2xl border-gray-100 text-red-500" /></div>
                        <section className="col-span-2 pt-4"><h4 className="text-xs font-black text-violet-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Landmark className="w-3 h-3" /> Disbursement Details</h4></section>
                        <div className="col-span-2"><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Bank Name</p><Input value={bankName} onChange={e => setBankName(e.target.value)} className="h-11 rounded-2xl border-gray-100" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">A/C Number</p><Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="h-11 rounded-2xl border-gray-100 font-mono" /></div>
                        <div><p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">IFSC Code</p><Input value={ifsc} onChange={e => setIfsc(e.target.value)} className="h-11 rounded-2xl border-gray-100 font-mono uppercase" /></div>
                    </div>
                    <DialogFooter className="gap-3 mt-4"><Button variant="outline" onClick={() => setShowAddEmployee(false)} className="flex-1 h-12 rounded-2xl border-gray-100">Cancel</Button><Button onClick={handleAddEmployee} className="flex-1 h-12 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-xs">Register Staff</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payslip View Modal */}
            <Dialog open={showSlip} onOpenChange={setShowSlip}>
                <DialogContent className="max-w-md rounded-[32px] p-0 border-none shadow-2xl overflow-hidden">
                    {selectedEmployee && (
                        <>
                            <div className="bg-gradient-to-br from-violet-600 to-violet-700 p-8 text-white">
                                <h2 className="text-xl font-black italic tracking-tight mb-4">GrocMed Salary Slip</h2>
                                <div className="flex justify-between items-end">
                                    <div><p className="text-sm font-bold">{selectedEmployee.employeeName}</p><p className="text-xs opacity-70 uppercase tracking-widest font-bold">{selectedEmployee.designation}</p></div>
                                    <div className="text-right"><p className="text-xs font-bold opacity-70">PERIOD</p><p className="text-sm font-black">{month}</p></div>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <section className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 mb-3">Earnings</p>
                                    <div className="flex justify-between text-sm font-semibold text-gray-600"><span>Basic Salary</span><span>₹{(selectedEmployee.basicSalary || selectedEmployee.earnings?.basic || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between text-sm font-semibold text-gray-600"><span>Allowances</span><span>₹{(selectedEmployee.otherAllowances || selectedEmployee.earnings?.allowances || 0).toLocaleString()}</span></div>
                                </section>
                                <section className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 mb-3">Deductions</p>
                                    <div className="flex justify-between text-sm font-semibold text-red-500"><span>TDS / PF</span><span>-₹{(selectedEmployee.deductions?.tds || 0).toLocaleString()}</span></div>
                                </section>
                                <div className="bg-gray-50 rounded-2xl p-5 flex justify-between items-center ring-1 ring-gray-100 shadow-inner">
                                    <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Disbursed</p><p className="text-2xl font-black text-gray-900 tracking-tighter">₹{(selectedEmployee.netSalary || selectedEmployee.netPay || 0).toLocaleString()}</p></div>
                                    <div className="text-right text-[10px] font-bold text-gray-400 uppercase leading-tight"><p>{selectedEmployee.bankName}</p><p>A/C ****{selectedEmployee.accountNumber?.slice(-4)}</p></div>
                                </div>
                                <Button className="w-full h-12 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-widest text-xs gap-3 shadow-xl" onClick={() => downloadPayslipPDF(selectedEmployee, month)}>
                                    <Download className="w-4 h-4" /> Download PDF Slip
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Run Payroll Confirmation Modal */}
            <Dialog open={showProcessConfirm} onOpenChange={setShowProcessConfirm}>
                <DialogContent className="max-w-md rounded-[32px] p-0 max-h-[90vh] overflow-y-auto custom-scrollbar border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-16 h-16 rounded-3xl bg-violet-50 flex items-center justify-center mb-4 ring-8 ring-violet-50/50 mx-auto">
                            <Download className="w-8 h-8 text-violet-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-gray-900 text-center">Run Payroll for {month}?</DialogTitle>
                        <p className="text-sm text-gray-500 font-normal mt-2 text-center">
                            You are about to generate salary slips and book accounting entries for <strong>{employees.length} employees</strong>.
                        </p>
                    </DialogHeader>

                    <div className="bg-gray-50/50 rounded-2xl p-5 my-6 border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Payable</span>
                            <span className="text-sm font-black text-gray-900">₹{totalGross.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Net Disbursement</span>
                            <span className="text-sm font-black text-violet-600">₹{totalNet.toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Books Salary Expense
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
                                <CheckCircle2 className="w-3 h-3 text-green-500" /> Records Statutory Payables
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3 sm:flex-row flex-col">
                        <Button variant="outline" onClick={() => setShowProcessConfirm(false)} className="flex-1 h-12 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest text-gray-500">
                            Cancel
                        </Button>
                        <Button onClick={handleProcessPayroll} className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-500/30">
                            Confirm & Post
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Payroll;
