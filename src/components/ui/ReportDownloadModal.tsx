import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Calendar, Download, CheckCircle2, Clock, CalendarDays, BarChart2, Filter, Sparkles
} from "lucide-react";

export type ReportPreset = "daily" | "weekly" | "monthly" | "yearly" | "all" | "custom";

export interface DateRangeFilter {
    preset: ReportPreset;
    startDate: Date | null;
    endDate: Date | null;
}

interface ReportDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    onGenerate: (filter: DateRangeFilter) => void;
}

export const ReportDownloadModal: React.FC<ReportDownloadModalProps> = ({
    isOpen,
    onClose,
    title = "Generate & Export Report",
    description = "Select time period or date range for your report download.",
    onGenerate,
}) => {
    const [preset, setPreset] = useState<ReportPreset>("monthly");
    const [customFrom, setCustomFrom] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [customTo, setCustomTo] = useState(() => new Date().toISOString().split('T')[0]);

    const presets: { id: ReportPreset; label: string; desc: string; icon: any }[] = [
        { id: "daily", label: "Daily", desc: "Today's activity", icon: Clock },
        { id: "weekly", label: "Weekly", desc: "Last 7 days", icon: CalendarDays },
        { id: "monthly", label: "Monthly", desc: "Last 30 days", icon: Calendar },
        { id: "yearly", label: "Yearly", desc: "Current year", icon: BarChart2 },
        { id: "all", label: "All Time", desc: "Full history", icon: Sparkles },
        { id: "custom", label: "Custom Range", desc: "Pick From & To date", icon: Filter },
    ];

    const handleConfirm = () => {
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        const now = new Date();

        if (preset === "daily") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (preset === "weekly") {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (preset === "monthly") {
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (preset === "yearly") {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        } else if (preset === "custom") {
            if (customFrom) {
                startDate = new Date(customFrom);
                startDate.setHours(0, 0, 0, 0);
            }
            if (customTo) {
                endDate = new Date(customTo);
                endDate.setHours(23, 59, 59, 999);
            }
        }

        onGenerate({ preset, startDate, endDate });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg rounded-[36px] p-6 sm:p-8 border-none shadow-2xl bg-white max-h-[90vh] overflow-y-auto custom-scrollbar">
                <DialogHeader>
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 ring-8 ring-primary/5 mx-auto">
                        <Download className="w-7 h-7 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl sm:text-3xl font-black text-gray-900 text-center tracking-tight">
                        {title}
                    </DialogTitle>
                    <p className="text-xs sm:text-sm text-gray-500 font-normal text-center mt-1">
                        {description}
                    </p>
                </DialogHeader>

                {/* Range Selector Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
                    {presets.map((item) => {
                        const Icon = item.icon;
                        const isSelected = preset === item.id;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setPreset(item.id)}
                                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative flex flex-col justify-between ${
                                    isSelected
                                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                        : "border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200"
                                }`}
                            >
                                <div className="flex items-center justify-between w-full mb-2">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary text-white" : "bg-white text-gray-400"}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                </div>
                                <div>
                                    <p className={`text-xs font-bold ${isSelected ? "text-primary" : "text-gray-900"}`}>{item.label}</p>
                                    <p className="text-[10px] text-gray-400 font-normal mt-0.5">{item.desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Custom Date Range Picker */}
                {preset === "custom" && (
                    <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Custom Date Range</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase">From Date</Label>
                                <Input
                                    type="date"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-semibold"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold text-gray-400 uppercase">To Date</Label>
                                <Input
                                    type="date"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                    className="h-11 rounded-xl bg-white border-gray-200 text-xs font-semibold"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:flex-row flex-col mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 h-12 rounded-2xl border-gray-200 font-normal text-xs uppercase tracking-widest text-gray-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 gap-2"
                    >
                        <Download className="w-4 h-4" /> Download Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
