import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        404 — Page Not Found
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
        The page or report resource you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link href="/dashboard">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
