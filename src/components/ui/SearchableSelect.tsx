import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between h-12 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white transition-all px-4 font-bold text-sm",
                        className
                    )}
                >
                    {value ? value : <span className="text-gray-400 font-medium">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                <Command>
                    <CommandInput
                        placeholder={`Search ${placeholder.toLowerCase()}...`}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList className="max-h-[200px] custom-scrollbar">
                        <CommandEmpty className="py-2 px-1">
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 h-10 px-3 text-primary font-bold text-xs rounded-xl"
                                onClick={() => {
                                    onChange(search);
                                    setOpen(false);
                                }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add "{search}"
                            </Button>
                        </CommandEmpty>
                        <CommandGroup>
                            {filteredOptions.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                    }}
                                    className="py-3 px-4 aria-selected:bg-primary/5 aria-selected:text-primary cursor-pointer font-bold text-sm"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
