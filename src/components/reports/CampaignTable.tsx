"use client";

import { useState } from "react";
import { CampaignMetricRow } from "@/lib/queries/metrics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface CampaignTableProps {
  campaigns: CampaignMetricRow[];
}

type SortField = "campaign_name" | "provider" | "spend" | "impressions" | "clicks" | "conversions" | "cpa" | "ctr";

export function CampaignTable({ campaigns }: CampaignTableProps) {
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for numeric columns
    }
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];

    if (typeof aVal === "string") {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }

    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);

  const formatNumber = (val: number) => new Intl.NumberFormat("en-US").format(val);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1.5 h-3 w-3 text-slate-400" />;
    }
    return sortAsc ? (
      <ArrowUp className="ml-1.5 h-3 w-3 text-blue-600" />
    ) : (
      <ArrowDown className="ml-1.5 h-3 w-3 text-blue-600" />
    );
  };

  const getProviderBadge = (provider: string) => {
    if (provider === "google_ads") {
      return (
        <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          Google Ads
        </Badge>
      );
    }
    if (provider === "meta_ads") {
      return (
        <Badge variant="outline" className="border-indigo-300 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          Meta Ads
        </Badge>
      );
    }
    if (provider === "ga4") {
      return (
        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          GA4 Analytics
        </Badge>
      );
    }
    return <Badge variant="secondary">{provider}</Badge>;
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
              Campaign Performance Breakdown
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
              Detailed metrics per active campaign channel
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {campaigns.length} Campaigns
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none text-xs font-semibold"
                onClick={() => handleSort("campaign_name")}
              >
                <div className="flex items-center">
                  Campaign Name {renderSortIcon("campaign_name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs font-semibold"
                onClick={() => handleSort("provider")}
              >
                <div className="flex items-center">
                  Platform {renderSortIcon("provider")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("spend")}
              >
                <div className="flex items-center justify-end">
                  Spend {renderSortIcon("spend")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("impressions")}
              >
                <div className="flex items-center justify-end">
                  Impressions {renderSortIcon("impressions")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("clicks")}
              >
                <div className="flex items-center justify-end">
                  Clicks {renderSortIcon("clicks")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("conversions")}
              >
                <div className="flex items-center justify-end">
                  Conversions {renderSortIcon("conversions")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("cpa")}
              >
                <div className="flex items-center justify-end">
                  CPA {renderSortIcon("cpa")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-right text-xs font-semibold"
                onClick={() => handleSort("ctr")}
              >
                <div className="flex items-center justify-end">
                  CTR {renderSortIcon("ctr")}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedCampaigns.map((row, idx) => (
              <TableRow key={`${row.campaign_name}_${row.provider}_${idx}`}>
                <TableCell className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                  {row.campaign_name}
                </TableCell>
                <TableCell className="text-xs">
                  {getProviderBadge(row.provider)}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900 dark:text-slate-100 text-xs">
                  {formatCurrency(row.spend)}
                </TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-400 text-xs">
                  {formatNumber(row.impressions)}
                </TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-400 text-xs">
                  {formatNumber(row.clicks)}
                </TableCell>
                <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                  {formatNumber(row.conversions)}
                </TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-400 text-xs">
                  {formatCurrency(row.cpa)}
                </TableCell>
                <TableCell className="text-right text-slate-600 dark:text-slate-400 text-xs">
                  {row.ctr.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
