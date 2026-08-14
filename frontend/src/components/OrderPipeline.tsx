import React from 'react';
import { OrderStageStatus } from '../context/CartContext';
import { 
  PackageCheck, 
  CheckCircle2, 
  ChefHat, 
  Package, 
  Truck, 
  Home, 
  Check 
} from 'lucide-react';

export interface PipelineStageConfig {
  key: OrderStageStatus;
  label: string;
  shortLabel: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'PLACED',           label: 'Order Placed',    shortLabel: 'Placed',    desc: 'Order received',                  icon: PackageCheck },
  { key: 'CONFIRMED',        label: 'Order Confirmed', shortLabel: 'Confirmed', desc: 'Accepted & payment verified',    icon: CheckCircle2 },
  { key: 'PREPARING',        label: 'Preparing Food',  shortLabel: 'Preparing', desc: 'Cooking fresh in kitchen',        icon: ChefHat },
  { key: 'READY',            label: 'Ready & Packed',  shortLabel: 'Ready',     desc: 'Packed & sealed for dispatch',    icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',shortLabel: 'On Route',  desc: 'On scooty route to your area',    icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered',       shortLabel: 'Delivered', desc: 'Enjoy your homemade food!',       icon: Home },
];

interface OrderPipelineProps {
  currentStatus: OrderStageStatus;
  interactive?: boolean;
  onSelectStage?: (stage: OrderStageStatus) => void;
  disabled?: boolean;
  compact?: boolean;
}

export const OrderPipeline: React.FC<OrderPipelineProps> = ({
  currentStatus,
  interactive = false,
  onSelectStage,
  disabled = false,
  compact = false,
}) => {
  const currentIndex = PIPELINE_STAGES.findIndex(s => s.key === currentStatus);
  const activeIdx = currentIndex === -1 ? 0 : currentIndex;
  const progressPercent = (activeIdx / (PIPELINE_STAGES.length - 1)) * 100;

  return (
    <div className="w-full select-none">
      {/* ── Desktop & Tablet Horizontal Pipeline ── */}
      <div className="hidden sm:block">
        <div className="relative flex items-center justify-between">
          
          {/* Background Gray Connecting Track */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 bg-slate-200 rounded-full z-0" />

          {/* Active Gradient Filled Progress Bar */}
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2 bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Stage Step Nodes */}
          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isPending = idx > activeIdx;
            const canClick = interactive && !disabled;

            return (
              <div 
                key={stage.key} 
                className="relative z-10 flex flex-col items-center group cursor-default"
                onClick={() => {
                  if (canClick && onSelectStage) {
                    onSelectStage(stage.key);
                  }
                }}
              >
                {/* Node Circle */}
                <div
                  className={`
                    w-11 h-11 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 shadow-md
                    ${canClick ? 'cursor-pointer hover:scale-115 active:scale-95' : ''}
                    ${
                      isCurrent
                        ? 'bg-brand-500 text-white ring-4 ring-brand-400/40 scale-110 shadow-lg shadow-brand-500/30'
                        : isCompleted
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-white text-slate-400 border-2 border-slate-300 hover:border-slate-400'
                    }
                  `}
                  title={canClick ? `Click to switch stage to: ${stage.label}` : stage.label}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>

                {/* Node Label */}
                <div className={`mt-2 text-center max-w-[100px] transition-all ${compact ? 'text-[11px]' : 'text-xs'}`}>
                  <p className={`font-extrabold leading-tight ${
                    isCurrent 
                      ? 'text-brand-600 font-black' 
                      : isCompleted 
                      ? 'text-slate-900' 
                      : 'text-slate-400'
                  }`}>
                    {compact ? stage.shortLabel : stage.label}
                  </p>
                  {!compact && (
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {stage.desc}
                    </p>
                  )}
                </div>

                {/* Interactive Click Hint Pill for Admin */}
                {interactive && isCurrent && (
                  <span className="absolute -top-6 bg-slate-900 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow animate-bounce">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile Vertical Pipeline ── */}
      <div className="sm:hidden space-y-3 relative pl-2">
        {/* Vertical Connecting Line */}
        <div className="absolute left-6 top-5 bottom-5 w-1 bg-slate-200 -translate-x-1/2 z-0 rounded-full" />
        <div 
          className="absolute left-6 top-5 w-1 bg-gradient-to-b from-amber-500 via-brand-500 to-emerald-500 -translate-x-1/2 z-0 rounded-full transition-all duration-700"
          style={{ height: `${progressPercent}%` }}
        />

        {PIPELINE_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isCompleted = idx < activeIdx;
          const isCurrent = idx === activeIdx;
          const isPending = idx > activeIdx;
          const canClick = interactive && !disabled;

          return (
            <div
              key={stage.key}
              onClick={() => {
                if (canClick && onSelectStage) {
                  onSelectStage(stage.key);
                }
              }}
              className={`
                relative z-10 flex items-center gap-3 p-2.5 rounded-2xl transition-all
                ${isCurrent ? 'bg-brand-50 border border-brand-200' : ''}
                ${canClick ? 'cursor-pointer hover:bg-slate-50' : ''}
              `}
            >
              {/* Circle */}
              <div
                className={`
                  w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all shadow-sm
                  ${
                    isCurrent
                      ? 'bg-brand-500 text-white ring-4 ring-brand-400/30 scale-105'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-400 border-2 border-slate-300'
                  }
                `}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`text-xs font-bold ${
                    isCurrent ? 'text-brand-600 font-black' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </p>
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      ✓ Done
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] font-black text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
