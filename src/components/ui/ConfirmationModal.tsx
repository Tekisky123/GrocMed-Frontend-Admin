import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "primary" | "destructive" | "info";
    isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "primary",
    isLoading = false,
}) => {
    const getIcon = () => {
        switch (variant) {
            case "destructive":
                return <Trash2 className="w-6 h-6 text-red-500" />;
            case "info":
                return <Info className="w-6 h-6 text-blue-500" />;
            default:
                return <AlertTriangle className="w-6 h-6 text-accent" />;
        }
    };

    const getButtonClass = () => {
        switch (variant) {
            case "destructive":
                return "bg-red-500 hover:bg-red-600 text-white shadow-red-200";
            case "info":
                return "bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200";
            default:
                return "bg-accent hover:bg-accent/90 text-white shadow-accent/20";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="max-w-[400px] rounded-[32px] p-8 border-none shadow-2xl">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${variant === "destructive" ? "bg-red-50" :
                        variant === "info" ? "bg-blue-50" : "bg-orange-50"
                        }`}>
                        {getIcon()}
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-gray-900 tracking-tight">
                            {title}
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-400 font-bold pt-2">
                            {description}
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="w-full flex sm:flex-row flex-col gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-12 flex-1 rounded-2xl border-gray-100 font-bold uppercase text-xs tracking-widest text-gray-500 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-200 transition-all"
                        >
                            {cancelText}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`h-12 flex-1 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg transition-all active:scale-95 ${getButtonClass()}`}
                        >
                            {isLoading ? "Processing..." : confirmText}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
