"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/features/auth/auth.store";
import { companiesService } from "@/features/companies/companies.service";
import { Branch, CompanyUser } from "@/features/companies/types";
import { useRouter } from "next/navigation";

export function BranchSelector() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const { companyId, branchId, setCompanyId, setBranchId } = useAuthStore();
    const [companies, setCompanies] = useState<CompanyUser[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    // Fetch companies on mount
    useEffect(() => {
        async function fetchCompanies() {
            try {
                const data = await companiesService.getUserCompanies();
                setCompanies(data);

                // If company selected, fetch branches
                if (companyId) {
                    fetchBranches(companyId);
                }
            } catch (error) {
                console.error("Failed to fetch companies", error);
            }
        }
        fetchCompanies();
    }, []);

    // Fetch branches when company changes
    async function fetchBranches(companyId: string) {
        try {
            setLoading(true);
            const data = await companiesService.getCompanyBranches(companyId);
            setBranches(data);
        } catch (error) {
            console.error("Failed to fetch branches", error);
        } finally {
            setLoading(false);
        }
    }

    const selectedCompany = companies.find((c) => c.company.id === companyId);
    const selectedBranch = branches.find((b) => b.id === branchId);

    const handleSelectCompany = async (company: CompanyUser) => {
        if (company.company.id === companyId) return;

        setCompanyId(company.company.id);
        setBranchId(null); // Reset branch
        await fetchBranches(company.company.id);
    };

    const handleSelectBranch = (branch: Branch) => {
        setBranchId(branch.id);
        setOpen(false);
        router.refresh(); // Refresh data with new context
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {selectedBranch ? (
                        <span className="truncate">{selectedBranch.name}</span>
                    ) : selectedCompany ? (
                        <span className="truncate text-muted-foreground">Select Branch...</span>
                    ) : (
                        <span className="truncate text-muted-foreground">Select Company...</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search company/branch..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>

                        {/* Companies Section */}
                        <CommandGroup heading="Companies">
                            {companies.map((c) => (
                                <CommandItem
                                    key={c.company.id}
                                    onSelect={() => handleSelectCompany(c)}
                                    className="text-sm"
                                >
                                    <Store className="mr-2 h-4 w-4" />
                                    {c.company.name}
                                    {companyId === c.company.id && (
                                        <Check className="ml-auto h-4 w-4" />
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandSeparator />

                        {/* Branches Section (if company selected) */}
                        {companyId && (
                            <CommandGroup heading="Branches">
                                {loading && <CommandItem disabled>Loading branches...</CommandItem>}
                                {branches.map((b) => (
                                    <CommandItem
                                        key={b.id}
                                        onSelect={() => handleSelectBranch(b)}
                                    >
                                        <span>{b.name}</span>
                                        {branchId === b.id && (
                                            <Check className="ml-auto h-4 w-4" />
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
