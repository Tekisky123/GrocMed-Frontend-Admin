import * as React from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = "Select option...",
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const filtered = React.useMemo(
        () =>
            options.filter((o) =>
                o.toLowerCase().includes(search.toLowerCase())
            ),
        [options, search]
    );

    // Close on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleOpen = () => {
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleSelect = (option: string) => {
        onChange(option === value ? "" : option);
        setOpen(false);
        setSearch("");
    };

    const handleAdd = () => {
        if (search.trim()) {
            onChange(search.trim());
            setOpen(false);
            setSearch("");
        }
    };

    const showAdd = search.trim() && !options.some(o => o.toLowerCase() === search.toLowerCase().trim());

    return (
        <div ref={containerRef} className="relative w-full">
            {/* Trigger */}
            <button
                type="button"
                onClick={handleOpen}
                className={cn(
                    "w-full flex items-center justify-between h-14 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-all px-4 text-sm font-normal text-left",
                    open && "ring-2 ring-primary/20 border-primary/30 bg-white",
                    className
                )}
            >
                <span className={value ? "text-gray-900 font-bold" : "text-gray-400"}>
                    {value || placeholder}
                </span>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                    {value && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-3 h-3 text-gray-400" />
                        </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-40" />
                </div>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-[calc(100%+6px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="px-3 pt-3 pb-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Search ${placeholder.toLowerCase()}...`}
                            className="w-full h-9 px-3 text-sm rounded-xl border border-gray-100 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 font-normal placeholder:text-gray-300"
                        />
                    </div>

                    {/* Options list */}
                    <div className="max-h-[220px] overflow-y-auto">
                        {filtered.length === 0 && !showAdd && (
                            <p className="text-xs text-gray-400 text-center py-4 font-normal">No results found</p>
                        )}

                        {filtered.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // prevent input blur
                                onClick={() => handleSelect(option)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-accent/10 hover:text-accent cursor-pointer",
                                    value === option && "bg-accent/10 text-accent font-bold"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        value === option ? "opacity-100 text-accent" : "opacity-0"
                                    )}
                                />
                                {option}
                            </button>
                        ))}

                        {showAdd && (
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleAdd}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary font-bold hover:bg-primary/5 transition-colors cursor-pointer border-t border-gray-50"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add "{search}"
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
