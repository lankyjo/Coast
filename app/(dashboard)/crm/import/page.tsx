"use client";

import { useState, useRef } from "react";
import { importProspects } from "@/actions/prospect.actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ParsedRow {
    business_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    market?: string;
    category?: string;
    rating_score?: number;
    rating_notes?: string;
    notes?: string;
    tags?: string[];
    [key: string]: unknown;
}

function parseCSV(text: string): ParsedRow[] {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, unknown> = {};

        headers.forEach((header, idx) => {
            if (values[idx]) {
                if (header === "weakness_score" || header === "rating_score") {
                    row["rating_score"] = parseInt(values[idx]) || 3;
                } else if (header === "weakness_notes" || header === "rating_notes") {
                    row["rating_notes"] = values[idx];
                } else if (header === "tags") {
                    row[header] = values[idx].split(";").map((t: string) => t.trim()).filter(Boolean);
                } else {
                    row[header] = values[idx];
                }
            }
        });

        if (row.business_name) {
            rows.push(row as ParsedRow);
        }
    }

    return rows;
}

export default function ImportPage() {
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [fileName, setFileName] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setResult(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const rows = parseCSV(text);
            setParsedRows(rows);
            if (rows.length === 0) {
                toast.error("No valid rows found. Ensure CSV has a 'business_name' column.");
            }
        };
        reader.readAsText(file);
    }

    async function handleImport() {
        if (parsedRows.length === 0) return;

        setIsImporting(true);
        try {
            const res = await importProspects(parsedRows as any);
            if (res.data) {
                setResult(res.data);
                toast.success(`Imported ${res.data.imported} prospects`);
            } else if (res.error) {
                toast.error(res.error);
            }
        } catch {
            toast.error("Import failed");
        } finally {
            setIsImporting(false);
        }
    }

    const EXPECTED_COLUMNS = [
        "business_name",
        "owner_name",
        "email",
        "phone",
        "website",
        "address",
        "market",
        "category",
        "rating_score",
        "rating_notes",
        "notes",
        "tags",
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/crm" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to CRM
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Import Prospects</h1>
                    <p className="text-sm text-muted-foreground">
                        Upload a CSV file to bulk-import prospects
                    </p>
                </div>
            </div>

            {/* Instructions */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm">CSV Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Your CSV should include headers matching these columns. Only{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">business_name</code> is required.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {EXPECTED_COLUMNS.map((col) => (
                            <Badge key={col} variant="outline" className="text-[11px] font-mono">
                                {col}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Duplicates (same business_name + market) will be skipped automatically.
                        Use semicolons for multiple tags (e.g. <code className="bg-muted px-1 rounded">high-priority;referral</code>).
                    </p>
                </CardContent>
            </Card>

            {/* Upload */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-6">
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {parsedRows.length === 0 ? (
                        <button
                            onClick={() => fileRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                        >
                            <Upload className="h-10 w-10" />
                            <div className="text-center">
                                <p className="font-medium">Click to upload CSV</p>
                                <p className="text-xs">or drag and drop</p>
                            </div>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-sm font-medium">{fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {parsedRows.length} rows parsed
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setParsedRows([]);
                                            setResult(null);
                                            setFileName("");
                                            if (fileRef.current) fileRef.current.value = "";
                                        }}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleImport}
                                        disabled={isImporting}
                                    >
                                        {isImporting
                                            ? "Importing..."
                                            : `Import ${parsedRows.length} Prospects`}
                                    </Button>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="rounded-lg border overflow-auto max-h-96">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs">#</TableHead>
                                            <TableHead className="text-xs">Business Name</TableHead>
                                            <TableHead className="text-xs">Owner</TableHead>
                                            <TableHead className="text-xs">Email</TableHead>
                                            <TableHead className="text-xs">Market</TableHead>
                                            <TableHead className="text-xs">Category</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedRows.slice(0, 50).map((row, i) => (
                                            <TableRow key={i} className="text-xs">
                                                <TableCell>{i + 1}</TableCell>
                                                <TableCell className="font-medium">{row.business_name}</TableCell>
                                                <TableCell>{row.owner_name || "—"}</TableCell>
                                                <TableCell>{row.email || "—"}</TableCell>
                                                <TableCell>{row.market || "—"}</TableCell>
                                                <TableCell>{row.category || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {parsedRows.length > 50 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Showing first 50 of {parsedRows.length} rows
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Result */}
            {result && (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <h3 className="font-semibold">Import Complete</h3>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-green-50 p-3 text-center">
                                <p className="text-2xl font-bold text-green-700">{result.imported}</p>
                                <p className="text-xs text-green-600">Imported</p>
                            </div>
                            <div className="rounded-lg bg-yellow-50 p-3 text-center">
                                <p className="text-2xl font-bold text-yellow-700">{result.skipped}</p>
                                <p className="text-xs text-yellow-600">Skipped (duplicates)</p>
                            </div>
                            <div className="rounded-lg bg-red-50 p-3 text-center">
                                <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
                                <p className="text-xs text-red-600">Errors</p>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div className="mt-4 space-y-1">
                                {result.errors.slice(0, 5).map((err, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-red-600">
                                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                        {err}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
