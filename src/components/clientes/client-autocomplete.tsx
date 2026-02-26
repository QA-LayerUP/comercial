"use client";

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
import { CreateClientDialog } from "./create-client-dialog";
import type { Cliente } from "@/lib/types/database";

interface ClientAutocompleteProps {
    clientes: Cliente[];
    defaultValue?: { id: number; nome: string };
    onSelect: (client: { id: number; nome: string } | null) => void;
    className?: string;
}

export function ClientAutocomplete({
    clientes,
    defaultValue,
    onSelect,
    className,
}: ClientAutocompleteProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue?.id?.toString() || "");
    const [searchTerm, setSearchTerm] = React.useState("");

    const selectedClient = React.useMemo(
        () => clientes.find((c) => c.id.toString() === value),
        [clientes, value]
    );

    const handleSelect = (currentName: string) => {
        const client = clientes.find((c) => c.nome.toLowerCase() === currentName.toLowerCase());
        const newValue = client ? client.id.toString() : "";

        setValue(newValue);
        setOpen(false);
        onSelect(client ? { id: client.id, nome: client.nome } : null);
    };

    const handleCreateSuccess = (newClient: { id: number; nome: string }) => {
        setValue(newClient.id.toString());
        onSelect(newClient);
        setOpen(false);
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="flex-1 justify-between h-10 bg-[#F5F6FA] border-transparent hover:bg-[#F5F6FA] text-left font-normal overflow-hidden"
                    >
                        <span className="truncate">
                            {selectedClient ? selectedClient.nome : "Selecionar cliente..."}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Buscar cliente..."
                            onValueChange={setSearchTerm}
                        />
                        <CommandList>
                            <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground flex flex-col gap-2">
                                <span>Nenhum cliente encontrado.</span>
                                <CreateClientDialog
                                    onSuccess={handleCreateSuccess}
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="justify-start px-2 text-[#E91E8C] hover:text-[#E91E8C] hover:bg-[#E91E8C]/10"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Cadastrar "{searchTerm}"
                                        </Button>
                                    }
                                />
                            </CommandEmpty>
                            <CommandGroup>
                                {clientes.map((cliente) => (
                                    <CommandItem
                                        key={cliente.id}
                                        value={cliente.nome}
                                        onSelect={() => handleSelect(cliente.nome)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === cliente.id.toString()
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        {cliente.nome}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <CreateClientDialog
                onSuccess={handleCreateSuccess}
                trigger={
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0 bg-[#F5F6FA] border-transparent hover:bg-[#F5F6FA]"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                }
            />
        </div>
    );
}
