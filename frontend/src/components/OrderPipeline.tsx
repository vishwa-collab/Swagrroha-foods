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
  stepNumber: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'PLACED',           label: 'Order Placed',    shortLabel: 'Placed',    stepNumber: 1, icon: PackageCheck },
  { key: 'CONFIRMED',        label: 'Order Confirmed', shortLabel: 'Confirmed', stepNumber: 2, icon: CheckCircle2 },
  { key: 'PREPARING',        label: 'Preparing Food',  shortLabel: 'Preparing', stepNumber: 3, icon: ChefHat },
  { key: 'READY',            label: 'Ready & Packed',  shortLabel: 'Packed',    stepNumber: 4, icon: Package },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery',shortLabel: 'On Route',  stepNumber: 5, icon: Truck },
  { key: 'DELIVERED',        label: 'Delivered',       shortLabel: 'Delivered', stepNumber: 6, icon: Home },
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
    <div className="w-full select-none py-2">
      {/* ── Desktop & Tablet Horizontal Pipeline ── */}
      <div className="hidden sm:block max-w-3xl mx-auto px-4">
        <div className="relative">
          
          {/* Track Line — EXACTLY through the vertical center of the 40px circles (top: 20px) */}
          <div className="absolute left-5 right-5 top-5 -translate-y-1/2 h-1 bg-slate-200 rounded-full z-0" />
          
          {/* Active Progress Line Fill */}
          <div 
            className="absolute left-5 top-5 -translate-y-1/2 h-1 bg-emerald-600 rounded-full z-0 transition-all duration-500 ease-in-out"
            style={{ width: `calc((100% - 40px) * ${activeIdx / (PIPELINE_STAGES.length - 1)})` }}
          />

          {/* Stepper Nodes */}
          <div className="relative z-10 flex items-start justify-between">
            {PIPELINE_STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCompleted = idx < activeIdx;
              const isCurrent = idx === activeIdx;
              const canClick = interactive && !disabled;

              return (
                <div 
                  key={stage.key}
                  className="flex flex-col items-center cursor-default group"
                  style={{ width: '80px' }}
                  onClick={() => {
                    if (canClick && onSelectStage) {
                      onSelectStage(stage.key);
                    }
                  }}
                >
                  {/* Circle Node (40px x 40px) — centered perfectly with top-5 track */}
                  <button
                    type="button"
                    disabled={!canClick}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200
                      ${canClick ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}
                      ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-white'
                          : isCurrent
                          ? 'bg-brand-500 text-white shadow-md ring-4 ring-brand-100 scale-105'
                          : 'bg-white text-slate-400 border-2 border-slate-300 ring-4 ring-white'
                      }
                    `}
                    title={canClick ? `Switch stage to: ${stage.label}` : stage.label}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </button>

                  {/* Stage Label Below Circle */}
                  <div className="mt-2.5 text-center">
                    <p className={`text-xs leading-tight font-bold ${
                      isCurrent 
                        ? 'text-brand-600 font-extrabold' 
                        : isCompleted 
                        ? 'text-slate-800' 
                        : 'text-slate-400'
                    }`}>
                      {compact ? stage.shortLabel : stage.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* ── Mobile Vertical Pipeline ── */}
      <div className="sm:hidden px-2">
        <div className="relative pl-6 space-y-4">
          
          {/* Vertical Track Line — centered at x: 16px (middle of 32px circle) */}
          <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-200 -translate-x-1/2 z-0" />
          <div 
            className="absolute left-[27px] top-4 w-0.5 bg-emerald-600 -translate-x-1/2 z-0 transition-all duration-500"
            style={{ height: `${progressPercent}%` }}
          />

          {PIPELINE_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCompleted = idx < activeIdx;
            const isCurrent = idx === activeIdx;
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
                  relative z-10 flex items-center gap-3 py-1 transition-all
                  ${canClick ? 'cursor-pointer' : ''}
                `}
              >
                {/* Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs transition-all shadow-sm ring-4 ring-white
                    ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-brand-500 text-white ring-brand-100 scale-105'
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>

                {/* Text Label */}
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className={`text-xs font-bold ${
                    isCurrent ? 'text-brand-600 font-extrabold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}>
                    {stage.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
