import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";

export default function AdminActivityPage() {
  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div>
        <h1 className="font-display text-[28px] leading-tight tracking-tightish">
          Activity
        </h1>
        <p className="mt-1 text-[13px] text-ink-tertiary">
          Audit log of admin actions and engine events.
        </p>
      </div>

      <Card>
        <div className="px-6 py-16 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full border border-line-subtle bg-bg-base flex items-center justify-center text-ink-tertiary">
            <Activity size={20} strokeWidth={1.5} />
          </div>
          <h3 className="mt-4 text-[15px] font-medium text-ink-primary">
            No activity to show
          </h3>
          <p className="mt-2 text-[13px] text-ink-secondary max-w-md">
            Once the strategy engine is wired up and admin actions are
            audit-logged, recent events will appear here. For now this page
            is a placeholder.
          </p>
        </div>
      </Card>
    </div>
  );
}
